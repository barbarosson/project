using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
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

        Closed += (_, _) => _viewModel.Dashboard.StopIfNeeded();

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
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"License refresh: {ex.Message}");
        }
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
                NavigateProOrGate("Startup Optimizer", () =>
                {
                    var startup = new StartupOptimizerPage();
                    startup.SetViewModel(_viewModel.StartupOptimizer);
                    ContentFrame.Content = startup;
                    SetTitle("Startup Optimizer");
                });
                break;

            case "cleaner":
                NavigateProOrGate("System Cleaner", () =>
                {
                    var cleaner = new SystemCleanerPage();
                    cleaner.SetViewModel(_viewModel.SystemCleaner);
                    ContentFrame.Content = cleaner;
                    SetTitle("System Cleaner");
                });
                break;

            case "memory":
                NavigateProOrGate("Memory Optimizer", () =>
                {
                    var memory = new MemoryOptimizerPage();
                    memory.SetViewModel(_viewModel.MemoryOptimizer);
                    ContentFrame.Content = memory;
                    SetTitle("Memory Optimizer");
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
