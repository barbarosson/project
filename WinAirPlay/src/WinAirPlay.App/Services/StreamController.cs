using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using WinAirPlay.App.Localization;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Discovery;
using WinAirPlay.Core.Raop;

namespace WinAirPlay.App.Services;

public enum StreamState
{
    Idle,
    Scanning,
    Connecting,
    Streaming,
    Stopping,
    Faulted,
}

public sealed record StreamSettings(
    string? CaptureDeviceId,
    RaopStreamCodec Codec,
    int LatencyMs,
    double VolumeDb,
    bool UseEncryption = false,
    bool MuteLocalSpeakers = true);

public sealed record StreamStatistics(
    TimeSpan Position,
    long PacketsSent,
    long BytesSent,
    long SyncPacketsSent,
    long TimingRequests,
    TimeSpan Latency,
    PcmLevel Level,
    RaopStreamCodec Codec,
    bool IsEncrypted,
    string? CaptureDeviceName)
{
    public static readonly StreamStatistics Empty = new(
        TimeSpan.Zero, 0, 0, 0, 0, TimeSpan.Zero, PcmLevel.Silent,
        RaopStreamCodec.AppleLossless, false, null);
}

public interface IStreamController : IAsyncDisposable
{
    StreamState State { get; }

    AirPlayDevice? ConnectedDevice { get; }

    StreamStatistics Statistics { get; }

    event EventHandler<StreamState>? StateChanged;

    event EventHandler<string>? StatusChanged;

    Task<IReadOnlyList<AirPlayDevice>> ScanAsync(TimeSpan duration, CancellationToken cancellationToken = default);

    Task<bool> ConnectAsync(AirPlayDevice device, StreamSettings settings, CancellationToken cancellationToken = default);

    Task DisconnectAsync();

    Task SetVolumeAsync(double decibels);

    void SetLatency(int milliseconds);
}

/// <summary>
/// Owns the whole live path — discovery, RTSP handshake, loopback capture and the RTP sender — and
/// exposes it as a small state machine the view model can bind to.
/// </summary>
public sealed class StreamController : IStreamController
{
    private readonly IAirPlayDiscovery _discovery;
    private readonly Func<RaopHandshakeOptions, IRaopHandshake> _handshakeFactory;
    private readonly ILocalOutputSilencer _silencer;
    private readonly ILocalizationService _localization;
    private readonly SemaphoreSlim _gate = new(1, 1);

    private RaopSession? _session;
    private RaopRtpSender? _sender;
    private RaopSessionKeepAlive? _keepAlive;
    private AudioPipeline? _pipeline;
    private WasapiLoopbackCaptureSource? _source;
    private RaopStreamOptions? _streamOptions;
    private StreamState _state = StreamState.Idle;
    private bool _disposed;

    public StreamController(
        IAirPlayDiscovery discovery,
        ILocalizationService localization,
        Func<RaopHandshakeOptions, IRaopHandshake>? handshakeFactory = null,
        ILocalOutputSilencer? silencer = null)
    {
        _discovery = discovery ?? throw new ArgumentNullException(nameof(discovery));
        _localization = localization ?? throw new ArgumentNullException(nameof(localization));
        _handshakeFactory = handshakeFactory ?? (options => new RaopHandshake(options));
        _silencer = silencer ?? new WasapiLocalOutputSilencer();
    }

    public StreamState State
    {
        get => _state;
        private set
        {
            if (_state == value)
            {
                return;
            }

            _state = value;
            StateChanged?.Invoke(this, value);
        }
    }

    public AirPlayDevice? ConnectedDevice { get; private set; }

    public StreamStatistics Statistics
    {
        get
        {
            if (_sender is not { } sender || _session is not { } session || _pipeline is not { } pipeline)
            {
                return StreamStatistics.Empty;
            }

            return new StreamStatistics(
                sender.StreamPosition,
                sender.PacketsSent,
                sender.BytesSent,
                sender.SyncPacketsSent,
                session.TimingResponder.RequestCount,
                sender.TargetLatency,
                pipeline.CurrentLevel,
                sender.Codec,
                sender.IsEncrypted,
                _source?.DeviceName);
        }
    }

