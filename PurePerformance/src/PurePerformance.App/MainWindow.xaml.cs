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

        // Default selection → Dashboard
        if (NavView.MenuItems[0] is NavigationViewItem first)
        {
            NavView.SelectedItem = first;
        }
    }

    private void NavView_SelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
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
                _viewModel.CurrentPageTitle = "Dashboard";
                break;

            case "crash":
                var crash = new CrashAnalyzerPage();
                crash.SetViewModel(_viewModel.CrashAnalyzer);
                ContentFrame.Content = crash;
                _viewModel.CurrentPageTitle = "Crash Analyzer";
                break;

            case "startup":
                var startup = new StartupOptimizerPage();
                startup.SetViewModel(_viewModel.StartupOptimizer);
                ContentFrame.Content = startup;
                _viewModel.CurrentPageTitle = "Startup Optimizer";
                break;

            case "cleaner":
                var cleaner = new SystemCleanerPage();
                cleaner.SetViewModel(_viewModel.SystemCleaner);
                ContentFrame.Content = cleaner;
                _viewModel.CurrentPageTitle = "System Cleaner";
                break;
        }
    }
}
