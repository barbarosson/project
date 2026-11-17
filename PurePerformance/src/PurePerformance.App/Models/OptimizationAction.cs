namespace PurePerformance.Models;

/// <summary>
/// Describes a safe, user-visible optimization action for future modules
/// (Startup Manager, System Cleaner, Memory Optimizer). Never implies blind registry deletion.
/// </summary>
public sealed class OptimizationAction
{
    public required string Id { get; init; }

    public required string DisplayName { get; init; }

    /// <summary>Clear copy of what will be changed or removed.</summary>
    public required string WhatItDoes { get; init; }

    /// <summary>True when the operation needs elevation (UAC) under runFullTrust.</summary>
    public bool RequiresAdmin { get; init; }

    public OptimizationRisk Risk { get; init; } = OptimizationRisk.Safe;
}

public enum OptimizationRisk
{
    /// <summary>Reversible or low-impact (e.g. user-temp files, optional startup disable).</summary>
    Safe,

    /// <summary>Needs explicit confirmation (e.g. disable a startup entry).</summary>
    ReviewRequired
}
