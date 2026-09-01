namespace WinAirPlay.Core.Audio;

/// <summary>
/// Connects one <see cref="IAudioCaptureSource"/> to any number of <see cref="IAudioSink"/>s and
/// tracks throughput. Phase 1 attaches a WAV sink; later phases attach the AirPlay RTP sender.
/// </summary>
public sealed class AudioPipeline : IDisposable
{
    private readonly IAudioCaptureSource _source;
    private readonly bool _ownsSource;
    private readonly List<IAudioSink> _sinks = new();
    private readonly object _sync = new();

    private long _totalBytes;
    private long _droppedBlocks;
    private PcmLevel _level = PcmLevel.Silent;
    private bool _disposed;

    public AudioPipeline(IAudioCaptureSource source, bool ownsSource = true)
    {
        _source = source ?? throw new ArgumentNullException(nameof(source));
        _ownsSource = ownsSource;
        _source.FrameCaptured += OnFrameCaptured;
        _source.CaptureStopped += OnCaptureStopped;
    }

    public AudioFormat Format => _source.Format;

    public bool IsRunning => _source.IsCapturing;

    public long TotalBytesProcessed => Interlocked.Read(ref _totalBytes);

    /// <summary>Blocks a sink rejected (threw) and could not consume.</summary>
    public long DroppedBlocks => Interlocked.Read(ref _droppedBlocks);

    public TimeSpan ProcessedDuration => Format.DurationOf(TotalBytesProcessed);

    public PcmLevel CurrentLevel => _level;

    public event EventHandler<AudioFrameEventArgs>? FrameProcessed;

    public event EventHandler<CaptureStoppedEventArgs>? Stopped;

    public event EventHandler<Exception>? SinkFailed;

    public AudioPipeline AddSink(IAudioSink sink)
    {
        ArgumentNullException.ThrowIfNull(sink);

        if (!sink.Format.Equals(Format))
        {
            throw new InvalidOperationException(
                $"Sink format ({sink.Format}) does not match capture format ({Format}).");
        }

        lock (_sync)
        {
            _sinks.Add(sink);
        }

        return this;
    }

    public void Start()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        _source.Start();
    }

    public void Stop() => _source.Stop();

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _source.FrameCaptured -= OnFrameCaptured;
        _source.CaptureStopped -= OnCaptureStopped;
        _source.Stop();

        if (_ownsSource)
        {
            _source.Dispose();
        }

        lock (_sync)
        {
            foreach (var sink in _sinks)
            {
                sink.Dispose();
            }

            _sinks.Clear();
        }
    }

    private void OnFrameCaptured(object? sender, AudioFrameEventArgs e)
    {
        var pcm = e.Pcm.Span;
        _level = PcmLevelMeter.Measure(pcm, Format.Channels);
        Interlocked.Add(ref _totalBytes, pcm.Length);

        lock (_sync)
        {
            foreach (var sink in _sinks)
            {
                try
                {
                    sink.Write(pcm);
                }
                catch (Exception ex)
                {
                    Interlocked.Increment(ref _droppedBlocks);
                    SinkFailed?.Invoke(this, ex);
                }
            }
        }

        FrameProcessed?.Invoke(this, e);
    }

    private void OnCaptureStopped(object? sender, CaptureStoppedEventArgs e) => Stopped?.Invoke(this, e);
}
