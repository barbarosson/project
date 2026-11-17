using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PurePerformance.Models;
using PurePerformance.ViewModels;
using PurePerformance.Views;

namespace PurePerformance;

public sealed partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;

    public MainWindow(MainViewModel viewModel)
    {
        _viewModel = viewModel;
        InitializeComponent();
        ExtendsContentIntoTitleBar = true;
        Title = "Pure Performance";

        // Theme on the window root only — never Application.RequestedTheme=Default.
        _viewModel.Theme.ApplyToRoot(RootGrid);
        _viewModel.Settings.AttachWindow(this);
        _viewModel.ProUnlock.AttachWindow(this);

        Closed += (_, _) =>
        {
            _viewModel.Dashboard.StopIfNeeded();
            _viewModel.RealtimeAlerts.Stop();
        };

        _viewModel.RealtimeAlerts.AlertRaised += OnAlertRaised;
        _viewModel.License.Changed += (_, _) =>
        {
            if (_viewModel.License.IsProUnlocked)
            {
                _viewModel.RealtimeAlerts.Start();
            }
            else
            {
                _viewModel.RealtimeAlerts.Stop();
            }
        };

        _ = InitializeLicenseAsync();

        if (NavView.MenuItems[0] is NavigationViewItem first)
        {
            NavView.SelectedItem = first;
        }
    }

    private async Task InitializeLicenseAsync()
    {
        try
        {
            await _viewModel.License.RefreshAsync();
            if (_viewModel.License.IsProUnlocked)
            {
                _viewModel.RealtimeAlerts.Start();
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"License refresh: {ex.Message}");
        }
    }

    private void OnAlertRaised(object? sender, AlertHistoryEntry entry)
    {
        DispatcherQueue.TryEnqueue(() =>
        {
            GlobalAlertBar.Message = entry.Message;
            GlobalAlertBar.IsOpen = true;
        });
    }

    private void NavView_SelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        if (args.IsSettingsSelected)
        {
            var settings = new SettingsPage();
            settings.SetViewModel(_viewModel.Settings);
            ContentFrame.Content = settings;
            SetTitle("Settings");
            return;
        }

        if (args.SelectedItem is not NavigationViewItem item || item.Tag is not string tag)
        {
            return;
        }

        switch (tag)
        {
            case "dashboard":
                var dashboard = new DashboardPage();
                dashboard.SetViewModel(_viewModel.Dashboard);
                ContentFrame.Content = dashboard;
                SetTitle("Dashboard");
                break;

            case "crash":
                var crash = new CrashAnalyzerPage();
                crash.SetViewModel(_viewModel.CrashAnalyzer);
                ContentFrame.Content = crash;
                SetTitle("Crash Analyzer");
                break;

            case "startup":
                var startup = new StartupOptimizerPage();
                startup.SetViewModel(_viewModel.StartupOptimizer);
                ContentFrame.Content = startup;
                SetTitle("Startup Optimizer");
                break;

            case "cleaner":
                var cleaner = new SystemCleanerPage();
                cleaner.SetViewModel(_viewModel.SystemCleaner);
                ContentFrame.Content = cleaner;
                SetTitle("System Cleaner");
                break;

            case "memory":
                var memory = new MemoryOptimizerPage();
                memory.SetViewModel(_viewModel.MemoryOptimizer);
                ContentFrame.Content = memory;
                SetTitle("Memory Optimizer");
                break;

            case "scheduled":
                NavigateProOrGate("Scheduled scans", () =>
                {
                    var page = new ScheduledScansPage();
                    page.SetViewModel(_viewModel.ScheduledScans);
                    ContentFrame.Content = page;
                    SetTitle("Scheduled scans");
                });
                break;

            case "advanced-crash":
                NavigateProOrGate("Advanced Crash Analyzer", () =>
                {
                    var page = new AdvancedCrashPage();
                    page.SetViewModel(_viewModel.AdvancedCrash);
                    ContentFrame.Content = page;
                    SetTitle("Advanced Crash Analyzer");
                });
                break;

            case "auto-rules":
                NavigateProOrGate("Auto optimization rules", () =>
                {
                    var page = new AutoOptimizationPage();
                    page.SetViewModel(_viewModel.AutoOptimization);
                    ContentFrame.Content = page;
                    SetTitle("Auto optimization rules");
                });
                break;

            case "profiles":
                NavigateProOrGate("Multi-PC profiles", () =>
                {
                    var page = new ProfilesPage();
                    page.SetViewModel(_viewModel.Profiles);
                    ContentFrame.Content = page;
                    SetTitle("Multi-PC profiles");
                });
                break;

            case "alerts":
                NavigateProOrGate("Real-time alerts", () =>
                {
                    var page = new AlertsPage();
                    page.SetViewModel(_viewModel.Alerts);
                    ContentFrame.Content = page;
                    SetTitle("Real-time alerts");
                });
                break;

            case "rules":
                NavigateProOrGate("Whitelist / rule engine", () =>
                {
                    var page = new RuleEnginePage();
                    page.SetViewModel(_viewModel.RuleEngine);
                    ContentFrame.Content = page;
                    SetTitle("Whitelist / Rules");
                });
                break;
        }
    }

    private void NavigateProOrGate(string featureName, Action openFeature)
    {
        if (_viewModel.License.IsProUnlocked)
        {
            openFeature();
            return;
        }

        var gate = new ProUnlockPage();
        gate.SetViewModel(_viewModel.ProUnlock, featureName);
        ContentFrame.Content = gate;
        SetTitle($"{featureName} (Pro)");
    }

    private void SetTitle(string title) => _viewModel.CurrentPageTitle = title;
}
