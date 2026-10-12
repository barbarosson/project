using System;
using System.Threading;
using Microsoft.UI.Dispatching;
using Microsoft.UI.Xaml;
using WinRT;

namespace UplinkFtp;

/// <summary>
/// Non-packaged WinUI entry point. MSIX packaging can switch to the generated App entry later.
/// </summary>
public static class Program
{
    [STAThread]
    private static void Main(string[] args)
    {
        ComWrappersSupport.InitializeComWrappers();
        // Do not name the callback parameter `_` — `_ = new App()` would try to assign into it.
        Application.Start(p =>
        {
            var context = new DispatcherQueueSynchronizationContext(
                DispatcherQueue.GetForCurrentThread());
            SynchronizationContext.SetSynchronizationContext(context);
            new App();
        });
    }
}