    public event EventHandler<StreamState>? StateChanged;

    public event EventHandler<string>? StatusChanged;

    public async Task<IReadOnlyList<AirPlayDevice>> ScanAsync(
        TimeSpan duration,
        CancellationToken cancellationToken = default)
    {
        // Scanning while streaming is harmless, so the streaming state is left untouched.
        var wasStreaming = State == StreamState.Streaming;
        if (!wasStreaming)
        {
            State = StreamState.Scanning;
        }

        Report(_localization.Get(LocKeys.ScanningNetwork));

        try
        {
            var devices = await _discovery.ScanAsync(duration, cancellationToken).ConfigureAwait(false);
            var receivers = new List<AirPlayDevice>();

            foreach (var device in devices)
            {
                if (device.SupportsAudioStreaming)
                {
                    receivers.Add(device);
                }
            }

            Report(receivers.Count == 0
                ? _localization.Get(LocKeys.NoReceiversFound)
                : _localization.Format(LocKeys.DevicesFound, receivers.Count));

            return receivers;
        }
        catch (OperationCanceledException)
        {
            Report(_localization.Get(LocKeys.ScanCancelled));
            return Array.Empty<AirPlayDevice>();
        }
        catch (Exception ex)
        {
            Report(_localization.Format(LocKeys.ScanFailed, ex.Message));
            return Array.Empty<AirPlayDevice>();
        }
        finally
        {
            if (!wasStreaming)
            {
                State = StreamState.Idle;
            }
        }
    }

