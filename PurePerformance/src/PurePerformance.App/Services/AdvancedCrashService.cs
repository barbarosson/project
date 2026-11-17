using System.Text;
using PurePerformance.Models;

namespace PurePerformance.Services;

public sealed class AdvancedCrashService : IAdvancedCrashService
{
    private readonly IEventLogService _eventLog;
    private readonly UserSettingsStore _settings;

    public AdvancedCrashService(IEventLogService eventLog, UserSettingsStore settings)
    {
        _eventLog = eventLog;
        _settings = settings;
    }

    public async Task<IReadOnlyList<CrashTrendBucket>> GetTrendsAsync(
        CrashLookback lookback,
        CancellationToken cancellationToken = default)
    {
        var findings = await CollectAsync(lookback, cancellationToken);
        return findings
            .GroupBy(f => f.Category)
            .Select(g => new CrashTrendBucket
            {
                Category = g.Key,
                Label = g.First().CategoryLabel,
                Count = g.Count(),
                Latest = g.Max(x => x.Timestamp)
            })
            .OrderByDescending(b => b.Count)
            .ToList();
    }

    public async Task<IReadOnlyList<CrashCorrelationGroup>> GetCorrelationsAsync(
        CrashLookback lookback,
        CancellationToken cancellationToken = default)
    {
        var findings = await CollectAsync(lookback, cancellationToken);
        return findings
            .GroupBy(f => $"{f.ProviderName}|{f.EventId}|{f.Category}")
            .Select(g =>
            {
                var first = g.First();
                return new CrashCorrelationGroup
                {
                    Key = g.Key,
                    Title = $"{first.ProviderName} · Event {first.EventId} · {first.CategoryLabel}",
                    Count = g.Count(),
                    Samples = g.OrderByDescending(x => x.Timestamp).Take(5).ToList()
                };
            })
            .OrderByDescending(c => c.Count)
            .ToList();
    }

    public async Task<string> ExportReportAsync(
        CrashLookback lookback,
        CancellationToken cancellationToken = default)
    {
        var findings = await CollectAsync(lookback, cancellationToken);
        var trends = findings
            .GroupBy(f => f.Category)
            .OrderByDescending(g => g.Count());

        Directory.CreateDirectory(_settings.ReportsDirectory);
        var path = Path.Combine(
            _settings.ReportsDirectory,
            $"crash-advanced-{DateTime.Now:yyyyMMdd-HHmmss}.md");

        var sb = new StringBuilder();
        sb.AppendLine("# Pure Performance — Advanced Crash report");
        sb.AppendLine();
        sb.AppendLine($"Generated: {DateTimeOffset.Now:u}");
        sb.AppendLine($"Lookback: {(int)lookback} hours");
        sb.AppendLine($"Findings: {findings.Count}");
        sb.AppendLine();
        sb.AppendLine("## Trends by category");
        foreach (var g in trends)
        {
            sb.AppendLine($"- {g.First().CategoryLabel}: {g.Count()}");
        }

        sb.AppendLine();
        sb.AppendLine("## Findings");
        foreach (var f in findings.OrderByDescending(x => x.Timestamp))
        {
            sb.AppendLine($"### {f.Title}");
            sb.AppendLine($"- When: {f.Timestamp:u}");
            sb.AppendLine($"- {f.SummaryLine}");
            sb.AppendLine($"- Explanation: {f.Explanation}");
            sb.AppendLine($"- Fix: {f.RecommendedFix}");
            sb.AppendLine();
        }

        await File.WriteAllTextAsync(path, sb.ToString(), cancellationToken);
        return path;
    }

    private async Task<List<CrashEvent>> CollectAsync(CrashLookback lookback, CancellationToken ct)
    {
        var list = new List<CrashEvent>();
        await foreach (var item in _eventLog.AnalyzeAsync(lookback, ct))
        {
            list.Add(item);
        }

        return list;
    }
}
