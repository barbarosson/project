using PurePerformance.Models;

namespace PurePerformance.Services;

public sealed class RealtimeAlertService : IRealtimeAlertService
{
    private readonly UserSettingsStore _store;
    private readonly IPerformanceMonitorService _perf;
    private readonly ILicenseService _license;
    private CancellationTokenSource? _cts;
    private DateTimeOffset _lastCpuAlert = DateTimeOffset.MinValue;
    private DateTimeOffset _lastDiskAlert = DateTimeOffset.MinValue;

    public RealtimeAlertService(
        UserSettingsStore store,
        IPerformanceMonitorService perf,
        ILicenseService license)
    {
        _store = store;
        _perf = perf;
        _license = license;
        Settings = store.Alerts;
    }

    public AlertSettings Settings { get; private set; }

    public bool IsRunning { get; private set; }

    public event EventHandler<AlertHistoryEntry>? AlertRaised;

    public void SaveSettings(AlertSettings settings)
    {
        Settings = settings;
        _store.Alerts = settings;
    }

    public IReadOnlyList<AlertHistoryEntry> GetHistory() => _store.GetAlertHistory();

    public void ClearHistory() => _store.ClearAlertHistory();

    public void Start()
    {
        if (!_license.IsProUnlocked) return;
        if (IsRunning) return;

        _cts = new CancellationTokenSource();
        IsRunning = true;
        _ = LoopAsync(_cts.Token);
    }

    public void Stop()
    {
        _cts?.Cancel();
        IsRunning = false;
    }

    private async Task LoopAsync(CancellationToken token)
    {
        try
        {
            await foreach (var sample in _perf.StreamSamplesAsync(TimeSpan.FromSeconds(2), token))
            {
                if (!Settings.IsEnabled || !_license.IsProUnlocked)
                {
                    continue;
                }

                var now = DateTimeOffset.Now;
                var cooldown = TimeSpan.FromSeconds(Math.Max(15, Settings.CooldownSeconds));

                if (sample.CpuPercent >= Settings.CpuSpikePercent && now - _lastCpuAlert >= cooldown)
                {
                    _lastCpuAlert = now;
                    Raise("CPU", sample.CpuPercent,
                        $"CPU spiked to {sample.CpuPercent:0.0}% (threshold {Settings.CpuSpikePercent:0}%).");
                }

                if (sample.DiskPercent >= Settings.DiskSpikePercent && now - _lastDiskAlert >= cooldown)
                {
                    _lastDiskAlert = now;
                    Raise("Disk", sample.DiskPercent,
                        $"Disk activity spiked to {sample.DiskPercent:0.0}% (threshold {Settings.DiskSpikePercent:0}%).");
                }
            }
        }
        catch (OperationCanceledException)
        {
            // expected
        }
        finally
        {
            IsRunning = false;
        }
    }

    private void Raise(string kind, double value, string message)
    {
        var entry = new AlertHistoryEntry
        {
            Timestamp = DateTimeOffset.Now,
            Kind = kind,
            Value = value,
            Message = message
        };
        _store.AppendAlert(entry);
        AlertRaised?.Invoke(this, entry);
    }
}
