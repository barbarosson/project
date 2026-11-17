using CommunityToolkit.Mvvm.ComponentModel;
using PurePerformance.Helpers;

namespace PurePerformance.ViewModels;

public partial class DashboardViewModel : ObservableObject
{
    public string ProductName => "Pure Performance";

    public string Tagline =>
        "Crash Analyzer · Startup Manager · Safe optimization tools";

    public string PositioningCopy =>
        "Diagnose unexpected shutdowns, app hangs, disk errors, and BSODs. " +
        "Manage startup impact and clean only what we clearly name — " +
        "never blind registry deletion.";

    [ObservableProperty]
    private string elevationStatus;

    public DashboardViewModel()
    {
        ElevationStatus = ElevationHelper.IsRunningElevated()
            ? "Running elevated (admin). Deep system ops can proceed when you start them."
            : "Running as a standard user. Crash Analyzer works without admin; " +
              "future deep ops will ask for UAC only when needed.";
    }
}
