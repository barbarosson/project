using WinAirPlay.Core.Raop;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class RaopSessionKeepAliveTests
{
    [Fact]
    public void DefaultInterval_IsWellUnderReceiverTimeout()
    {
        Assert.InRange(RaopSessionKeepAlive.DefaultInterval.TotalSeconds, 5, 20);
    }

    [Fact]
    public async Task Start_InvokesKeepAliveImmediatelyThenOnInterval()
    {
        var calls = 0;
        var gate = new ManualResetEventSlim(false);

        using var keepAlive = new RaopSessionKeepAlive(
            _ =>
            {
                Interlocked.Increment(ref calls);
                gate.Set();
                return Task.CompletedTask;
            },
            TimeSpan.FromMilliseconds(50));

        keepAlive.Start();

        Assert.True(gate.Wait(TimeSpan.FromSeconds(1)), "İlk keepalive hemen gönderilmeli.");
        await Task.Delay(120);
        Assert.True(Volatile.Read(ref calls) >= 2, "Periyodik keepalive tetiklenmeli.");
    }

    [Fact]
    public async Task KeepAliveFailed_IsRaisedWhenSenderThrows()
    {
        Exception? captured = null;
        using var keepAlive = new RaopSessionKeepAlive(
            _ => throw new InvalidOperationException("bağlantı koptu"),
            TimeSpan.FromMilliseconds(20));

        keepAlive.KeepAliveFailed += (_, ex) => captured = ex;
        keepAlive.Start();

        await Task.Delay(100);

        Assert.IsType<InvalidOperationException>(captured);
    }

    [Fact]
    public void Dispose_PreventsFurtherKeepAliveCalls()
    {
        var calls = 0;
        using var keepAlive = new RaopSessionKeepAlive(
            _ =>
            {
                Interlocked.Increment(ref calls);
                return Task.CompletedTask;
            },
            TimeSpan.FromMilliseconds(30));

        keepAlive.Start();
        keepAlive.Dispose();
        var afterDispose = Volatile.Read(ref calls);
        Thread.Sleep(120);

        Assert.Equal(afterDispose, Volatile.Read(ref calls));
    }
}
