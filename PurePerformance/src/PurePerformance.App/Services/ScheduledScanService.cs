using System.Text;
using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Daily/weekly summary while the app is open. Writes a local Markdown report.
/// Email is an honest stub — no outbound mail is sent yet.
/// </summary>
public sealed class ScheduledScanService : IScheduledScanService
{
    private readonly UserSettingsStore _settings;
    private readonly IEventLogService _eventLog;
    private readonly ISystemCleanerService _cleaner;
    private readonly IStartupManagerService _startup;

    public ScheduledScanService(
        UserSettingsStore settings,
        IEventLogService eventLog,
        ISystemCleanerService cleaner,
        IStartupManagerService startup)
    {
        _settings = settings;
        _eventLog = eventLog;
        _cleaner = cleaner;
        _startup = startup;
    }

    public ScanScheduleSettings GetSettings() => _settings.ScanSchedule;

    public void SaveSettings(ScanScheduleSettings settings) => _settings.ScanSchedule = settings;

    public bool IsDue(DateTimeOffset nowLocal)
    {
        var s = GetSettings();
        if (!s.IsEnabled) return false;
        if (nowLocal.Hour < s.PreferredHourLocal) return false;

        if (s.LastRunUtc is null) return true;

        var elapsed = nowLocal.ToUniversalTime() - s.LastRunUtc.Value;
        return s.Cadence == ScanCadence.Daily
            ? elapsed >= TimeSpan.FromDays(1)
            : elapsed >= TimeSpan.FromDays(7);
    }

    public async Task<ScheduledScanResult> RunNowAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var crashCount = 0;
            await foreach (var _ in _eventLog.AnalyzeAsync(CrashLookback.Hours72, cancellationToken))
            {
                crashCount++;
            }

            var targets = await _cleaner.GetSafeCleanupTargetsAsync(cancellationToken);
            var reclaimable = targets.Sum(t => t.EstimatedBytes);
            var startups = await _startup.GetStartupEntriesAsync(cancellationToken);
            var enabledStartups = startups.Count(s => s.IsEnabled);

            Directory.CreateDirectory(_settings.ReportsDirectory);
            var path = Path.Combine(
                _settings.ReportsDirectory,
                $"summary-{DateTime.Now:yyyyMMdd-HHmmss}.md");

            var schedule = GetSettings();
            var sb = new StringBuilder();
            sb.AppendLine("# Pure Performance — scheduled summary");
            sb.AppendLine();
            sb.AppendLine($"Generated: {DateTimeOffset.Now:u}");
            sb.AppendLine($"Cadence: {schedule.Cadence}");
            sb.AppendLine();
            sb.AppendLine("## Snapshot");
            sb.AppendLine($"- Crash findings (72h): {crashCount}");
            sb.AppendLine($"- Enabled startup entries: {enabledStartups} / {startups.Count}");
            sb.AppendLine($"- Named cleanup reclaimable (estimate): {CleanupTarget.FormatBytes(reclaimable)}");
            sb.AppendLine();
            sb.AppendLine("## Notes");
            sb.AppendLine("- This is a local report file (Markdown). Print to PDF from any Markdown viewer if needed.");
            sb.AppendLine("- Pure Performance is not a registry cleaner.");
            if (schedule.EmailStubEnabled)
            {
                sb.AppendLine(
                    $"- Email stub: delivery to `{schedule.EmailStubAddress}` is not implemented yet; the report stays on this PC.");
            }

            await File.WriteAllTextAsync(path, sb.ToString(), cancellationToken);

            schedule.LastRunUtc = DateTimeOffset.UtcNow;
            schedule.LastReportUtc = schedule.LastRunUtc;
            schedule.LastReportPath = path;
            SaveSettings(schedule);

            var emailNote = schedule.EmailStubEnabled
                ? " Email delivery remains a stub — nothing was sent."
                : string.Empty;

            return new ScheduledScanResult
            {
                Success = true,
                ReportPath = path,
                Message = $"Summary saved to {path}.{emailNote}"
            };
        }
        catch (Exception ex)
        {
            return new ScheduledScanResult
            {
                Success = false,
                Message = $"Scheduled scan failed: {ex.Message}"
            };
        }
    }
}
