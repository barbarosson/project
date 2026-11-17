using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class MemoryOptimizerPage : Page
{
    private MemoryOptimizerViewModel? _viewModel;

    public MemoryOptimizerViewModel ViewModel =>
        _viewModel ?? throw new InvalidOperationException("ViewModel not set.");

    public MemoryOptimizerPage()
    {
        InitializeComponent();
        Loaded += async (_, _) =>
        {
            if (_viewModel is not null && !_viewModel.IsBusy && _viewModel.TotalLabel == "—")
            {
                await _viewModel.RefreshCommand.ExecuteAsync(null);
            }
        };
    }

    public void SetViewModel(MemoryOptimizerViewModel viewModel)
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
        if (e.PropertyName is nameof(MemoryOptimizerViewModel.ErrorMessage) or null)
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
