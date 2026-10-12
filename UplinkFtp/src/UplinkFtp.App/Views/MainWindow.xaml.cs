using System;
using UplinkFtp.Helpers;
using UplinkFtp.ViewModels;
using UplinkFtp.Views.Dialogs;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace UplinkFtp.Views;

/// <summary>Classic 4-panel shell: quick connect, log, local/remote browsers, queue.</summary>
public sealed partial class MainWindow : Window
{
    public MainViewModel ViewModel { get; }

    public MainWindow(MainViewModel viewModel)
    {
        ViewModel = viewModel;
        InitializeComponent();

        LogPanel.Bind(ViewModel.Log);
        LocalPanel.Bind(ViewModel.LocalBrowser, ViewModel);
        RemotePanel.Bind(ViewModel.RemoteBrowser, ViewModel);
        QueuePanel.Bind(ViewModel.TransferQueue);

        ViewModel.OpenSiteManagerRequested += OnOpenSiteManagerRequested;
        ViewModel.OpenSettingsRequested += OnOpenSettingsRequested;
        ViewModel.OpenLicenseRequested += OnOpenLicenseRequested;
        ViewModel.CredentialsApplied += OnCredentialsApplied;
        ViewModel.PropertyChanged += OnViewModelPropertyChanged;

        ApplyThemeFromSettings();
        UpdateStatusAppearance();
        Activated += OnActivatedOnce;
    }

    private async void OnActivatedOnce(object sender, WindowActivatedEventArgs args)
    {
        Activated -= OnActivatedOnce;
        ApplyThemeFromSettings();
        await ViewModel.InitializeAsync();
    }

    private void ApplyThemeFromSettings()
        => ThemeHelper.ApplyFromSettings(ViewModel.Settings, RootGrid);

    private void OnViewModelPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(MainViewModel.StatusText) or nameof(MainViewModel.IsConnected))
        {
            UpdateStatusAppearance();
        }
    }

    private void UpdateStatusAppearance()
    {
        var text = ViewModel.StatusText ?? string.Empty;
        var isError = text.Contains("fail", StringComparison.OrdinalIgnoreCase)
                      || text.Contains("error", StringComparison.OrdinalIgnoreCase);

        if (isError)
        {
            StatusTextBlock.ClearValue(TextBlock.ForegroundProperty);
            StatusTextBlock.Style = (Style)Application.Current.Resources["UplinkStatusSignalStyle"];
            return;
        }

        if (ViewModel.IsConnected)
        {
            StatusTextBlock.Style = (Style)Application.Current.Resources["UplinkMutedTextStyle"];
            StatusTextBlock.Foreground = (Microsoft.UI.Xaml.Media.Brush)Application.Current.Resources["UplinkAccentBrush"];
            StatusTextBlock.FontWeight = Microsoft.UI.Text.FontWeights.SemiBold;
            return;
        }

        StatusTextBlock.ClearValue(TextBlock.ForegroundProperty);
        StatusTextBlock.ClearValue(TextBlock.FontWeightProperty);
        StatusTextBlock.Style = (Style)Application.Current.Resources["UplinkMutedTextStyle"];
    }

    private void PasswordBox_PasswordChanged(object sender, RoutedEventArgs e)
    {
        ViewModel.Password = PasswordBox.Password;
    }

    private void OnCredentialsApplied(object? sender, EventArgs e)
    {
        PasswordBox.Password = ViewModel.Password ?? string.Empty;
    }

    private async void OnOpenSiteManagerRequested(object? sender, EventArgs e)
    {
        await ShowSiteManagerAsync().ConfigureAwait(true);
    }

    private async void OnOpenSettingsRequested(object? sender, EventArgs e)
    {
        await ShowSettingsAsync().ConfigureAwait(true);
    }

    private async void OnOpenLicenseRequested(object? sender, EventArgs e)
    {
        await ShowLicenseAsync().ConfigureAwait(true);
    }

    private async System.Threading.Tasks.Task ShowSiteManagerAsync()
    {
        var vm = App.Services.GetRequiredService<SiteManagerViewModel>();
        await vm.LoadAsync().ConfigureAwait(true);

        var dialog = new SiteManagerDialog(vm)
        {
            XamlRoot = RootGrid.XamlRoot
        };

        void OnConnect(object? s, SiteConnectRequest request)
        {
            ViewModel.ApplySite(request.Site, request.Password);
            dialog.Hide();
            _ = ViewModel.ConnectCommand.ExecuteAsync(null);
        }

        vm.ConnectRequested += OnConnect;
        try
        {
            await dialog.ShowAsync();
        }
        finally
        {
            vm.ConnectRequested -= OnConnect;
        }
    }

    private async System.Threading.Tasks.Task ShowSettingsAsync()
    {
        var vm = App.Services.GetRequiredService<SettingsViewModel>();
        vm.AttachLog(ViewModel.Log);
        vm.LoadFromSettings();

        void OnSettingsSaved(object? sender, EventArgs e)
        {
            ViewModel.AcceptAnyCertificate = ViewModel.Settings.AcceptAnyCertificate;
            ApplyThemeFromSettings();
        }

        vm.SettingsSaved += OnSettingsSaved;
        try
        {
            var dialog = new SettingsDialog(vm)
            {
                XamlRoot = RootGrid.XamlRoot
            };

            await dialog.ShowAsync();
        }
        finally
        {
            vm.SettingsSaved -= OnSettingsSaved;
        }

        // Keep quick-connect trust checkbox in sync with saved setting.
        ViewModel.AcceptAnyCertificate = ViewModel.Settings.AcceptAnyCertificate;
        ApplyThemeFromSettings();
    }

    private async System.Threading.Tasks.Task ShowLicenseAsync()
    {
        var vm = App.Services.GetRequiredService<LicenseViewModel>();
        vm.RefreshDisplay();

        var dialog = new LicenseDialog(vm)
        {
            XamlRoot = RootGrid.XamlRoot
        };

        await dialog.ShowAsync();
        ViewModel.RefreshLicenseStatusText();
    }
}
