using CommunityToolkit.Mvvm.ComponentModel;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class MainViewModel : ObservableObject
{
    public MainViewModel(
        DashboardViewModel dashboard,
        CrashAnalyzerViewModel crashAnalyzer,
        StartupOptimizerViewModel startupOptimizer,
        SystemCleanerViewModel systemCleaner)
    {
        Dashboard = dashboard;
        CrashAnalyzer = crashAnalyzer;
        StartupOptimizer = startupOptimizer;
        SystemCleaner = systemCleaner;
        CurrentPageTitle = "Dashboard";
    }

    public DashboardViewModel Dashboard { get; }

    public CrashAnalyzerViewModel CrashAnalyzer { get; }

    public StartupOptimizerViewModel StartupOptimizer { get; }

    public SystemCleanerViewModel SystemCleaner { get; }

    [ObservableProperty]
    private string currentPageTitle;

    public static MainViewModel CreateDefault()
    {
        var eventLog = new EventLogService();
        var startup = new StartupManagerServiceStub();
        var cleaner = new SystemCleanerServiceStub();

        return new MainViewModel(
            new DashboardViewModel(),
            new CrashAnalyzerViewModel(eventLog),
            new StartupOptimizerViewModel(startup),
            new SystemCleanerViewModel(cleaner));
    }
}
