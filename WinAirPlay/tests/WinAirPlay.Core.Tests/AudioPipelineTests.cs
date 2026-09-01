using WinAirPlay.Core.Audio;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class AudioPipelineTests
{
    [Fact]
    public void CapturedBlocks_ReachEverySink()
    {
        var source = new FakeAudioCaptureSource();
        var first = new RecordingSink();
        var second = new RecordingSink();

        using var pipeline = new AudioPipeline(source);
        pipeline.AddSink(first).AddSink(second);
        pipeline.Start();

        source.EmitSilence(352);
        source.EmitSilence(352);

        Assert.Equal(2, first.BlockCount);
        Assert.Equal(2, second.BlockCount);
        Assert.Equal(2816, pipeline.TotalBytesProcessed);
    }

    [Fact]
    public void ProcessedDuration_TracksBytes()
    {
        var source = new FakeAudioCaptureSource();
        using var pipeline = new AudioPipeline(source);
        pipeline.AddSink(new RecordingSink());
        pipeline.Start();

        source.EmitSilence(44100);

        Assert.Equal(TimeSpan.FromSeconds(1), pipeline.ProcessedDuration);
    }

    [Fact]
    public void SinkWithMismatchedFormat_IsRejected()
    {
        var source = new FakeAudioCaptureSource();
        using var pipeline = new AudioPipeline(source);

        var mismatched = new RecordingSink(new AudioFormat(48000, 16, 2));

        Assert.Throws<InvalidOperationException>(() => pipeline.AddSink(mismatched));
    }

    [Fact]
    public void FailingSink_IsCountedAndReportedWithoutBreakingOthers()
    {
        var source = new FakeAudioCaptureSource();
        var healthy = new RecordingSink();
        var broken = new RecordingSink { ThrowOnWrite = new IOException("disk full") };

        using var pipeline = new AudioPipeline(source);
        pipeline.AddSink(broken).AddSink(healthy);

        Exception? reported = null;
        pipeline.SinkFailed += (_, ex) => reported = ex;

        pipeline.Start();
        source.EmitSilence(352);

        Assert.Equal(1, pipeline.DroppedBlocks);
        Assert.Equal(1, healthy.BlockCount);
        Assert.IsType<IOException>(reported);
    }

    [Fact]
    public void CurrentLevel_ReflectsLastBlock()
    {
        var source = new FakeAudioCaptureSource();
        using var pipeline = new AudioPipeline(source);
        pipeline.Start();

        var loud = new byte[8];
        for (var i = 0; i < loud.Length; i += 2)
        {
            loud[i] = 0xFF;
            loud[i + 1] = 0x7F;
        }

        source.EmitBlock(loud);
        Assert.Equal(1f, pipeline.CurrentLevel.Peak, 2);

        source.EmitSilence(64);
        Assert.True(pipeline.CurrentLevel.IsSilent);
    }

    [Fact]
    public void StoppedEvent_IsForwardedFromSource()
    {
        var source = new FakeAudioCaptureSource();
        using var pipeline = new AudioPipeline(source);

        CaptureStoppedEventArgs? captured = null;
        pipeline.Stopped += (_, e) => captured = e;

        source.RaiseStopped(new InvalidOperationException("device lost"));

        Assert.NotNull(captured);
        Assert.IsType<InvalidOperationException>(captured!.Exception);
    }

    [Fact]
    public void Dispose_DisposesSinksAndOwnedSource()
    {
        var source = new FakeAudioCaptureSource();
        var sink = new RecordingSink();

        var pipeline = new AudioPipeline(source);
        pipeline.AddSink(sink);
        pipeline.Start();
        pipeline.Dispose();

        Assert.True(sink.Disposed);
        Assert.True(source.Disposed);
    }

    [Fact]
    public void Dispose_LeavesBorrowedSourceAlive()
    {
        var source = new FakeAudioCaptureSource();

        var pipeline = new AudioPipeline(source, ownsSource: false);
        pipeline.Dispose();

        Assert.False(source.Disposed);
    }
}
