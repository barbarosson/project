using CommunityToolkit.Mvvm.ComponentModel;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

/// <summary>Stub ViewModel for PP-3 System Cleaner.</summary>
public partial class SystemCleanerViewModel : ObservableObject
{
    public SystemCleanerViewModel(ISystemCleanerService cleaner)
    {
        _ = cleaner;
        StatusMessage =
            "System Cleaner will target user temp folders and other named caches you approve. " +
            "Pure Performance is not a registry cleaner and will not delete registry values blindly.";
    }

    [ObservableProperty]
    private string statusMessage;
}
