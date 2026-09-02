using System.Diagnostics;
using NAudio.CoreAudioApi;
using NAudio.Wave;
using NAudio.Wave.SampleProviders;

namespace WinAirPlay.Core.Audio;

/// <summary>
/// Captures everything Windows sends to a render endpoint (WASAPI loopback) and converts it to
/// <see cref="LoopbackCaptureOptions.TargetFormat"/> — by default 44.1 kHz / 16-bit / stereo.
/// </summary>
public sealed class WasapiLoopbackCaptureSource : IAudioCaptureSource
{
    private readonly LoopbackCaptureOptions _options;
    private readonly object _sync = new();
    private readonly AutoResetEvent _dataSignal = new(false);
    private readonly Stopwatch _sessionClock = new();

    private MMDevice? _device;
    private IWaveIn? _capture;
    private BufferedWaveProvider? _inputBuffer;
    private IWaveProvider? _converted;
    private Thread? _pumpThread;
    private CancellationTokenSource? _cts;
    private AudioEndpointVolume? _endpointVolume;

    private long _emittedBytes;
    private long _sequence;
    private long _lastDataTicks;
    private float _endpointGain = 1f;
    private bool _disposed;

    public WasapiLoopbackCaptureSource() : this(new LoopbackCaptureOptions())
    {
    }

