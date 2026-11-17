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
        ScheduledScansViewModel scheduledScans,
        AdvancedCrashViewModel advancedCrash,
        AutoOptimizationViewModel autoOptimization,
        ProfilesViewModel profiles,
        AlertsViewModel alerts,
        RuleEngineViewModel ruleEngine,
        IThemeService theme,
        ILicenseService license,
        IRealtimeAlertService realtimeAlerts)
    {
        Dashboard = dashboard;
        CrashAnalyzer = crashAnalyzer;
        StartupOptimizer = startupOptimizer;
        SystemCleaner = systemCleaner;
        MemoryOptimizer = memoryOptimizer;
        Settings = settings;
        ProUnlock = proUnlock;
        ScheduledScans = scheduledScans;
        AdvancedCrash = advancedCrash;
        AutoOptimization = autoOptimization;
        Profiles = profiles;
        Alerts = alerts;
        RuleEngine = ruleEngine;
        Theme = theme;
        License = license;
        RealtimeAlerts = realtimeAlerts;
        CurrentPageTitle = "Dashboard";
    }

    public DashboardViewModel Dashboard { get; }
    public CrashAnalyzerViewModel CrashAnalyzer { get; }
    public StartupOptimizerViewModel StartupOptimizer { get; }
    public SystemCleanerViewModel SystemCleaner { get; }
    public MemoryOptimizerViewModel MemoryOptimizer { get; }
    public SettingsViewModel Settings { get; }
    public ProUnlockViewModel ProUnlock { get; }
    public ScheduledScansViewModel ScheduledScans { get; }
    public AdvancedCrashViewModel AdvancedCrash { get; }
    public AutoOptimizationViewModel AutoOptimization { get; }
    public ProfilesViewModel Profiles { get; }
    public AlertsViewModel Alerts { get; }
    public RuleEngineViewModel RuleEngine { get; }
    public IThemeService Theme { get; }
    public ILicenseService License { get; }
    public IRealtimeAlertService RealtimeAlerts { get; }

    [ObservableProperty]
    private string currentPageTitle;

    public static MainViewModel CreateDefault()
    {
        var settingsStore = new UserSettingsStore();
        var theme = new ThemeService(settingsStore);
        var license = new StoreLicenseService();
        var secrets = new PasswordVaultCredentialStore();
        var ai = new OpenAiCompatibleAssistService(secrets, settingsStore);
        var rules = new RuleEngineService(settingsStore);

        var eventLog = new EventLogService();
        var startup = new StartupManagerService(rules);
        var cleaner = new SystemCleanerService(rules);
        var memory = new MemoryOptimizerService();
        var perf = new PerformanceMonitorService();
        var advanced = new AdvancedCrashService(eventLog, settingsStore);
        var scheduled = new ScheduledScanService(settingsStore, eventLog, cleaner, startup);
        var auto = new AutoOptimizationService(settingsStore, cleaner, startup, eventLog, perf);
        var profiles = new LocalProfileSyncService(settingsStore);
        var alerts = new RealtimeAlertService(settingsStore, perf, license);

        return new MainViewModel(
            new DashboardViewModel(perf),
            new CrashAnalyzerViewModel(eventLog, license, ai),
            new StartupOptimizerViewModel(startup),
            new SystemCleanerViewModel(cleaner),
            new MemoryOptimizerViewModel(memory),
            new SettingsViewModel(theme, license, ai),
            new ProUnlockViewModel(license),
            new ScheduledScansViewModel(scheduled),
            new AdvancedCrashViewModel(advanced),
            new AutoOptimizationViewModel(auto),
            new ProfilesViewModel(profiles),
            new AlertsViewModel(alerts),
            new RuleEngineViewModel(rules),
            theme,
            license,
            alerts);
    }
}
