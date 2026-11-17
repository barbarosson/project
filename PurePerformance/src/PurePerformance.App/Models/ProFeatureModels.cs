namespace PurePerformance.Models;

public enum WhitelistScope
{
    Cleaner,
    Startup,
    Both
}

/// <summary>Named path or process pattern skipped by Cleaner / Startup disable suggestions.</summary>
public sealed class WhitelistRule
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string Pattern { get; set; } = string.Empty;

    public WhitelistScope Scope { get; set; } = WhitelistScope.Both;

    public string Notes { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;
}

public enum OptimizationConditionKind
{
    DiskFreeBelowPercent,
    MemoryUsedAbovePercent,
    StartupEntryCountAbove,
    CrashFindingsAbove
}

public enum OptimizationActionKind
{
    SuggestCleanerTargets,
    SuggestDisableStartup,
    SuggestMemoryOptimize,
    RunCleanerSelected
}

/// <summary>Conditional suggestion / optional auto-clean rule (Pro).</summary>
public sealed class AutoOptimizationRule
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string Name { get; set; } = string.Empty;

    public OptimizationConditionKind Condition { get; set; }

    public double Threshold { get; set; }

    public OptimizationActionKind Action { get; set; }

    public bool IsEnabled { get; set; } = true;

    public bool AutoApply { get; set; }

    public string LastResult { get; set; } = string.Empty;
}

public enum ScanCadence
{
    Daily,
    Weekly
}

public sealed class ScanScheduleSettings
{
    public bool IsEnabled { get; set; }

    public ScanCadence Cadence { get; set; } = ScanCadence.Weekly;

    /// <summary>Preferred local hour (0–23) for the next due check while the app is open.</summary>
    public int PreferredHourLocal { get; set; } = 9;

    public DateTimeOffset? LastRunUtc { get; set; }

    public DateTimeOffset? LastReportUtc { get; set; }

    public string? LastReportPath { get; set; }

    /// <summary>Email delivery is a stub — reports stay local until Partner Center / backend exists.</summary>
    public bool EmailStubEnabled { get; set; }

    public string EmailStubAddress { get; set; } = string.Empty;
}

public sealed class PcProfile
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    public string DisplayName { get; set; } = "This PC";

    public string MachineName { get; set; } =
        Environment.MachineName;

    public DateTimeOffset UpdatedUtc { get; set; } = DateTimeOffset.UtcNow;

    public bool IsLocal { get; set; } = true;
}

public sealed class AlertHistoryEntry
{
    public DateTimeOffset Timestamp { get; set; }

    public string Kind { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public double Value { get; set; }
}

public sealed class AlertSettings
{
    public bool IsEnabled { get; set; } = true;

    public double CpuSpikePercent { get; set; } = 90;

    public double DiskSpikePercent { get; set; } = 90;

    public int CooldownSeconds { get; set; } = 60;
}

public sealed class CrashTrendBucket
{
    public required string Label { get; init; }

    public required CrashCategory Category { get; init; }

    public int Count { get; init; }

    public DateTimeOffset? Latest { get; init; }
}

public sealed class CrashCorrelationGroup
{
    public required string Key { get; init; }

    public required string Title { get; init; }

    public int Count { get; init; }

    public IReadOnlyList<CrashEvent> Samples { get; init; } = Array.Empty<CrashEvent>();
}
