using CommunityToolkit.Mvvm.ComponentModel;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

/// <summary>Stub ViewModel for PP-2 Startup Manager.</summary>
public partial class StartupOptimizerViewModel : ObservableObject
{
    public StartupOptimizerViewModel(IStartupManagerService startupManager)
    {
        _ = startupManager;
        StatusMessage =
            "Startup Optimizer is coming next. It will list Run-key and Startup-folder entries " +
            "so you can disable high-impact items safely — without deleting registry keys blindly.";
    }

    [ObservableProperty]
    private string statusMessage;
}
