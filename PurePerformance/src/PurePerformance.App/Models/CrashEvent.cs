namespace PurePerformance.Models;

/// <summary>
/// A normalized crash / warning finding from Windows Event Viewer logs.
/// </summary>
public sealed class CrashEvent
{
    public required DateTimeOffset Timestamp { get; init; }

    public required string LogName { get; init; }

    public required string ProviderName { get; init; }

    public required int EventId { get; init; }

    public required CrashSeverity Severity { get; init; }

    public required CrashCategory Category { get; init; }

    public required string Title { get; init; }

    /// <summary>Plain-English explanation of what happened.</summary>
    public required string Explanation { get; init; }

    /// <summary>Actionable steps the user can take.</summary>
    public required string RecommendedFix { get; init; }

    /// <summary>Raw message excerpt for power users (truncated).</summary>
    public string? RawMessage { get; init; }

    public string SummaryLine =>
        $"{Timestamp:g} · {CategoryLabel} · {Title}";

    public string CategoryLabel => Category switch
    {
        CrashCategory.UnexpectedShutdown => "Unexpected shutdown",
        CrashCategory.BlueScreen => "Blue screen (BSOD)",
        CrashCategory.ApplicationHang => "App hang",
        CrashCategory.DiskError => "Disk / storage",
        CrashCategory.KernelPower => "Power / sleep",
        CrashCategory.Other => "Other",
        _ => "Other"
    };
}

public enum CrashSeverity
{
    Warning,
    Error,
    Critical
}

public enum CrashCategory
{
    UnexpectedShutdown,
    BlueScreen,
    ApplicationHang,
    DiskError,
    KernelPower,
    Other
}

public enum CrashLookback
{
    Hours24 = 24,
    Hours72 = 72
}