    public WasapiLoopbackCaptureSource(LoopbackCaptureOptions options)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));

        if (_options.SampleFramesPerBlock <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(options), "SampleFramesPerBlock must be positive.");
        }

        Format = _options.TargetFormat;
        BlockSizeInBytes = _options.SampleFramesPerBlock * Format.BytesPerFrame;
    }

    public AudioFormat Format { get; }

    public int BlockSizeInBytes { get; }

    public bool IsCapturing { get; private set; }

    /// <summary>Native format of the endpoint being captured. Only meaningful while capturing.</summary>
    public WaveFormat? DeviceFormat => _capture?.WaveFormat;

    public string? DeviceName { get; private set; }

    /// <summary>
    /// True when frames are taken from process loopback, so muting the speakers does not mute us.
    /// </summary>
    public bool CapturesBeforeDeviceVolume { get; private set; }

    public event EventHandler<AudioFrameEventArgs>? FrameCaptured;

    public event EventHandler<CaptureStoppedEventArgs>? CaptureStopped;

    public void Start()
    {
        lock (_sync)
        {
            ObjectDisposedException.ThrowIf(_disposed, this);
            if (IsCapturing)
            {
                return;
            }

            _device = ResolveDevice(_options.DeviceId);
            DeviceName = _device.FriendlyName;

            _capture = CreateCapture(_device, _options.IndependentOfEndpointVolume);
            CapturesBeforeDeviceVolume = _capture is ProcessLoopbackCapture;
            _capture.DataAvailable += OnDataAvailable;
            _capture.RecordingStopped += OnRecordingStopped;

            _inputBuffer = new BufferedWaveProvider(_capture.WaveFormat)
            {
                BufferDuration = _options.BufferDuration,
                DiscardOnBufferOverflow = true,
                ReadFully = false,
            };

            _converted = BuildConversionChain(_inputBuffer, Format);

            _emittedBytes = 0;
            _sequence = 0;
            Volatile.Write(ref _lastDataTicks, DateTime.UtcNow.Ticks);
            _sessionClock.Restart();
            AttachEndpointVolume();

            _cts = new CancellationTokenSource();
            var token = _cts.Token;
            _pumpThread = new Thread(() => PumpLoop(token))
            {
                IsBackground = true,
                Name = "WinAirPlay.LoopbackPump",
                Priority = ThreadPriority.AboveNormal,
            };

            IsCapturing = true;
            _pumpThread.Start();
            _capture.StartRecording();
        }
    }

    public void Stop()
    {
        Thread? pumpThread;

        lock (_sync)
        {
            if (!IsCapturing)
            {
                return;
            }

            IsCapturing = false;
            _capture?.StopRecording();
            _cts?.Cancel();
            _dataSignal.Set();
            pumpThread = _pumpThread;
            _pumpThread = null;
        }

        pumpThread?.Join(TimeSpan.FromSeconds(2));

        lock (_sync)
        {
            _sessionClock.Stop();
            ReleaseCaptureResources();
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        Stop();

        lock (_sync)
        {
            _disposed = true;
            ReleaseCaptureResources();
            _dataSignal.Dispose();
        }
    }

    /// <summary>
    /// Normalises an arbitrary endpoint format (usually 32-bit float, 48 kHz) into the target PCM
    /// format: channel conform first, then resample, then quantise to 16-bit.
    /// </summary>
    private static IWaveProvider BuildConversionChain(IWaveProvider source, AudioFormat target)
    {
        if (target.BitsPerSample != 16 || target.Channels != 2)
        {
            throw new NotSupportedException($"Only 16-bit stereo targets are supported, got {target}.");
        }

        ISampleProvider samples = source.ToSampleProvider();

        if (samples.WaveFormat.Channels == 1)
        {
            samples = new MonoToStereoSampleProvider(samples);
        }
        else if (samples.WaveFormat.Channels > 2)
        {
            // Surround endpoints: keep the front left/right pair.
            samples = new MultiplexingSampleProvider(new[] { samples }, 2);
        }

        if (samples.WaveFormat.SampleRate != target.SampleRate)
        {
            samples = new WdlResamplingSampleProvider(samples, target.SampleRate);
        }

        return new SampleToWaveProvider16(samples);
    }

    private static IWaveIn CreateCapture(MMDevice device, bool independentOfEndpointVolume)
    {
        if (!independentOfEndpointVolume)
        {
            return new WasapiLoopbackCapture(device);
        }

        try
        {
            return new ProcessLoopbackCapture();
        }
        catch (Exception)
        {
            // Older Windows builds lack process loopback; falling back would go silent if we mute.
            return new WasapiLoopbackCapture(device);
        }
    }

    private static MMDevice ResolveDevice(string? deviceId)
    {
        using var enumerator = new MMDeviceEnumerator();

        if (!string.IsNullOrWhiteSpace(deviceId))
        {
            return enumerator.GetDevice(deviceId);
        }

        if (!enumerator.HasDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia))
        {
            throw new InvalidOperationException("Sistemde varsayılan bir ses çıkış cihazı bulunamadı.");
        }

        return enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
    }

    private void OnDataAvailable(object? sender, WaveInEventArgs e)
    {
        if (e.BytesRecorded <= 0)
        {
            return;
        }

        _inputBuffer?.AddSamples(e.Buffer, 0, e.BytesRecorded);
        Volatile.Write(ref _lastDataTicks, DateTime.UtcNow.Ticks);
        _dataSignal.Set();
    }

    private void OnRecordingStopped(object? sender, StoppedEventArgs e) =>
        CaptureStopped?.Invoke(this, new CaptureStoppedEventArgs(e.Exception));

    private void PumpLoop(CancellationToken token)
    {
        var block = new byte[BlockSizeInBytes];
        var silence = new byte[BlockSizeInBytes];
        var filled = 0;
        Exception? failure = null;

        try
        {
            var chain = _converted!;

            while (!token.IsCancellationRequested)
            {
                var read = chain.Read(block, filled, block.Length - filled);

                if (read > 0)
                {
                    filled += read;
                    if (filled == block.Length)
                    {
                        Emit(block);
                        filled = 0;
                    }

                    continue;
                }

                if (filled == 0 && TryEmitSilence(silence))
                {
                    continue;
                }

                _dataSignal.WaitOne(5);
            }
        }
        catch (OperationCanceledException)
        {
            // Normal shutdown.
        }
        catch (Exception ex)
        {
            failure = ex;
        }

        if (failure is not null)
        {
            CaptureStopped?.Invoke(this, new CaptureStoppedEventArgs(failure));
        }
    }

    /// <summary>
    /// Fills gaps where no application is playing, pacing silence against the session clock so the
    /// emitted stream stays real-time instead of running ahead.
    /// </summary>
    private bool TryEmitSilence(byte[] silence)
    {
        if (!_options.EmitSilenceWhenIdle)
        {
            return false;
        }

        var idleFor = DateTime.UtcNow - new DateTime(Volatile.Read(ref _lastDataTicks), DateTimeKind.Utc);
        if (idleFor < _options.SilenceThreshold)
        {
            return false;
        }

        var emitted = Format.DurationOf(_emittedBytes);
        if (emitted + _options.SilenceThreshold > _sessionClock.Elapsed)
        {
            return false;
        }

        Array.Clear(silence);
        Emit(silence);
        return true;
    }

    private void Emit(byte[] block)
    {
        if (_options.ApplyEndpointVolume)
        {
            PcmVolume.ApplyScalar(block, Volatile.Read(ref _endpointGain));
        }

        var position = Format.DurationOf(_emittedBytes);
        _emittedBytes += block.Length;
        FrameCaptured?.Invoke(this, new AudioFrameEventArgs(block, Format, _sequence++, position));
    }

    private void AttachEndpointVolume()
    {
        _endpointGain = 1f;

        if (!_options.ApplyEndpointVolume || _device is null)
        {
            return;
        }

        try
        {
            _endpointVolume = _device.AudioEndpointVolume;
            RefreshEndpointGain(_endpointVolume.MasterVolumeLevelScalar, _endpointVolume.Mute);
            _endpointVolume.OnVolumeNotification += OnEndpointVolumeNotification;
        }
        catch (Exception)
        {
            _endpointVolume = null;
            _endpointGain = 1f;
        }
    }

    private void OnEndpointVolumeNotification(AudioVolumeNotificationData data) =>
        RefreshEndpointGain(data.MasterVolume, data.Muted);

    private void RefreshEndpointGain(float scalar, bool muted)
    {
        if (muted && !_options.IgnoreEndpointMute)
        {
            Volatile.Write(ref _endpointGain, 0f);
            return;
        }

        Volatile.Write(ref _endpointGain, Math.Clamp(scalar, 0f, 1f));
    }

    private void ReleaseCaptureResources()
    {
        if (_endpointVolume is not null)
        {
            _endpointVolume.OnVolumeNotification -= OnEndpointVolumeNotification;
            _endpointVolume = null;
        }

        _endpointGain = 1f;

        if (_capture is not null)
        {
            _capture.DataAvailable -= OnDataAvailable;
            _capture.RecordingStopped -= OnRecordingStopped;
            _capture.Dispose();
            _capture = null;
        }

        _device?.Dispose();
        _device = null;
        CapturesBeforeDeviceVolume = false;

        _cts?.Dispose();
        _cts = null;

        _inputBuffer = null;
        _converted = null;
    }
}
