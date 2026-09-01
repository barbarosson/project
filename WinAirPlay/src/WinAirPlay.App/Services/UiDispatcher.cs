using System;
using System.Windows.Threading;

namespace WinAirPlay.App.Services;

/// <summary>
/// The stream controller raises its events from capture and socket threads. Marshalling through
/// this interface keeps the view model bindable and unit testable at the same time.
/// </summary>
public interface IUiDispatcher
{
    void Post(Action action);
}

public sealed class WpfDispatcher : IUiDispatcher
{
    private readonly Dispatcher _dispatcher;

    public WpfDispatcher(Dispatcher dispatcher) =>
        _dispatcher = dispatcher ?? throw new ArgumentNullException(nameof(dispatcher));

    public void Post(Action action)
    {
        if (_dispatcher.CheckAccess())
        {
            action();
        }
        else
        {
            _dispatcher.BeginInvoke(action);
        }
    }
}

/// <summary>Runs callbacks inline; used by tests and by design-time data.</summary>
public sealed class ImmediateDispatcher : IUiDispatcher
{
    public void Post(Action action) => action();
}
