using System.Buffers.Binary;
using WinAirPlay.Core.Audio;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class WaveFileAudioSinkTests : IDisposable
{
    private readonly string _directory =
        Path.Combine(Path.GetTempPath(), "winairplay-tests", Guid.NewGuid().ToString("N"));

    [Fact]
    public void WrittenFile_HasCorrectRiffHeaderForAirPlayFormat()
    {
        var path = Path.Combine(_directory, "capture.wav");
        var payload = new byte[1408];

        using (var sink = new WaveFileAudioSink(path, AudioFormat.AirPlay))
        {
            sink.Write(payload);
        }

        var bytes = File.ReadAllBytes(path);

        Assert.Equal("RIFF", System.Text.Encoding.ASCII.GetString(bytes, 0, 4));
        Assert.Equal("WAVE", System.Text.Encoding.ASCII.GetString(bytes, 8, 4));
        Assert.Equal(1, BinaryPrimitives.ReadInt16LittleEndian(bytes.AsSpan(20, 2)));  // PCM
        Assert.Equal(2, BinaryPrimitives.ReadInt16LittleEndian(bytes.AsSpan(22, 2)));  // channels
        Assert.Equal(44100, BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(24, 4)));
        Assert.Equal(176400, BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(28, 4)));
        Assert.Equal(16, BinaryPrimitives.ReadInt16LittleEndian(bytes.AsSpan(34, 2)));
    }

    [Fact]
    public void BytesWritten_AndDuration_TrackPayload()
    {
        var path = Path.Combine(_directory, "duration.wav");

        using var sink = new WaveFileAudioSink(path, AudioFormat.AirPlay);
        sink.Write(new byte[88200]);

        Assert.Equal(88200, sink.BytesWritten);
        Assert.Equal(TimeSpan.FromMilliseconds(500), sink.Duration);
    }

    [Fact]
    public void MissingDirectory_IsCreated()
    {
        var path = Path.Combine(_directory, "nested", "deep", "capture.wav");

        using (var sink = new WaveFileAudioSink(path, AudioFormat.AirPlay))
        {
            sink.Write(new byte[4]);
        }

        Assert.True(File.Exists(path));
    }

    [Fact]
    public void WriteAfterDispose_Throws()
    {
        var path = Path.Combine(_directory, "disposed.wav");
        var sink = new WaveFileAudioSink(path, AudioFormat.AirPlay);
        sink.Dispose();

        Assert.Throws<ObjectDisposedException>(() => sink.Write(new byte[4]));
    }

    [Fact]
    public void DoubleDispose_IsSafe()
    {
        var path = Path.Combine(_directory, "double.wav");
        var sink = new WaveFileAudioSink(path, AudioFormat.AirPlay);

        sink.Dispose();
        sink.Dispose();
    }

    public void Dispose()
    {
        if (Directory.Exists(_directory))
        {
            Directory.Delete(_directory, recursive: true);
        }
    }
}
