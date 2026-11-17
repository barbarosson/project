using Microsoft.UI.Xaml.Controls;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class AlertsPage : Page
{
    private AlertsViewModel? _vm;
    public AlertsViewModel ViewModel => _vm ?? throw new InvalidOperationException("VM not set");
    public AlertsPage() => InitializeComponent();

    public void SetViewModel(AlertsViewModel vm)
    {
        if (_vm is not null) _vm.PropertyChanged -= OnChanged;
        _vm = vm;
        vm.PropertyChanged += OnChanged;
        Bindings.Update();
        SyncToast();
    }

    private void OnChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(AlertsViewModel.LatestToast) or null) SyncToast();
    }

    private void SyncToast()
    {
        var msg = _vm?.LatestToast;
        ToastBar.Message = msg ?? string.Empty;
        ToastBar.IsOpen = !string.IsNullOrEmpty(msg);
    }
}
