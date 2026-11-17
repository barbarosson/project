using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IScheduledScanService
{
    ScanScheduleSettings GetSettings();

    void SaveSettings(ScanScheduleSettings settings);

    bool IsDue(DateTimeOffset nowLocal);

    Task<ScheduledScanResult> RunNowAsync(CancellationToken cancellationToken = default);
}

public sealed class ScheduledScanResult
{
    public bool Success { get; init; }

    public string Message { get; init; } = string.Empty;

    public string? ReportPath { get; init; }
}
