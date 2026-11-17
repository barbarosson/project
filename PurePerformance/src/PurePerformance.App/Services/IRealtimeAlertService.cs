using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IRealtimeAlertService
{
    AlertSettings Settings { get; }

    void SaveSettings(AlertSettings settings);

    IReadOnlyList<AlertHistoryEntry> GetHistory();

    void ClearHistory();

    event EventHandler<AlertHistoryEntry>? AlertRaised;

    /// <summary>Starts sampling while the app is open. Noasts when thresholds are crossed.</summary>
    void Start();

    void Stop();

    bool IsRunning { get; }
}
