using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WinAirPlay.App.Localization;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Discovery;
using WinAirPlay.Core.Raop;
using WinAirPlay.Core.Threading;

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
    bool MuteLocalSpeakers = true,
    AudioRoutingMode RoutingMode = AudioRoutingMode.Auto,
    bool FollowWindowsVolume = true,
    string? PreferredVirtualDeviceId = null);

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

    /// <summary>Unmutes the PC speakers immediately. Safe to call when not streaming.</summary>
    void RestoreLocalSpeakers();

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
    private readonly IAudioOutputRouter _router;
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
        ILocalOutputSilencer? silencer = null,
        IAudioOutputRouter? router = null)
    {
        _discovery = discovery ?? throw new ArgumentNullException(nameof(discovery));
        _localization = localization ?? throw new ArgumentNullException(nameof(localization));
        _handshakeFactory = handshakeFactory ?? (options => new RaopHandshake(options));
        _silencer = silencer ?? new WasapiLocalOutputSilencer();
        _router = router ?? new AudioOutputRouter();
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
                : _localization.Format(
                    LocKeys.DevicesFoundList,
                    receivers.Count,
                    string.Join(", ", receivers.Select(device => device.DisplayName))));

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
        }
        finally
        {
            _gate.Release();
        }

        Report(_localization.Format(LocKeys.ConnectingTo, device.Name));

        try
        {
            var handshake = _handshakeFactory(new RaopHandshakeOptions
            {
                Codec = settings.Codec,
                UseEncryption = settings.UseEncryption,
                InitialVolumeDb = settings.VolumeDb,
            });

            var session = await handshake.ConnectAsync(device, cancellationToken).ConfigureAwait(false);
            var streamOptions = new RaopStreamOptions
            {
                LatencySamples = ToSamples(settings.LatencyMs, session.Audio.SampleRate),
            };

            WasapiLoopbackCaptureSource? source = null;
            RaopRtpSender? sender = null;
            AudioPipeline? pipeline = null;
            var mutedLocally = false;
            AudioOutputPlan? activePlan = null;

            try
            {
                await StaTask.RunAsync(() =>
                {
                    var plan = ResolvePlan(settings);
                    activePlan = plan;

                    source = new WasapiLoopbackCaptureSource(new LoopbackCaptureOptions
                    {
                        DeviceId = plan.CaptureDeviceId,
                        TargetFormat = AudioFormat.AirPlay,
                        SampleFramesPerBlock = session.Audio.FramesPerPacket,
                        EmitSilenceWhenIdle = true,
                        IndependentOfEndpointVolume = plan.IndependentOfEndpointVolume,
                        ApplyEndpointVolume = plan.ApplyEndpointVolume,
                        IgnoreEndpointMute = plan.MuteLocalSpeakers,
                    });

                    sender = new RaopRtpSender(session, source.Format, streamOptions);
                    sender.SendFailed += OnSendFailed;

                    pipeline = new AudioPipeline(source, ownsSource: false);
                    pipeline.AddSink(sender);
                    pipeline.Stopped += OnCaptureStopped;

                    sender.Start();
                    pipeline.Start();

                    if (plan.MuteLocalSpeakers)
                    {
                        if (source.CapturesBeforeDeviceVolume)
                        {
                            _silencer.Silence(plan.CaptureDeviceId);
                            mutedLocally = true;
                        }
                        else
                        {
                            Report(_localization.Get(LocKeys.SpeakersNotMuted));
                        }
                    }
                }, cancellationToken).ConfigureAwait(false);
            }
            catch
            {
                RestoreLocalSpeakers();

                if (sender is not null)
                {
                    sender.SendFailed -= OnSendFailed;
                }

                if (pipeline is not null)
                {
                    pipeline.Stopped -= OnCaptureStopped;
                }

                try
                {
                    await StaTask.RunAsync(() =>
                    {
                        pipeline?.Dispose();
                        source?.Dispose();
                    }).ConfigureAwait(false);
                }
                catch (Exception)
                {
                    // Best-effort: the outer teardown still runs after this rethrow.
                }

                await session.DisposeAsync().ConfigureAwait(false);
                throw;
            }

            var keepAlive = new RaopSessionKeepAlive(session);
            keepAlive.KeepAliveFailed += OnKeepAliveFailed;

            await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);

            try
            {
                _session = session;
                _streamOptions = streamOptions;
                _source = source;
                _sender = sender;
                _pipeline = pipeline;
                _keepAlive = keepAlive;
                ConnectedDevice = device;
                State = StreamState.Streaming;
            }
            finally
            {
                _gate.Release();
            }

            keepAlive.Start();

            Report(DescribeStart(device, activePlan, mutedLocally));
            return true;
        }
        catch (Exception ex)
        {
            await TeardownAsync().ConfigureAwait(false);

            await _gate.WaitAsync(CancellationToken.None).ConfigureAwait(false);

            try
            {
                State = StreamState.Faulted;
            }
            finally
            {
                _gate.Release();
            }

            Report(DescribeFailure(device, ex));
            return false;
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

    public void RestoreLocalSpeakers()
    {
        try
        {
            _silencer.Restore();
        }
        catch (Exception)
        {
            // Unmute must not throw on the UI, crash, or process-exit path.
        }

        try
        {
            _router.Restore();
        }
        catch (Exception)
        {
            // Default endpoint restore must not throw either.
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
        var keepAlive = _keepAlive;
        var sender = _sender;
        var pipeline = _pipeline;
        var source = _source;
        var session = _session;

        _keepAlive = null;
        _sender = null;
        _pipeline = null;
        _source = null;
        _session = null;
        _streamOptions = null;
        ConnectedDevice = null;

        if (keepAlive is not null)
        {
            keepAlive.KeepAliveFailed -= OnKeepAliveFailed;
            keepAlive.Dispose();
        }

        if (sender is not null)
        {
            sender.SendFailed -= OnSendFailed;
        }

        if (pipeline is not null)
        {
            pipeline.Stopped -= OnCaptureStopped;
        }

        await RestoreLocalSpeakersAsync().ConfigureAwait(false);

        try
        {
            await StaTask.RunAsync(() =>
            {
                pipeline?.Stop();
                pipeline?.Dispose();
                source?.Dispose();
            }).ConfigureAwait(false);
        }
        catch (Exception)
        {
            // Capture teardown must not prevent speaker restore.
        }

        if (session is not null)
        {
            await session.DisposeAsync().ConfigureAwait(false);
        }
    }

    private Task RestoreLocalSpeakersAsync()
    {
        RestoreLocalSpeakers();
        return Task.CompletedTask;
    }

    private string DescribeFailure(AirPlayDevice device, Exception exception) => exception switch
    {
        OperationCanceledException => _localization.Get(LocKeys.ConnectionCancelled),
        _ => _localization.Format(LocKeys.ConnectFailed, device.Name, exception.Message),
    };

    private void OnSendFailed(object? sender, Exception exception)
    {
        Report(_localization.Format(LocKeys.PacketSendFailed, exception.Message));

        if (exception is System.Net.Sockets.SocketException or ObjectDisposedException)
        {
            return;
        }

        _ = HandleStreamFailureAsync(exception);
    }

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
        _router.Dispose();
        _gate.Dispose();
    }

    private AudioOutputPlan ResolvePlan(StreamSettings settings)
    {
        var request = new AudioRoutingRequest(
            settings.RoutingMode,
            settings.CaptureDeviceId,
            settings.PreferredVirtualDeviceId,
            settings.MuteLocalSpeakers,
            settings.FollowWindowsVolume);

        var plan = _router.CreatePlan(request);

        if (plan.Kind == AudioRoutingKind.Redirect && !_router.Apply(plan))
        {
            Report(_localization.Get(LocKeys.RoutingRedirectFailed));
            plan = settings.MuteLocalSpeakers
                ? AudioOutputPlan.Mute(settings.CaptureDeviceId, settings.FollowWindowsVolume)
                : AudioOutputPlan.Passthrough(settings.CaptureDeviceId, settings.FollowWindowsVolume);
        }

        return plan;
    }

    private string DescribeStart(AirPlayDevice device, AudioOutputPlan? plan, bool mutedLocally)
    {
        if (plan?.Kind == AudioRoutingKind.Redirect && plan.VirtualDeviceName is { } cable)
        {
            return _localization.Format(LocKeys.StreamStartedRedirected, device.Name, cable);
        }

        if (mutedLocally)
        {
            return _localization.Format(LocKeys.StreamStartedMuted, device.Name);
        }

        return _localization.Format(LocKeys.StreamStarted, device.Name);
    }
}
