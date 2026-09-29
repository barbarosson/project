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

    private string _dockerStatusText = "Kontrol ediliyor…";
    private string _containerStatusText = "—";
    private string _healthStatusText = "—";
    private string _logText = string.Empty;
    private string _busyText = string.Empty;
    private bool _isBusy;
    private bool _dockerReady;
    private bool _containerExists;
    private bool _containerRunning;
    private bool _haReachable;

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

        RefreshCommand = new AsyncRelayCommand(RefreshAsync, () => !IsBusy);
        InstallDockerCommand = new AsyncRelayCommand(InstallDockerAsync, () => !IsBusy && !DockerReady);
        OpenDockerDownloadCommand = new RelayCommand(OpenDockerDownload);
        CreateStartCommand = new AsyncRelayCommand(CreateStartAsync, () => !IsBusy && DockerReady);
        StartCommand = new AsyncRelayCommand(StartAsync, () => !IsBusy && DockerReady && ContainerExists && !ContainerRunning);
        StopCommand = new AsyncRelayCommand(StopAsync, () => !IsBusy && DockerReady && ContainerRunning);
        RestartCommand = new AsyncRelayCommand(RestartAsync, () => !IsBusy && DockerReady && ContainerExists);
        RemoveCommand = new AsyncRelayCommand(RemoveAsync, () => !IsBusy && DockerReady && ContainerExists);
        OpenBrowserCommand = new AsyncRelayCommand(OpenBrowserAsync, () => !IsBusy);
        LoadLogsCommand = new AsyncRelayCommand(LoadLogsAsync, () => !IsBusy && DockerReady && ContainerExists);

        NextStepsTitle = TurkishNextSteps.Title;
        NextStepsBody = TurkishNextSteps.Body;
        LocalUrl = HaConstants.LocalUrl;
        DockerDownloadUrl = DockerDesktopGuidance.DownloadUrl;

        _pollTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(8) };
        _pollTimer.Tick += async (_, _) =>
        {
            if (!IsBusy)
            {
                await RefreshAsync().ConfigureAwait(true);
            }
        };
    }

    public string NextStepsTitle { get; }
    public string NextStepsBody { get; }
    public string LocalUrl { get; }
    public string DockerDownloadUrl { get; }

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
        try
        {
            var availability = await _docker.ProbeAsync().ConfigureAwait(true);
            DockerReady = availability.IsReady;
            DockerStatusText = availability.MessageTr;
            if (!string.IsNullOrWhiteSpace(availability.Detail) && !availability.IsReady)
            {
                AppendLog($"Docker ayrıntı: {availability.Detail}");
            }

            if (!availability.IsReady)
            {
                if (availability.State == DockerInstallState.CliMissing)
                {
                    DockerStatusText = DockerDesktopGuidance.BuildMissingMessageTr().Split('\n')[0].Trim();
                    AppendLog(DockerDesktopGuidance.BuildMissingMessageTr());
                }
                else if (availability.State == DockerInstallState.InstalledButNotRunning)
                {
                    AppendLog(DockerDesktopGuidance.BuildNotRunningMessageTr());
                }

                ContainerStatusText = "Docker hazır değil";
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
                : "Container henüz oluşturulmadı";

            if (ContainerRunning)
            {
                var health = await _health.CheckAsync().ConfigureAwait(true);
                HaReachable = health.IsReachable;
                HealthStatusText = health.MessageTr;
            }
            else
            {
                HaReachable = false;
                HealthStatusText = ContainerExists ? "Container çalışmıyor" : "—";
            }
        }
        catch (Exception ex)
        {
            AppendLog($"Yenileme hatası: {ex.Message}");
        }
        finally
        {
            RaiseCommands();
        }
    }

    private async Task InstallDockerAsync()
    {
        await RunBusyAsync("Docker Desktop kurulumu deneniyor…", async () =>
        {
            var message = await DockerDesktopGuidance.TrySilentInstallAsync(_runner).ConfigureAwait(true);
            AppendLog(message);
            MessageBox.Show(message, "Docker Desktop", MessageBoxButton.OK, MessageBoxImage.Information);
            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private void OpenDockerDownload()
    {
        try
        {
            Process.Start(new ProcessStartInfo(DockerDesktopGuidance.DownloadUrl) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            AppendLog($"İndirme linki açılamadı: {ex.Message}");
        }
    }

    private async Task CreateStartAsync()
    {
        await RunBusyAsync("Home Assistant kuruluyor / başlatılıyor…", async () =>
        {
            var progress = new Progress<string>(AppendLog);
            await _ha.CreateAndStartAsync(progress: progress).ConfigureAwait(true);
            await WaitForHealthyAsync().ConfigureAwait(true);
            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private async Task StartAsync()
    {
        await RunBusyAsync("Başlatılıyor…", async () =>
        {
            await _ha.StartAsync().ConfigureAwait(true);
            await WaitForHealthyAsync().ConfigureAwait(true);
            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private async Task StopAsync()
    {
        await RunBusyAsync("Durduruluyor…", async () =>
        {
            await _ha.StopAsync().ConfigureAwait(true);
            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private async Task RestartAsync()
    {
        await RunBusyAsync("Yeniden başlatılıyor…", async () =>
        {
            await _ha.RestartAsync().ConfigureAwait(true);
            await WaitForHealthyAsync().ConfigureAwait(true);
            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private async Task RemoveAsync()
    {
        var confirm = MessageBox.Show(
            "Home Assistant container silinsin mi?\n\nYapılandırma volume’u (smart-home-ha-config) KORUNUR.\nVolume’u da silmek için 'Hayır' deyip PowerShell ile volume rm kullanın veya geliştirici seçeneğini kullanın.",
            "Container sil",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (confirm != MessageBoxResult.Yes)
        {
            return;
        }

        await RunBusyAsync("Siliniyor…", async () =>
        {
            await _ha.RemoveAsync(removeVolume: false).ConfigureAwait(true);
            await RefreshAsync().ConfigureAwait(true);
        }).ConfigureAwait(true);
    }

    private async Task OpenBrowserAsync()
    {
        try
        {
            Process.Start(new ProcessStartInfo(HaConstants.LocalUrl) { UseShellExecute = true });
            AppendLog($"Tarayıcı açıldı: {HaConstants.LocalUrl}");
        }
        catch (Exception ex)
        {
            AppendLog($"Tarayıcı açılamadı: {ex.Message}");
        }

        await Task.CompletedTask.ConfigureAwait(true);
    }

    private async Task LoadLogsAsync()
    {
        await RunBusyAsync("Loglar alınıyor…", async () =>
        {
            var logs = await _ha.GetLogsAsync(150).ConfigureAwait(true);
            LogText = string.IsNullOrWhiteSpace(logs.CombinedOutput)
                ? "(log yok)"
                : logs.CombinedOutput;
        }).ConfigureAwait(true);
    }

    private async Task WaitForHealthyAsync()
    {
        AppendLog("Home Assistant hazır olana kadar bekleniyor (en fazla ~2 dk)…");
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(2));
        try
        {
            while (!cts.IsCancellationRequested)
            {
                var health = await _health.CheckAsync(cancellationToken: cts.Token).ConfigureAwait(true);
                HealthStatusText = health.MessageTr;
                HaReachable = health.IsReachable;
                if (health.IsReachable)
                {
                    AppendLog("Home Assistant erişilebilir.");
                    return;
                }

                await Task.Delay(TimeSpan.FromSeconds(3), cts.Token).ConfigureAwait(true);
            }
        }
        catch (OperationCanceledException)
        {
            AppendLog("Zaman aşımı: HA henüz yanıt vermedi. Biraz bekleyip «Tarayıcıda aç» veya «Yenile» deneyin.");
        }
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
            AppendLog($"Hata: {ex.Message}");
            MessageBox.Show(ex.Message, "Hata", MessageBoxButton.OK, MessageBoxImage.Error);
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
