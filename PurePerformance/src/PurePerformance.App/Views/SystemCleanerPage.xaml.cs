using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class SystemCleanerPage : Page
{
    private SystemCleanerViewModel? _viewModel;

    public SystemCleanerViewModel ViewModel =>
        _viewModel ?? throw new InvalidOperationException("ViewModel not set.");

    public SystemCleanerPage()
    {
        InitializeComponent();
        Loaded += async (_, _) =>
        {
            if (_viewModel is not null && _viewModel.Targets.Count == 0 && !_viewModel.IsBusy)
            {
                await _viewModel.RefreshCommand.ExecuteAsync(null);
            }
        };
    }

    public void SetViewModel(SystemCleanerViewModel viewModel)
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
        if (e.PropertyName is nameof(SystemCleanerViewModel.ErrorMessage) or null)
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
}
