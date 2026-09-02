using WinAirPlay.Core.Threading;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class StaTaskTests
{
    [Fact]
    public async Task RunAsync_UsesADedicatedStaThread()
    {
        ApartmentState? apartment = null;
        var workerId = 0;

        await StaTask.RunAsync(() =>
        {
            apartment = Thread.CurrentThread.GetApartmentState();
            workerId = Environment.CurrentManagedThreadId;
        });

        Assert.Equal(ApartmentState.STA, apartment);
        Assert.NotEqual(Environment.CurrentManagedThreadId, workerId);
    }

    [Fact]
    public async Task RunAsync_ReusesTheSameStaThread()
    {
        var first = 0;
        var second = 0;

        await StaTask.RunAsync(() => first = Environment.CurrentManagedThreadId);
        await StaTask.RunAsync(() => second = Environment.CurrentManagedThreadId);

        Assert.Equal(first, second);
    }

    [Fact]
    public async Task NestedRunAsync_OnTheWorker_DoesNotDeadlock()
    {
        var ran = false;

        await StaTask.RunAsync(() =>
        {
            StaTask.RunAsync(() => ran = true).GetAwaiter().GetResult();
        });

        Assert.True(ran);
    }
}
