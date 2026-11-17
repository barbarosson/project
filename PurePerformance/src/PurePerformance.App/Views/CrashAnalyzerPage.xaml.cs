using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class CrashAnalyzerPage : Page
{
    private CrashAnalyzerViewModel? _viewModel;

    public CrashAnalyzerViewModel ViewModel =>
        _viewModel ?? throw new InvalidOperationException("ViewModel not set.");

    public CrashAnalyzerPage()
    {
        InitializeComponent();
    }

    public void SetViewModel(CrashAnalyzerViewModel viewModel)
    {
        if (_viewModel is not null)
        {
            _viewModel.PropertyChanged -= OnViewModelPropertyChanged;
        }

        _viewModel = viewModel;
        DataContext = viewModel;
        viewModel.PropertyChanged += OnViewModelPropertyChanged;
        Bindings.Update();
        SyncError();
    }

    private void OnViewModelPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(CrashAnalyzerViewModel.ErrorMessage)
            or nameof(CrashAnalyzerViewModel.HasError)
            or null)
        {
            SyncError();
        }
    }

    private void SyncError()
    {
        var hasError = _viewModel?.HasError == true;
        ErrorBar.IsOpen = hasError;
        ErrorBar.Message = _viewModel?.ErrorMessage ?? string.Empty;
    }
}
