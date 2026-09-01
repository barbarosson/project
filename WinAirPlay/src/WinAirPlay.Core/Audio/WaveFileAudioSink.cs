using NAudio.Wave;

namespace WinAirPlay.Core.Audio;

/// <summary>
/// Writes PCM blocks to a RIFF/WAV file. Used by the Phase 1 checkpoint to prove the capture chain
/// produces correct audio.
/// </summary>
public sealed class WaveFileAudioSink : IAudioSink
{
    private readonly WaveFileWriter _writer;
    private bool _disposed;

    public WaveFileAudioSink(string filePath, AudioFormat format)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(filePath);
        Format = format ?? throw new ArgumentNullException(nameof(format));

        FilePath = Path.GetFullPath(filePath);
        var directory = Path.GetDirectoryName(FilePath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        _writer = new WaveFileWriter(
            FilePath,
            new WaveFormat(format.SampleRate, format.BitsPerSample, format.Channels));
    }

    public string FilePath { get; }

    public AudioFormat Format { get; }

    public long BytesWritten { get; private set; }

    public TimeSpan Duration => Format.DurationOf(BytesWritten);

    public void Write(ReadOnlySpan<byte> pcm)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        if (pcm.IsEmpty)
        {
            return;
        }

        _writer.Write(pcm);
        BytesWritten += pcm.Length;
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _writer.Flush();
        _writer.Dispose();
    }
}
