using WinAirPlay.Core.Audio;

namespace WinAirPlay.Core.Tests;

/// <summary>
/// In-memory capture source so the pipeline can be tested without audio hardware.
/// </summary>
public sealed class FakeAudioCaptureSource : IAudioCaptureSource
{
    private long _sequence;
    private long _emittedBytes;

    public FakeAudioCaptureSource(AudioFormat? format = null) => Format = format ?? AudioFormat.AirPlay;

    public AudioFormat Format { get; }

    public bool IsCapturing { get; private set; }

    public bool Disposed { get; private set; }

    public event EventHandler<AudioFrameEventArgs>? FrameCaptured;

    public event EventHandler<CaptureStoppedEventArgs>? CaptureStopped;

    public void Start() => IsCapturing = true;

    public void Stop() => IsCapturing = false;

    public void Dispose()
    {
        Disposed = true;
        IsCapturing = false;
    }

    public void EmitBlock(byte[] pcm)
    {
        var position = Format.DurationOf(_emittedBytes);
        _emittedBytes += pcm.Length;
        FrameCaptured?.Invoke(this, new AudioFrameEventArgs(pcm, Format, _sequence++, position));
    }

    public void EmitSilence(int sampleFrames) => EmitBlock(new byte[sampleFrames * Format.BytesPerFrame]);

    public void RaiseStopped(Exception? exception = null) =>
        CaptureStopped?.Invoke(this, new CaptureStoppedEventArgs(exception));
}

public sealed class RecordingSink : IAudioSink
{
    private readonly List<byte> _data = new();

    public RecordingSink(AudioFormat? format = null) => Format = format ?? AudioFormat.AirPlay;

    public AudioFormat Format { get; }

    public bool Disposed { get; private set; }

    public Exception? ThrowOnWrite { get; set; }

    public IReadOnlyList<byte> Data => _data;

    public int BlockCount { get; private set; }

    public void Write(ReadOnlySpan<byte> pcm)
    {
        if (ThrowOnWrite is not null)
        {
            throw ThrowOnWrite;
        }

        _data.AddRange(pcm.ToArray());
        BlockCount++;
    }

    public void Dispose() => Disposed = true;
}
