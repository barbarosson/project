using CommunityToolkit.Mvvm.ComponentModel;
using PurePerformance.Services;

namespace PurePerformance.ViewModels;

public partial class MainViewModel : ObservableObject
{
    public MainViewModel(
        DashboardViewModel dashboard,
        CrashAnalyzerViewModel crashAnalyzer,
        StartupOptimizerViewModel startupOptimizer,
        SystemCleanerViewModel systemCleaner,
        MemoryOptimizerViewModel memoryOptimizer,
        SettingsViewModel settings,
        ProUnlockViewModel proUnlock,
        IThemeService theme,
        ILicenseService license)
    {
        Dashboard = dashboard;
        CrashAnalyzer = crashAnalyzer;
        StartupOptimizer = startupOptimizer;
        SystemCleaner = systemCleaner;
        MemoryOptimizer = memoryOptimizer;
        Settings = settings;
        ProUnlock = proUnlock;
        Theme = theme;
        License = license;
        CurrentPageTitle = "Dashboard";
    }

    public DashboardViewModel Dashboard { get; }

    public CrashAnalyzerViewModel CrashAnalyzer { get; }

    public StartupOptimizerViewModel StartupOptimizer { get; }

    public SystemCleanerViewModel SystemCleaner { get; }

    public MemoryOptimizerViewModel MemoryOptimizer { get; }

    public SettingsViewModel Settings { get; }

    public ProUnlockViewModel ProUnlock { get; }

    public IThemeService Theme { get; }

    public ILicenseService License { get; }

    [ObservableProperty]
    private string currentPageTitle;

    public static MainViewModel CreateDefault()
    {
        var settingsStore = new UserSettingsStore();
        var theme = new ThemeService(settingsStore);
        var license = new StoreLicenseService();

        var eventLog = new EventLogService();
        var startup = new StartupManagerService();
        var cleaner = new SystemCleanerService();
        var memory = new MemoryOptimizerService();
        var perf = new PerformanceMonitorService();

        return new MainViewModel(
            new DashboardViewModel(perf),
            new CrashAnalyzerViewModel(eventLog),
            new StartupOptimizerViewModel(startup),
            new SystemCleanerViewModel(cleaner),
            new MemoryOptimizerViewModel(memory),
            new SettingsViewModel(theme, license),
            new ProUnlockViewModel(license),
            theme,
            license);
    }
}
