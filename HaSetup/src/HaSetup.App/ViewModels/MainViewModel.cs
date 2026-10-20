using System.Diagnostics;
using System.Windows;
using System.Windows.Threading;
using HaSetup.App.Licensing;
using HaSetup.App.Mvvm;
using HaSetup.Core;
using HaSetup.Core.Backup;
using HaSetup.Core.Diagnostics;
using HaSetup.Core.Docker;
using HaSetup.Core.HomeAssistant;
using HaSetup.Core.Licensing;
using HaSetup.Core.Network;
using HaSetup.Core.Windows;
using Microsoft.Win32;

namespace HaSetup.App.ViewModels;

public sealed class MainViewModel : ObservableObject
{
    private readonly IDockerClient _docker;
    private readonly IHaContainerService _ha;
    private readonly IHaHealthChecker _health;
    private readonly IProcessRunner _runner;
    private readonly EnvironmentPreflight _preflight;
    private readonly IFirewallRuleService _firewall;
    private readonly ILicenseService _license;
    private readonly IConfigVolumeBackupService _backup;
    private readonly MdnsForwarderHostedService _mdns;
    private readonly DispatcherTimer _pollTimer;

    private string _dockerStatusText = "Checking…";
    private string _containerStatusText = "—";
    private string _healthStatusText = "—";
    private string _logText = string.Empty;
    private string _busyText = string.Empty;
    private string _licenseStatusText = PremiumGate.StatusText(new DevLicenseService(false));
    private string _mdnsStatusText = "mDNS helper is off (default).";
    private bool _isBusy;
    private bool _isRefreshing;
    private bool _dockerReady;
    private bool _containerExists;
    private bool _containerRunning;
    private bool _haReachable;
    private bool _isPremium;
    private bool _mdnsEnabled;
    private bool _simulatePremium;
    private bool _mdnsApplyInProgress;
    private bool _isAppleLimitationAcknowledged;
    private DockerInstallState? _lastDockerState;
    private bool _guidanceLoggedForCurrentState;