    public async Task<bool> ConnectAsync(
        AirPlayDevice device,
        StreamSettings settings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(device);
        ArgumentNullException.ThrowIfNull(settings);
        ObjectDisposedException.ThrowIf(_disposed, this);

        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            if (State is StreamState.Connecting or StreamState.Streaming)
            {
                return false;
            }

            State = StreamState.Connecting;
            Report(_localization.Format(LocKeys.ConnectingTo, device.Name));

            var handshake = _handshakeFactory(new RaopHandshakeOptions
            {
                Codec = settings.Codec,
                UseEncryption = settings.UseEncryption,
                InitialVolumeDb = settings.VolumeDb,
            });

            _session = await handshake.ConnectAsync(device, cancellationToken).ConfigureAwait(false);

            _streamOptions = new RaopStreamOptions
            {
                LatencySamples = ToSamples(settings.LatencyMs, _session.Audio.SampleRate),
            };

            _source = new WasapiLoopbackCaptureSource(new LoopbackCaptureOptions
            {
                DeviceId = settings.CaptureDeviceId,
                TargetFormat = AudioFormat.AirPlay,
                SampleFramesPerBlock = _session.Audio.FramesPerPacket,
                // A live stream must not stall while nothing is playing, or the receiver drifts.
                EmitSilenceWhenIdle = true,
                IndependentOfEndpointVolume = settings.MuteLocalSpeakers,
            });

            _sender = new RaopRtpSender(_session, _source.Format, _streamOptions);
            _sender.SendFailed += OnSendFailed;

            _keepAlive = new RaopSessionKeepAlive(_session);
            _keepAlive.KeepAliveFailed += OnKeepAliveFailed;
            _keepAlive.Start();

            _pipeline = new AudioPipeline(_source, ownsSource: false);
            _pipeline.AddSink(_sender);
            _pipeline.Stopped += OnCaptureStopped;

            _sender.Start();
            _pipeline.Start();

            if (settings.MuteLocalSpeakers)
            {
                if (_source.CapturesBeforeDeviceVolume)
                {
                    _silencer.Silence(settings.CaptureDeviceId);
                }
                else
                {
                    Report(_localization.Get(LocKeys.SpeakersNotMuted));
                }
            }

            ConnectedDevice = device;
            State = StreamState.Streaming;
            Report(settings.MuteLocalSpeakers && _source.CapturesBeforeDeviceVolume
                ? _localization.Format(LocKeys.StreamStartedMuted, device.Name)
                : _localization.Format(LocKeys.StreamStarted, device.Name));
            return true;
        }
        catch (Exception ex)
        {
            await TeardownAsync().ConfigureAwait(false);
            State = StreamState.Faulted;
            Report(DescribeFailure(device, ex));
            return false;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task DisconnectAsync()
    {
        await _gate.WaitAsync().ConfigureAwait(false);

        try
        {
            if (State is StreamState.Idle or StreamState.Stopping)
            {
                return;
            }

            State = StreamState.Stopping;
            var name = ConnectedDevice?.Name;

            await TeardownAsync().ConfigureAwait(false);

            State = StreamState.Idle;
            Report(name is null
                ? _localization.Get(LocKeys.Disconnected)
                : _localization.Format(LocKeys.DisconnectedFrom, name));
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task SetVolumeAsync(double decibels)
    {
        if (_session is not { } session)
        {
            return;
        }

        try
        {
            await session.SetVolumeAsync(decibels).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            Report(_localization.Format(LocKeys.VolumeFailed, ex.Message));
        }
    }

    /// <summary>
    /// Takes effect on the next sync packet, so the buffer can be retuned without reconnecting.
    /// Expect a short glitch as the receiver re-anchors its clock.
    /// </summary>
    public void SetLatency(int milliseconds)
    {
        if (_streamOptions is not { } options || _session is not { } session)
        {
            return;
        }

        options.LatencySamples = ToSamples(milliseconds, session.Audio.SampleRate);
    }

    private static int ToSamples(int milliseconds, int sampleRate) =>
        Math.Max(0, milliseconds * sampleRate / 1000);

    private async Task TeardownAsync()
    {
        if (_keepAlive is { } keepAlive)
        {
            keepAlive.KeepAliveFailed -= OnKeepAliveFailed;
            keepAlive.Dispose();
        }

        if (_sender is { } sender)
        {
            sender.SendFailed -= OnSendFailed;
        }

        if (_pipeline is { } pipeline)
        {
            pipeline.Stopped -= OnCaptureStopped;
            pipeline.Stop();
            pipeline.Dispose();
        }

        _silencer.Restore();

        _source?.Dispose();

        if (_session is { } session)
        {
            await session.DisposeAsync().ConfigureAwait(false);
        }

        _pipeline = null;
        _sender = null;
        _keepAlive = null;
        _source = null;
        _session = null;
        _streamOptions = null;
        ConnectedDevice = null;
    }

    private string DescribeFailure(AirPlayDevice device, Exception exception) => exception switch
    {
        OperationCanceledException => _localization.Get(LocKeys.ConnectionCancelled),
        _ => _localization.Format(LocKeys.ConnectFailed, device.Name, exception.Message),
    };

    private void OnSendFailed(object? sender, Exception exception) =>
        Report(_localization.Format(LocKeys.PacketSendFailed, exception.Message));

    private void OnKeepAliveFailed(object? sender, Exception exception)
    {
        Report(_localization.Format(LocKeys.KeepAliveFailed, exception.Message));
        _ = HandleStreamFailureAsync();
    }

    private void OnCaptureStopped(object? sender, CaptureStoppedEventArgs e)
    {
        if (e.Exception is { } exception)
        {
            Report(_localization.Format(LocKeys.CaptureStopped, exception.Message));
            _ = HandleStreamFailureAsync(exception);
        }
    }

    private async Task HandleStreamFailureAsync(Exception? exception = null)
    {
        await _gate.WaitAsync().ConfigureAwait(false);

        try
        {
            if (State is not StreamState.Streaming and not StreamState.Connecting)
            {
                return;
            }

            State = StreamState.Faulted;
            var name = ConnectedDevice?.Name;
            await TeardownAsync().ConfigureAwait(false);

            if (exception is not null && name is not null)
            {
                Report(_localization.Format(LocKeys.StreamStopped, name, exception.Message));
            }
        }
        finally
        {
            _gate.Release();
        }
    }

    private void Report(string message) => StatusChanged?.Invoke(this, message);

    public async ValueTask DisposeAsync()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        await TeardownAsync().ConfigureAwait(false);
        _silencer.Dispose();
        _gate.Dispose();
    }
}
