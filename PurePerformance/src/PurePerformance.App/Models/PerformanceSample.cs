namespace PurePerformance.Models;

public sealed class PerformanceSample
{
    public required DateTimeOffset Timestamp { get; init; }

    public double CpuPercent { get; init; }

    public double MemoryPercent { get; init; }

    public double DiskPercent { get; init; }

    public double? GpuPercent { get; init; }

    public ulong MemoryAvailableBytes { get; init; }

    public ulong MemoryTotalBytes { get; init; }

    public IReadOnlyList<ProcessUsage> TopProcesses { get; init; } = Array.Empty<ProcessUsage>();
}

public sealed class ProcessUsage
{
    public required int ProcessId { get; init; }

    public required string Name { get; init; }

    public double CpuPercent { get; init; }

    public long WorkingSetBytes { get; init; }

    public string MemoryLabel => CleanupTarget.FormatBytes(WorkingSetBytes);

    public string CpuLabel => $"{CpuPercent:0.0}%";
}