    public MainViewModel(
        IDockerClient? docker = null,
        IHaContainerService? ha = null,
        IHaHealthChecker? health = null,
        IProcessRunner? runner = null,
        EnvironmentPreflight? preflight = null,
        IFirewallRuleService? firewall = null,
        ILicenseService? license = null,
        IConfigVolumeBackupService? backup = null,
        MdnsForwarderHostedService? mdns = null)
    {
        _runner = runner ?? new ProcessRunner();
        _docker = docker ?? new DockerClient(_runner);
        _ha = ha ?? new HaContainerService(_docker);
        _health = health ?? new HaHealthChecker();
        _preflight = preflight ?? new EnvironmentPreflight(_runner, _docker);
        _firewall = firewall ?? new FirewallRuleService();
        _license = license ?? CreateDefaultLicenseService();
        _backup = backup ?? new ConfigVolumeBackupService(_docker);
        _mdns = mdns ?? new MdnsForwarderHostedService();

        _isPremium = _license.IsPremium;
        _simulatePremium = _license is DevLicenseService dev && dev.SimulatePremium;
        _licenseStatusText = PremiumGate.StatusText(_license);
        _mdnsStatusText = _mdns.StatusText;
        _mdnsEnabled = _mdns.IsEnabled;

        _license.Changed += (_, _) =>
        {
            IsPremium = _license.IsPremium;
            LicenseStatusText = PremiumGate.StatusText(_license);
            if (_license is DevLicenseService d)
            {
                SimulatePremium = d.SimulatePremium;
            }

            RaiseCommands();
        };

        RefreshCommand = new AsyncRelayCommand(RefreshAsync, () => !IsBusy && !_isRefreshing);
        InstallDockerCommand = new AsyncRelayCommand(
            InstallDockerAsync,
            () => !IsBusy && !DockerReady && ShowSilentInstall);
        OpenDockerDownloadCommand = new RelayCommand(OpenDockerDownload);
        OpenDockerStoreCommand = new RelayCommand(OpenDockerStore);
        CreateStartCommand = new AsyncRelayCommand(
            CreateStartAsync,
            () => !IsBusy && DockerReady && IsAppleLimitationAcknowledged);
        StartCommand = new AsyncRelayCommand(StartAsync, () => !IsBusy && DockerReady && ContainerExists && !ContainerRunning);
        StopCommand = new AsyncRelayCommand(StopAsync, () => !IsBusy && DockerReady && ContainerRunning);
        RestartCommand = new AsyncRelayCommand(RestartAsync, () => !IsBusy && DockerReady && ContainerExists);
        RemoveCommand = new AsyncRelayCommand(RemoveAsync, () => !IsBusy && DockerReady && ContainerExists);
        OpenBrowserCommand = new AsyncRelayCommand(OpenBrowserAsync, () => !IsBusy);
        LoadLogsCommand = new AsyncRelayCommand(LoadLogsAsync, () => !IsBusy && DockerReady && ContainerExists);

        AddFirewallRulesCommand = new AsyncRelayCommand(AddFirewallRulesAsync, () => !IsBusy);
        BackupConfigCommand = new AsyncRelayCommand(BackupConfigAsync, () => !IsBusy && DockerReady);
        RestoreConfigCommand = new AsyncRelayCommand(RestoreConfigAsync, () => !IsBusy && DockerReady);
        PurchasePremiumCommand = new AsyncRelayCommand(PurchasePremiumAsync, () => !IsBusy && !IsPremium);
        RestoreLicenseCommand = new AsyncRelayCommand(RestoreLicenseAsync, () => !IsBusy);
        ToggleSimulatePremiumCommand = new RelayCommand(ToggleSimulatePremium, () => ShowDevLicenseControls);
        ToggleMdnsCommand = new AsyncRelayCommand(ToggleMdnsAsync, () => !IsBusy);

        NextStepsTitle = EnglishNextSteps.Title;
        NextStepsBody = EnglishNextSteps.Body;
        LocalUrl = HaConstants.LocalUrl;
        DockerDownloadUrl = DockerDesktopGuidance.DownloadUrl;
        DockerRequirementDisclosure = DockerDesktopGuidance.RequirementDisclosure;
        ChannelLabel = AppChannel.ChannelLabel;
        IsStoreBuild = AppChannel.IsStoreBuild;
        ShowSilentInstall = AppChannel.AllowsSilentDockerInstall;
        ShowDevLicenseControls = !AppChannel.IsStoreBuild && _license is DevLicenseService;

        NetworkPanelTitle = NetworkDiscoveryGuidance.PanelTitle;
        WhyAutoDiscoveryFails = NetworkDiscoveryGuidance.WhyAutoDiscoveryFails;
        AppleEcosystemWarningTitle = NetworkDiscoveryGuidance.AppleEcosystemWarningTitle;
        AppleEcosystemWarningBody = NetworkDiscoveryGuidance.AppleEcosystemWarningBody;
        AppleLimitationConsentLabel = NetworkDiscoveryGuidance.AppleLimitationConsentLabel;
        ManualIpGuideTitle = NetworkDiscoveryGuidance.ManualIpGuideTitle;
        ManualIpGuideBody = NetworkDiscoveryGuidance.ManualIpGuideBody;
        FirewallSectionTitle = NetworkDiscoveryGuidance.FirewallSectionTitle;
        FirewallSectionBody = NetworkDiscoveryGuidance.FirewallSectionBody;
        FirewallButtonLabel = NetworkDiscoveryGuidance.FirewallButtonLabel;
        MdnsSectionTitle = NetworkDiscoveryGuidance.MdnsSectionTitle;
        MdnsSectionBody = NetworkDiscoveryGuidance.MdnsSectionBody;
        MdnsToggleLabel = NetworkDiscoveryGuidance.MdnsToggleLabel;
        PremiumLockHint = NetworkDiscoveryGuidance.PremiumLockHint;
        ConfigVolumeName = HaConstants.VolumeName;

        _pollTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(8) };
        _pollTimer.Tick += async (_, _) =>
        {
            if (!IsBusy && !_isRefreshing)
            {
                await RefreshAsync().ConfigureAwait(true);
            }
        };
    }

    public string NextStepsTitle { get; }
    public string NextStepsBody { get; }
    public string LocalUrl { get; }
    public string DockerDownloadUrl { get; }
    public string DockerRequirementDisclosure { get; }
    public string ChannelLabel { get; }
    public bool IsStoreBuild { get; }
    public bool ShowSilentInstall { get; }
    public bool ShowDevLicenseControls { get; }
    public string ConfigVolumeName { get; }

    public string NetworkPanelTitle { get; }
    public string WhyAutoDiscoveryFails { get; }
    public string AppleEcosystemWarningTitle { get; }
    public string AppleEcosystemWarningBody { get; }
    public string AppleLimitationConsentLabel { get; }
    public string ManualIpGuideTitle { get; }
    public string ManualIpGuideBody { get; }
    public string FirewallSectionTitle { get; }
    public string FirewallSectionBody { get; }
    public string FirewallButtonLabel { get; }
    public string MdnsSectionTitle { get; }
    public string MdnsSectionBody { get; }
    public string MdnsToggleLabel { get; }
    public string PremiumLockHint { get; }

    /// <summary>
    /// Onboarding consent: user acknowledges Apple HomeKit cannot pair on Windows Docker bridge/NAT.
    /// Required before Install / Start.
    /// </summary>
    public bool IsAppleLimitationAcknowledged
    {
        get => _isAppleLimitationAcknowledged;
        set
        {
            if (SetProperty(ref _isAppleLimitationAcknowledged, value))
            {
                RaiseCommands();
            }
        }
    }

    public string DockerStatusText
    {
        get => _dockerStatusText;
        private set => SetProperty(ref _dockerStatusText, value);
    }

    public string ContainerStatusText
    {
        get => _containerStatusText;
        private set => SetProperty(ref _containerStatusText, value);
    }

    public string HealthStatusText
    {
        get => _healthStatusText;
        private set => SetProperty(ref _healthStatusText, value);
    }

    public string LogText
    {
        get => _logText;
        private set => SetProperty(ref _logText, value);
    }

    public string BusyText
    {
        get => _busyText;
        private set => SetProperty(ref _busyText, value);
    }

    public string LicenseStatusText
    {
        get => _licenseStatusText;
        private set => SetProperty(ref _licenseStatusText, value);
    }

    public string MdnsStatusText
    {
        get => _mdnsStatusText;
        private set => SetProperty(ref _mdnsStatusText, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (SetProperty(ref _isBusy, value))
            {
                RaiseCommands();
            }
        }
    }

    public bool DockerReady
    {
        get => _dockerReady;
        private set
        {
            if (SetProperty(ref _dockerReady, value))
            {
                RaiseCommands();
            }
        }
    }

    public bool ContainerExists
    {
        get => _containerExists;
        private set
        {
            if (SetProperty(ref _containerExists, value))
            {
                RaiseCommands();
            }
        }
    }

    public bool ContainerRunning
    {
        get => _containerRunning;
        private set
        {
            if (SetProperty(ref _containerRunning, value))
            {
                RaiseCommands();
            }
        }
    }

    public bool HaReachable
    {
        get => _haReachable;
        private set => SetProperty(ref _haReachable, value);
    }

    public bool IsPremium
    {
        get => _isPremium;
        private set
        {
            if (SetProperty(ref _isPremium, value))
            {
                OnPropertyChanged(nameof(PremiumFeaturesUnlocked));
                OnPropertyChanged(nameof(BackupButtonLabel));
                OnPropertyChanged(nameof(RestoreButtonLabel));
                OnPropertyChanged(nameof(MdnsToggleEnabledLabel));
                RaiseCommands();
            }
        }
    }

    public bool PremiumFeaturesUnlocked => IsPremium;

    public bool SimulatePremium
    {
        get => _simulatePremium;
        private set => SetProperty(ref _simulatePremium, value);
    }

    public bool MdnsEnabled
    {
        get => _mdnsEnabled;
        set
        {
            if (_mdnsApplyInProgress || _mdnsEnabled == value)
            {
                return;
            }

            // Two-way CheckBox: kick async toggle without blocking the binding thread.
            _ = ApplyMdnsEnabledAsync(value);
        }
    }

    public string BackupButtonLabel =>
        IsPremium ? "Backup config volume…" : PremiumGate.LockedLabel("Backup config volume");

    public string RestoreButtonLabel =>
        IsPremium ? "Restore config volume…" : PremiumGate.LockedLabel("Restore config volume");

    public string MdnsToggleEnabledLabel =>
        IsPremium ? MdnsToggleLabel : PremiumGate.LockedLabel(MdnsToggleLabel);

    public AsyncRelayCommand RefreshCommand { get; }
    public AsyncRelayCommand InstallDockerCommand { get; }
    public RelayCommand OpenDockerDownloadCommand { get; }
    public RelayCommand OpenDockerStoreCommand { get; }
    public AsyncRelayCommand CreateStartCommand { get; }
    public AsyncRelayCommand StartCommand { get; }
    public AsyncRelayCommand StopCommand { get; }
    public AsyncRelayCommand RestartCommand { get; }
    public AsyncRelayCommand RemoveCommand { get; }
    public AsyncRelayCommand OpenBrowserCommand { get; }
    public AsyncRelayCommand LoadLogsCommand { get; }
    public AsyncRelayCommand AddFirewallRulesCommand { get; }
    public AsyncRelayCommand BackupConfigCommand { get; }
    public AsyncRelayCommand RestoreConfigCommand { get; }
    public AsyncRelayCommand PurchasePremiumCommand { get; }
    public AsyncRelayCommand RestoreLicenseCommand { get; }
    public RelayCommand ToggleSimulatePremiumCommand { get; }
    public AsyncRelayCommand ToggleMdnsCommand { get; }

    public async Task InitializeAsync()
    {
        try
        {
            await _license.RefreshAsync().ConfigureAwait(true);
            IsPremium = _license.IsPremium;
            LicenseStatusText = PremiumGate.StatusText(_license);
        }
        catch (Exception ex)
        {
            AppendLog(FriendlyErrorHandler.ToUserMessage(ex, "License refresh failed."));
        }

        await RefreshAsync().ConfigureAwait(true);
        _pollTimer.Start();
    }

    private async Task RefreshAsync()
    {
        if (_isRefreshing)
        {
            return;
        }

        _isRefreshing = true;
        RaiseCommands();
        try
        {
            var daemon = new DockerDaemonChecker(_docker);
            var availability = await daemon.CheckAsync().ConfigureAwait(true);
            DockerReady = availability.IsReady;
            DockerStatusText = availability.Message;

            var stateChanged = _lastDockerState != availability.State;
            _lastDockerState = availability.State;
            if (stateChanged)
            {
                _guidanceLoggedForCurrentState = false;
            }

            if (!availability.IsReady)
            {
                if (availability.State == DockerInstallState.CliMissing)
                {
                    DockerStatusText = DockerDesktopGuidance.BuildMissingMessage().Split('\n')[0].Trim();
                    if (!_guidanceLoggedForCurrentState)
                    {
                        AppendLog(DockerDesktopGuidance.BuildMissingMessage());
                        _guidanceLoggedForCurrentState = true;
                    }
                }
                else if (availability.State == DockerInstallState.InstalledButNotRunning)
                {
                    if (!_guidanceLoggedForCurrentState)
                    {
                        AppendLog(DockerDesktopGuidance.BuildNotRunningMessage());
                        if (!string.IsNullOrWhiteSpace(availability.Detail))
                        {
                            AppendLog($"Docker detail: {availability.Detail}");
                        }

                        _guidanceLoggedForCurrentState = true;
                    }
                }

                ContainerStatusText = "Docker is not ready";
                HealthStatusText = "—";
                ContainerExists = false;
                ContainerRunning = false;
                HaReachable = false;
                return;
            }

            var info = await _ha.GetInfoAsync().ConfigureAwait(true);
            ContainerExists = info.Exists;
            ContainerRunning = info.State == HaLifecycleState.Running;
            ContainerStatusText = info.Exists
                ? $"{info.State} ({info.StatusText}) · {info.ContainerId ?? "?"} · {info.Image ?? HaConstants.Image}"
                : "Container not created yet";

            if (ContainerRunning)
            {
                var health = await _health.CheckAsync().ConfigureAwait(true);
                HaReachable = health.IsReachable;
                HealthStatusText = health.Message;
            }
            else
            {
                HaReachable = false;
                HealthStatusText = ContainerExists ? "Container is not running" : "—";
            }
        }
        catch (Exception ex)
        {
            AppendLog(FriendlyErrorHandler.ToUserMessage(ex, "Refresh failed."));
        }
        finally
        {
            _isRefreshing = false;
            RaiseCommands();
        }
    }

    private async Task InstallDockerAsync()
    {
        if (!ShowSilentInstall)
        {
            AppendLog(await DockerDesktopGuidance.TrySilentInstallAsync(_runner).ConfigureAwait(true));
            OpenDockerStore();
            return;
        }

        await RunBusyAsync("Trying Docker Desktop install…", async () =>
        {
            var message = await DockerDesktopGuidance.TrySilentInstallAsync(_runner).ConfigureAwait(true);
            AppendLog(message);
            MessageBox.Show(message, AppBrand.DisplayName, MessageBoxButton.OK, MessageBoxImage.Information);
            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private void OpenDockerDownload()
    {
        try
        {
            Process.Start(new ProcessStartInfo(DockerDesktopGuidance.DownloadUrl) { UseShellExecute = true });
            AppendLog($"Opened Docker download: {DockerDesktopGuidance.DownloadUrl}");
        }
        catch (Exception ex)
        {
            AppendLog(FriendlyErrorHandler.ToUserMessage(ex, "Could not open download link."));
        }
    }

    private void OpenDockerStore()
    {
        try
        {
            Process.Start(new ProcessStartInfo(DockerDesktopGuidance.MicrosoftStoreDeepLink) { UseShellExecute = true });
            AppendLog("Opened Microsoft Store — Docker Desktop page.");
        }
        catch (Exception)
        {
            try
            {
                Process.Start(new ProcessStartInfo(DockerDesktopGuidance.MicrosoftStoreWebUrl) { UseShellExecute = true });
                AppendLog($"Opened Docker Store web page: {DockerDesktopGuidance.MicrosoftStoreWebUrl}");
            }
            catch (Exception ex)
            {
                AppendLog(FriendlyErrorHandler.ToUserMessage(ex, "Could not open Docker Store."));
            }
        }
    }

    private async Task CreateStartAsync()
    {
        await RunBusyAsync("Setting up local HA container…", async () =>
        {
            if (!await EnsurePreflightAsync().ConfigureAwait(true))
            {
                return;
            }

            var progress = new Progress<string>(AppendLog);
            await _ha.CreateAndStartAsync(progress: progress).ConfigureAwait(true);
            if (await WaitForHealthyAsync().ConfigureAwait(true))
            {
                OpenBrowser();
            }

            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private async Task StartAsync()
    {
        await RunBusyAsync("Starting…", async () =>
        {
            if (!await EnsurePreflightAsync().ConfigureAwait(true))
            {
                return;
            }

            await _ha.StartAsync().ConfigureAwait(true);
            if (await WaitForHealthyAsync().ConfigureAwait(true))
            {
                OpenBrowser();
            }

            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private async Task StopAsync()
    {
        await RunBusyAsync("Stopping…", async () =>
        {
            await _ha.StopAsync().ConfigureAwait(true);
            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private async Task RestartAsync()
    {
        await RunBusyAsync("Restarting…", async () =>
        {
            if (!await EnsurePreflightAsync().ConfigureAwait(true))
            {
                return;
            }

            await _ha.RestartAsync().ConfigureAwait(true);
            if (await WaitForHealthyAsync().ConfigureAwait(true))
            {
                OpenBrowser();
            }

            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private async Task RemoveAsync()
    {
        var confirm = MessageBox.Show(
            "Remove the local HA container?\n\nYes: container is removed; config volume (smart-home-ha-config) is kept.\nNo: cancel.\n\nTo also remove the volume in PowerShell:\ndocker volume rm smart-home-ha-config",
            AppBrand.DisplayName,
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (confirm != MessageBoxResult.Yes)
        {
            return;
        }

        await RunBusyAsync("Removing…", async () =>
        {
            await _ha.RemoveAsync(removeVolume: false).ConfigureAwait(true);
            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private async Task OpenBrowserAsync()
    {
        OpenBrowser();
        await Task.CompletedTask.ConfigureAwait(true);
    }

    private void OpenBrowser()
    {
        try
        {
            Process.Start(new ProcessStartInfo(HaConstants.LocalUrl) { UseShellExecute = true });
            AppendLog($"Opened browser: {HaConstants.LocalUrl}");
        }
        catch (Exception ex)
        {
            AppendLog(FriendlyErrorHandler.ToUserMessage(ex, "Could not open browser."));
        }
    }

    private async Task LoadLogsAsync()
    {
        await RunBusyAsync("Fetching logs…", async () =>
        {
            var logs = await _ha.GetLogsAsync(150).ConfigureAwait(true);
            if (!logs.Succeeded)
            {
                AppendLog(FriendlyErrorHandler.ToUserMessage(logs.CombinedOutput, "Could not fetch logs."));
                return;
            }

            var body = string.IsNullOrWhiteSpace(logs.CombinedOutput)
                ? "(no logs)"
                : logs.CombinedOutput.Trim();
            AppendLog("--- Docker container logs ---");
            LogText = string.IsNullOrWhiteSpace(LogText)
                ? body
                : LogText + Environment.NewLine + body;
        }).ConfigureAwait(true);
    }

    private async Task AddFirewallRulesAsync()
    {
        await RunBusyAsync("Adding Windows Firewall rules (UAC)…", async () =>
        {
            var result = await _firewall.EnsureHaDiscoveryRulesAsync().ConfigureAwait(true);
            AppendLog(result.Message);
            if (!string.IsNullOrWhiteSpace(result.Detail))
            {
                AppendLog($"Detail: {result.Detail}");
            }

            MessageBox.Show(
                result.Message,
                AppBrand.DisplayName,
                MessageBoxButton.OK,
                result.Succeeded ? MessageBoxImage.Information : MessageBoxImage.Warning);
        }).ConfigureAwait(true);
    }

    private async Task BackupConfigAsync()
    {
        if (!await EnsurePremiumOrOfferPurchaseAsync("Config volume backup").ConfigureAwait(true))
        {
            return;
        }

        var dialog = new SaveFileDialog
        {
            Title = "Backup config volume",
            Filter = "Config archive (*.zip)|*.zip",
            FileName = $"{HaConstants.VolumeName}-{DateTime.Now:yyyyMMdd-HHmm}.zip",
            AddExtension = true,
            DefaultExt = ".zip",
        };

        if (dialog.ShowDialog() != true)
        {
            return;
        }

        await RunBusyAsync("Backing up config volume…", async () =>
        {
            var progress = new Progress<string>(AppendLog);
            var result = await _backup.BackupToZipAsync(dialog.FileName, progress: progress).ConfigureAwait(true);
            AppendLog(result.Message);
            if (!string.IsNullOrWhiteSpace(result.Detail))
            {
                AppendLog($"Detail: {result.Detail}");
            }

            MessageBox.Show(
                result.Message,
                AppBrand.DisplayName,
                MessageBoxButton.OK,
                result.Succeeded ? MessageBoxImage.Information : MessageBoxImage.Warning);
        }).ConfigureAwait(true);
    }

    private async Task RestoreConfigAsync()
    {
        if (!await EnsurePremiumOrOfferPurchaseAsync("Config volume restore").ConfigureAwait(true))
        {
            return;
        }

        var dialog = new OpenFileDialog
        {
            Title = "Restore config volume",
            Filter = "Config archive (*.zip)|*.zip|All files (*.*)|*.*",
            CheckFileExists = true,
        };

        if (dialog.ShowDialog() != true)
        {
            return;
        }

        var confirm = MessageBox.Show(
            $"Restore will replace files in Docker volume “{HaConstants.VolumeName}”.\n\nContinue?",
            AppBrand.DisplayName,
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);
        if (confirm != MessageBoxResult.Yes)
        {
            return;
        }

        await RunBusyAsync("Restoring config volume…", async () =>
        {
            var progress = new Progress<string>(AppendLog);
            var result = await _backup.RestoreFromZipAsync(dialog.FileName, progress: progress).ConfigureAwait(true);
            AppendLog(result.Message);
            if (!string.IsNullOrWhiteSpace(result.Detail))
            {
                AppendLog($"Detail: {result.Detail}");
            }

            MessageBox.Show(
                result.Message,
                AppBrand.DisplayName,
                MessageBoxButton.OK,
                result.Succeeded ? MessageBoxImage.Information : MessageBoxImage.Warning);
        }).ConfigureAwait(true);
    }

    private async Task PurchasePremiumAsync()
    {
        await RunBusyAsync("Opening Premium purchase…", async () =>
        {
            var result = await _license.PurchaseAsync().ConfigureAwait(true);
            IsPremium = _license.IsPremium;
            LicenseStatusText = PremiumGate.StatusText(_license);
            AppendLog(result.Message);
            MessageBox.Show(
                result.Message,
                AppBrand.DisplayName,
                MessageBoxButton.OK,
                result.Succeeded ? MessageBoxImage.Information : MessageBoxImage.Warning);
        }).ConfigureAwait(true);
    }

    private async Task RestoreLicenseAsync()
    {
        await RunBusyAsync("Restoring license…", async () =>
        {
            var result = await _license.RestoreAsync().ConfigureAwait(true);
            IsPremium = _license.IsPremium;
            LicenseStatusText = PremiumGate.StatusText(_license);
            AppendLog(result.Message);
            MessageBox.Show(
                result.Message,
                AppBrand.DisplayName,
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        }).ConfigureAwait(true);
    }

    private void ToggleSimulatePremium()
    {
        if (_license is not DevLicenseService dev)
        {
            return;
        }

        try
        {
            dev.SetSimulatePremium(!dev.SimulatePremium);
            SimulatePremium = dev.SimulatePremium;
            IsPremium = _license.IsPremium;
            LicenseStatusText = PremiumGate.StatusText(_license);
            AppendLog(SimulatePremium
                ? "Simulate premium: ON (dev / sideload)."
                : "Simulate premium: OFF (Free tier).");
            RaiseCommands();
        }
        catch (Exception ex)
        {
            AppendLog(FriendlyErrorHandler.ToUserMessage(ex, "Could not toggle premium simulation."));
        }
    }

    private async Task ToggleMdnsAsync()
    {
        await ApplyMdnsEnabledAsync(!_mdns.IsEnabled).ConfigureAwait(true);
    }

    private async Task ApplyMdnsEnabledAsync(bool wantEnabled)
    {
        if (_mdnsApplyInProgress)
        {
            return;
        }

        _mdnsApplyInProgress = true;
        try
        {
            if (wantEnabled && !IsPremium)
            {
                SetProperty(ref _mdnsEnabled, false, nameof(MdnsEnabled));
                await EnsurePremiumOrOfferPurchaseAsync("mDNS helper").ConfigureAwait(true);
                MdnsStatusText = _mdns.StatusText;
                return;
            }

            await RunBusyAsync(wantEnabled ? "Enabling mDNS helper…" : "Disabling mDNS helper…", async () =>
            {
                var result = await _mdns.SetEnabledAsync(wantEnabled, IsPremium).ConfigureAwait(true);
                SetProperty(ref _mdnsEnabled, _mdns.IsEnabled, nameof(MdnsEnabled));
                MdnsStatusText = result.Message;
                AppendLog(result.Message);
                if (!result.Succeeded)
                {
                    MessageBox.Show(result.Message, AppBrand.DisplayName, MessageBoxButton.OK, MessageBoxImage.Warning);
                }
            }).ConfigureAwait(true);
        }
        finally
        {
            _mdnsApplyInProgress = false;
        }
    }

    private async Task<bool> EnsurePremiumOrOfferPurchaseAsync(string featureName)
    {
        if (IsPremium)
        {
            return true;
        }

        var prompt = PremiumGate.PurchasePrompt(featureName);
        var choice = MessageBox.Show(
            prompt + "\n\nYes = unlock / purchase now\nNo = cancel",
            AppBrand.DisplayName,
            MessageBoxButton.YesNo,
            MessageBoxImage.Information);

        if (choice != MessageBoxResult.Yes)
        {
            AppendLog($"{featureName}: Premium required (cancelled).");
            return false;
        }

        var result = await _license.PurchaseAsync().ConfigureAwait(true);
        IsPremium = _license.IsPremium;
        LicenseStatusText = PremiumGate.StatusText(_license);
        AppendLog(result.Message);
        if (!IsPremium)
        {
            MessageBox.Show(result.Message, AppBrand.DisplayName, MessageBoxButton.OK, MessageBoxImage.Warning);
            return false;
        }

        return true;
    }

    private async Task<bool> EnsurePreflightAsync()
    {
        AppendLog("Preflight: checking WSL and Docker daemon…");
        var result = await _preflight.EnsureReadyAsync().ConfigureAwait(true);
        if (result.Ok)
        {
            AppendLog(result.Message);
            if (!string.IsNullOrWhiteSpace(result.Detail))
            {
                AppendLog(result.Detail);
            }

            return true;
        }

        AppendLog(result.Message);
        if (!string.IsNullOrWhiteSpace(result.Detail))
        {
            AppendLog($"Detail: {result.Detail}");
        }

        MessageBox.Show(result.Message, AppBrand.DisplayName, MessageBoxButton.OK, MessageBoxImage.Warning);
        await RefreshAsync().ConfigureAwait(true);
        return false;
    }

    private async Task<bool> WaitForHealthyAsync()
    {
        AppendLog("Waiting for the local hub to become ready (up to ~2 min)…");
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(2));
        try
        {
            while (!cts.IsCancellationRequested)
            {
                var health = await _health.CheckAsync(cancellationToken: cts.Token).ConfigureAwait(true);
                HealthStatusText = health.Message;
                HaReachable = health.IsReachable;
                if (health.IsReachable)
                {
                    AppendLog("Local hub is reachable.");
                    return true;
                }

                await Task.Delay(TimeSpan.FromSeconds(3), cts.Token).ConfigureAwait(true);
            }
        }
        catch (OperationCanceledException)
        {
            AppendLog("Timed out: the local hub has not responded yet. Wait a bit, then try “Open in browser” or “Refresh”.");
        }

        return false;
    }

    private async Task RunBusyAsync(string message, Func<Task> action)
    {
        IsBusy = true;
        BusyText = message;
        AppendLog(message);
        try
        {
            await action().ConfigureAwait(true);
        }
        catch (Exception ex)
        {
            var userMessage = FriendlyErrorHandler.ToUserMessage(ex);
            AppendLog(userMessage);
            MessageBox.Show(userMessage, AppBrand.DisplayName, MessageBoxButton.OK, MessageBoxImage.Error);
        }
        finally
        {
            IsBusy = false;
            BusyText = string.Empty;
            RaiseCommands();
        }
    }

    private void AppendLog(string line)
    {
        var stamp = DateTime.Now.ToString("HH:mm:ss");
        var next = $"[{stamp}] {line.Trim()}";
        LogText = string.IsNullOrWhiteSpace(LogText) ? next : LogText + Environment.NewLine + next;
    }

    private void RaiseCommands()
    {
        RefreshCommand.RaiseCanExecuteChanged();
        InstallDockerCommand.RaiseCanExecuteChanged();
        CreateStartCommand.RaiseCanExecuteChanged();
        StartCommand.RaiseCanExecuteChanged();
        StopCommand.RaiseCanExecuteChanged();
        RestartCommand.RaiseCanExecuteChanged();
        RemoveCommand.RaiseCanExecuteChanged();
        OpenBrowserCommand.RaiseCanExecuteChanged();
        LoadLogsCommand.RaiseCanExecuteChanged();
        AddFirewallRulesCommand.RaiseCanExecuteChanged();
        BackupConfigCommand.RaiseCanExecuteChanged();
        RestoreConfigCommand.RaiseCanExecuteChanged();
        PurchasePremiumCommand.RaiseCanExecuteChanged();
        RestoreLicenseCommand.RaiseCanExecuteChanged();
        ToggleSimulatePremiumCommand.RaiseCanExecuteChanged();
        ToggleMdnsCommand.RaiseCanExecuteChanged();
    }

    private static ILicenseService CreateDefaultLicenseService() =>
        AppChannel.IsStoreBuild
            ? new StoreLicenseService(new WindowsStorePurchaseClient())
            : new DevLicenseService();
}
