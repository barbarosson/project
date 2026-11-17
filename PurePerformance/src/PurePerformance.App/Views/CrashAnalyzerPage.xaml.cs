using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class CrashAnalyzerPage : Page
{
    // null! until SetViewModel — avoids throwing during InitializeComponent / x:Bind warmup.
    public CrashAnalyzerViewModel ViewModel { get; private set; } = null!;

    public CrashAnalyzerPage()
    {
        InitializeComponent();
    }

    public void SetViewModel(CrashAnalyzerViewModel viewModel)
    {
        if (ViewModel is not null)
        {
            ViewModel.PropertyChanged -= OnViewModelPropertyChanged;
        }

        ViewModel = viewModel;
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
        var hasError = ViewModel?.HasError == true;
        ErrorBar.IsOpen = hasError;
        ErrorBar.Message = ViewModel?.ErrorMessage ?? string.Empty;
    }
}
