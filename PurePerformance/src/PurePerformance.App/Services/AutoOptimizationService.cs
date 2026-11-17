using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Conditional cleanup / startup suggestions. Auto-apply only runs named cleaner targets when explicitly enabled.
/// </summary>
public sealed class AutoOptimizationService : IAutoOptimizationService
{
    private readonly UserSettingsStore _store;
    private readonly ISystemCleanerService _cleaner;
    private readonly IStartupManagerService _startup;
    private readonly IEventLogService _eventLog;
    private readonly IPerformanceMonitorService _perf;
    private readonly object _gate = new();
    private List<AutoOptimizationRule> _rules;

    public AutoOptimizationService(
        UserSettingsStore store,
        ISystemCleanerService cleaner,
        IStartupManagerService startup,
        IEventLogService eventLog,
        IPerformanceMonitorService perf)
    {
        _store = store;
        _cleaner = cleaner;
        _startup = startup;
        _eventLog = eventLog;
        _perf = perf;
        _rules = store.GetAutoRules().ToList();
        if (_rules.Count == 0)
        {
            _rules.Add(CreateSample());
            _store.SaveAutoRules(_rules);
        }
    }

    public IReadOnlyList<AutoOptimizationRule> GetRules()
    {
        lock (_gate) return _rules.Select(Clone).ToList();
    }

    public void SaveRules(IEnumerable<AutoOptimizationRule> rules)
    {
        lock (_gate)
        {
            _rules = rules.Select(Clone).ToList();
            _store.SaveAutoRules(_rules);
        }
    }

    public AutoOptimizationRule AddDefaultRule()
    {
        var rule = CreateSample();
        lock (_gate)
        {
            _rules.Add(rule);
            _store.SaveAutoRules(_rules);
        }

        return Clone(rule);
    }

    public void RemoveRule(string id)
    {
        lock (_gate)
        {
            _rules.RemoveAll(r => r.Id == id);
            _store.SaveAutoRules(_rules);
        }
    }

    public async Task<IReadOnlyList<string>> EvaluateAsync(CancellationToken cancellationToken = default)
    {
        var messages = new List<string>();
        PerformanceSample? sample = null;
        await foreach (var s in _perf.StreamSamplesAsync(TimeSpan.FromMilliseconds(200), cancellationToken))
        {
            sample = s;
            break;
        }

        var startups = await _startup.GetStartupEntriesAsync(cancellationToken);
        var crashCount = 0;
        await foreach (var _ in _eventLog.AnalyzeAsync(CrashLookback.Hours24, cancellationToken))
        {
            crashCount++;
        }

        var drive = Path.GetPathRoot(Environment.SystemDirectory) ?? "C:\\";
        double diskFreePercent = 100;
        try
        {
            var di = new DriveInfo(drive);
            if (di.IsReady && di.TotalSize > 0)
            {
                diskFreePercent = 100.0 * di.AvailableFreeSpace / di.TotalSize;
            }
        }
        catch
        {
            // Keep default.
        }

        List<AutoOptimizationRule> snapshot;
        lock (_gate) snapshot = _rules.Select(Clone).ToList();

        foreach (var rule in snapshot.Where(r => r.IsEnabled))
        {
            var hit = rule.Condition switch
            {
                OptimizationConditionKind.DiskFreeBelowPercent => diskFreePercent < rule.Threshold,
                OptimizationConditionKind.MemoryUsedAbovePercent => (sample?.MemoryPercent ?? 0) >= rule.Threshold,
                OptimizationConditionKind.StartupEntryCountAbove => startups.Count(s => s.IsEnabled) >= rule.Threshold,
                OptimizationConditionKind.CrashFindingsAbove => crashCount >= rule.Threshold,
                _ => false
            };

            if (!hit)
            {
                rule.LastResult = "Condition not met.";
                continue;
            }

            switch (rule.Action)
            {
                case OptimizationActionKind.SuggestCleanerTargets:
                    var targets = await _cleaner.GetSafeCleanupTargetsAsync(cancellationToken);
                    rule.LastResult =
                        $"Suggestion: review Cleaner — about {CleanupTarget.FormatBytes(targets.Sum(t => t.EstimatedBytes))} reclaimable.";
                    break;
                case OptimizationActionKind.SuggestDisableStartup:
                    rule.LastResult =
                        $"Suggestion: review Startup Optimizer — {startups.Count(s => s.IsEnabled)} enabled entries.";
                    break;
                case OptimizationActionKind.SuggestMemoryOptimize:
                    rule.LastResult = "Suggestion: open Memory Optimizer and trim working sets if the PC feels sluggish.";
                    break;
                case OptimizationActionKind.RunCleanerSelected:
                    if (rule.AutoApply)
                    {
                        var all = await _cleaner.GetSafeCleanupTargetsAsync(cancellationToken);
                        var ids = all.Where(t => !t.RequiresAdmin).Select(t => t.Id).ToList();
                        if (ids.Count > 0)
                        {
                            var result = await _cleaner.CleanAsync(ids, cancellationToken: cancellationToken);
                            rule.LastResult =
                                $"Auto-clean ran on non-admin targets: removed {CleanupTarget.FormatBytes(result.BytesRemoved)}.";
                        }
                        else
                        {
                            rule.LastResult = "Auto-clean skipped — no non-admin targets.";
                        }
                    }
                    else
                    {
                        rule.LastResult = "Would run Cleaner (auto-apply is off — suggestion only).";
                    }

                    break;
            }

            messages.Add($"{rule.Name}: {rule.LastResult}");
        }

        SaveRules(snapshot);
        return messages;
    }

    private static AutoOptimizationRule CreateSample() => new()
    {
        Name = "Low free disk → suggest Cleaner",
        Condition = OptimizationConditionKind.DiskFreeBelowPercent,
        Threshold = 15,
        Action = OptimizationActionKind.SuggestCleanerTargets,
        IsEnabled = true,
        AutoApply = false
    };

    private static AutoOptimizationRule Clone(AutoOptimizationRule r) => new()
    {
        Id = r.Id,
        Name = r.Name,
        Condition = r.Condition,
        Threshold = r.Threshold,
        Action = r.Action,
        IsEnabled = r.IsEnabled,
        AutoApply = r.AutoApply,
        LastResult = r.LastResult
    };
}
