using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class StartupOptimizerPage : Page
{
    private StartupOptimizerViewModel? _viewModel;

    public StartupOptimizerViewModel ViewModel =>
        _viewModel ?? throw new InvalidOperationException("ViewModel not set.");

    public StartupOptimizerPage()
    {
        InitializeComponent();
        Loaded += async (_, _) =>
        {
            if (_viewModel is not null && _viewModel.Entries.Count == 0 && !_viewModel.IsBusy)
            {
                await _viewModel.RefreshCommand.ExecuteAsync(null);
            }
        };
    }

    public void SetViewModel(StartupOptimizerViewModel viewModel)
    {
        if (_viewModel is not null)
        {
            _viewModel.PropertyChanged -= OnPropertyChanged;
        }

        _viewModel = viewModel;
        viewModel.PropertyChanged += OnPropertyChanged;
        Bindings.Update();
        SyncError();
    }

    private void OnPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(StartupOptimizerViewModel.ErrorMessage) or null)
        {
            SyncError();
        }
    }

    private void SyncError()
    {
        var msg = _viewModel?.ErrorMessage;
        ErrorBar.IsOpen = !string.IsNullOrEmpty(msg);
        ErrorBar.Message = msg ?? string.Empty;
    }

    private async void ToggleButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button { Tag: StartupEntryItem item })
        {
            await ViewModel.SetEnabledCommand.ExecuteAsync(item);
        }
    }
}
