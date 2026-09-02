using System.Collections.Concurrent;

namespace WinAirPlay.Core.Threading;

/// <summary>
/// Runs work on a single long-lived STA thread. WASAPI / MMDevice COM objects must be created,
/// used and released from the same apartment; a fire-and-forget STA thread per call leaves those
/// objects stranded and later unmute/stop calls hang or crash the process.
/// </summary>
public static class StaTask
{
    private static readonly BlockingCollection<WorkItem> Queue = new();
    private static readonly Thread Worker;

    static StaTask()
    {
        Worker = new Thread(ProcessQueue)
        {
            IsBackground = true,
            Name = "WinAirPlay.StaAudio",
        };
        Worker.SetApartmentState(ApartmentState.STA);
        Worker.Start();
    }

    public static bool IsWorkerThread =>
        ReferenceEquals(Thread.CurrentThread, Worker);

    public static Task RunAsync(Action action, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(action);

        if (IsWorkerThread)
        {
            cancellationToken.ThrowIfCancellationRequested();
            action();
            return Task.CompletedTask;
        }

        var tcs = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var item = new WorkItem(action, cancellationToken, tcs);

        try
        {
            Queue.Add(item, cancellationToken);
        }
        catch (Exception ex) when (ex is OperationCanceledException or InvalidOperationException)
        {
            tcs.TrySetCanceled(cancellationToken);
        }

        return tcs.Task;
    }

    private static void ProcessQueue()
    {
        foreach (var item in Queue.GetConsumingEnumerable())
        {
            if (item.CancellationToken.IsCancellationRequested)
            {
                item.Completion.TrySetCanceled(item.CancellationToken);
                continue;
            }

            try
            {
                item.Action();
                item.Completion.TrySetResult();
            }
            catch (OperationCanceledException)
            {
                item.Completion.TrySetCanceled(item.CancellationToken);
            }
            catch (Exception ex)
            {
                item.Completion.TrySetException(ex);
            }
        }
    }

    private readonly record struct WorkItem(
        Action Action,
        CancellationToken CancellationToken,
        TaskCompletionSource Completion);
}
