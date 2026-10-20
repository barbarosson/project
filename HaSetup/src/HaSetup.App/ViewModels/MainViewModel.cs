using System.Diagnostics;
using System.Windows;
using System.Windows.Threading;
using HaSetup.App.Mvvm;
using HaSetup.Core;
using HaSetup.Core.Docker;
using HaSetup.Core.HomeAssistant;
using HaSetup.Core.Windows;

namespace HaSetup.App.ViewModels;

public sealed class MainViewModel : ObservableObject
{
    private readonly IDockerClient _docker;
    private readonly IHaContainerService _ha;
    private readonly IHaHealthChecker _health;
    private readonly IProcessRunner _runner;
    private readonly DispatcherTimer _pollTimer;

    private string _dockerStatusText = "Checking…";
    private string _containerStatusText = "—";
    private string _healthStatusText = "—";
    private string _logText = string.Empty;
    private string _busyText = string.Empty;
    private bool _isBusy;
    private bool _isRefreshing;
    private bool _dockerReady;
    private bool _containerExists;
    private bool _containerRunning;
    private bool _haReachable;
    private DockerInstallState? _lastDockerState;
    private bool _guidanceLoggedForCurrentState;

    public MainViewModel(
        IDockerClient? docker = null,
        IHaContainerService? ha = null,
        IHaHealthChecker? health = null,
        IProcessRunner? runner = null)
    {
        _runner = runner ?? new ProcessRunner();
        _docker = docker ?? new DockerClient(_runner);
        _ha = ha ?? new HaContainerService(_docker);
        _health = health ?? new HaHealthChecker();

        RefreshCommand = new AsyncRelayCommand(RefreshAsync, () => !IsBusy && !_isRefreshing);
        InstallDockerCommand = new AsyncRelayCommand(
            InstallDockerAsync,
            () => !IsBusy && !DockerReady && ShowSilentInstall);
        OpenDockerDownloadCommand = new RelayCommand(OpenDockerDownload);
        OpenDockerStoreCommand = new RelayCommand(OpenDockerStore);
        CreateStartCommand = new AsyncRelayCommand(CreateStartAsync, () => !IsBusy && DockerReady);
        StartCommand = new AsyncRelayCommand(StartAsync, () => !IsBusy && DockerReady && ContainerExists && !ContainerRunning);
        StopCommand = new AsyncRelayCommand(StopAsync, () => !IsBusy && DockerReady && ContainerRunning);
        RestartCommand = new AsyncRelayCommand(RestartAsync, () => !IsBusy && DockerReady && ContainerExists);
        RemoveCommand = new AsyncRelayCommand(RemoveAsync, () => !IsBusy && DockerReady && ContainerExists);
        OpenBrowserCommand = new AsyncRelayCommand(OpenBrowserAsync, () => !IsBusy);
        LoadLogsCommand = new AsyncRelayCommand(LoadLogsAsync, () => !IsBusy && DockerReady && ContainerExists);

        NextStepsTitle = EnglishNextSteps.Title;
        NextStepsBody = EnglishNextSteps.Body;
        LocalUrl = HaConstants.LocalUrl;
        DockerDownloadUrl = DockerDesktopGuidance.DownloadUrl;
        DockerRequirementDisclosure = DockerDesktopGuidance.RequirementDisclosure;
        ChannelLabel = AppChannel.ChannelLabel;
        IsStoreBuild = AppChannel.IsStoreBuild;
        ShowSilentInstall = AppChannel.AllowsSilentDockerInstall;

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

    public async Task InitializeAsync()
    {
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
            var availability = await _docker.ProbeAsync().ConfigureAwait(true);
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
            AppendLog($"Refresh error: {ex.Message}");
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
            MessageBox.Show(message, "Smart Home Assistant", MessageBoxButton.OK, MessageBoxImage.Information);
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
            AppendLog($"Could not open download link: {ex.Message}");
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
                AppendLog($"Could not open Docker Store: {ex.Message}");
            }
        }
    }

    private async Task CreateStartAsync()
    {
        await RunBusyAsync("Setting up Home Assistant…", async () =>
        {
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
            "Remove the Home Assistant container?\n\nYes: container is removed; config volume (smart-home-ha-config) is kept.\nNo: cancel.\n\nTo also remove the volume in PowerShell:\ndocker volume rm smart-home-ha-config",
            "Smart Home Assistant",
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
            AppendLog($"Could not open browser: {ex.Message}");
        }
    }

    private async Task LoadLogsAsync()
    {
        await RunBusyAsync("Fetching logs…", async () =>
        {
            var logs = await _ha.GetLogsAsync(150).ConfigureAwait(true);
            var body = string.IsNullOrWhiteSpace(logs.CombinedOutput)
                ? "(no logs)"
                : logs.CombinedOutput.Trim();
            AppendLog("--- Docker container logs ---");
            LogText = string.IsNullOrWhiteSpace(LogText)
                ? body
                : LogText + Environment.NewLine + body;
        }).ConfigureAwait(true);
    }

    private async Task<bool> WaitForHealthyAsync()
    {
        AppendLog("Waiting for Home Assistant to become ready (up to ~2 min)…");
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
                    AppendLog("Home Assistant is reachable.");
                    return true;
                }

                await Task.Delay(TimeSpan.FromSeconds(3), cts.Token).ConfigureAwait(true);
            }
        }
        catch (OperationCanceledException)
        {
            AppendLog("Timed out: HA has not responded yet. Wait a bit, then try “Open in browser” or “Refresh”.");
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
            AppendLog($"Error: {ex.Message}");
            MessageBox.Show(ex.Message, "Smart Home Assistant", MessageBoxButton.OK, MessageBoxImage.Error);
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
    }
}
