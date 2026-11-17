namespace PurePerformance.Models;

public sealed class MemoryInfo
{
    public ulong TotalPhysicalBytes { get; init; }

    public ulong AvailablePhysicalBytes { get; init; }

    public ulong InUseBytes => TotalPhysicalBytes > AvailablePhysicalBytes
        ? TotalPhysicalBytes - AvailablePhysicalBytes
        : 0;

    public double InUsePercent => TotalPhysicalBytes == 0
        ? 0
        : 100.0 * InUseBytes / TotalPhysicalBytes;

    public string TotalLabel => CleanupTarget.FormatBytes((long)TotalPhysicalBytes);

    public string AvailableLabel => CleanupTarget.FormatBytes((long)AvailablePhysicalBytes);

    public string InUseLabel => CleanupTarget.FormatBytes((long)InUseBytes);
}

public sealed class MemoryOptimizeResult
{
    public required MemoryInfo Before { get; init; }

    public required MemoryInfo After { get; init; }

    public int ProcessesTrimmed { get; init; }

    public int ProcessesSkipped { get; init; }

    public string Summary =>
        $"Trimmed working sets on {ProcessesTrimmed} process(es) " +
        $"({ProcessesSkipped} skipped). Available RAM: {Before.AvailableLabel} → {After.AvailableLabel}.";
}
