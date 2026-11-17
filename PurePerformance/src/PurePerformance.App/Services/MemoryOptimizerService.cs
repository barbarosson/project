using System.Diagnostics;
using System.Runtime.InteropServices;
using PurePerformance.Models;

namespace PurePerformance.Services;

public sealed class MemoryOptimizerService : IMemoryOptimizerService
{
    private static readonly HashSet<string> SkipNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "System", "Idle", "Registry", "smss", "csrss", "wininit", "services", "lsass",
        "winlogon", "svchost", "Memory Compression", "Secure System"
    };

    public Task<MemoryInfo> GetSnapshotAsync(CancellationToken cancellationToken = default) =>
        Task.Run(ReadMemoryInfo, cancellationToken);

    public Task<MemoryOptimizeResult> OptimizeAsync(CancellationToken cancellationToken = default) =>
        Task.Run(() => OptimizeCore(cancellationToken), cancellationToken);

    private static MemoryOptimizeResult OptimizeCore(CancellationToken ct)
    {
        var before = ReadMemoryInfo();
        int trimmed = 0;
        int skipped = 0;
        var selfId = Environment.ProcessId;

        foreach (var process in Process.GetProcesses())
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                if (process.Id == 0 || process.Id == 4 || process.Id == selfId)
                {
                    skipped++;
                    continue;
                }

                string name;
                try
                {
                    name = process.ProcessName;
                }
                catch
                {
                    skipped++;
                    continue;
                }

                if (SkipNames.Contains(name))
                {
                    skipped++;
                    continue;
                }

                try
                {
                    if (EmptyWorkingSet(process.Handle))
                    {
                        trimmed++;
                    }
                    else
                    {
                        skipped++;
                    }
                }
                catch
                {
                    skipped++;
                }
            }
            finally
            {
                process.Dispose();
            }
        }

        // Give the OS a moment to reclaim pages.
        Thread.Sleep(400);
        var after = ReadMemoryInfo();

        return new MemoryOptimizeResult
        {
            Before = before,
            After = after,
            ProcessesTrimmed = trimmed,
            ProcessesSkipped = skipped
        };
    }

    private static MemoryInfo ReadMemoryInfo()
    {
        var status = new MEMORYSTATUSEX { dwLength = (uint)Marshal.SizeOf<MEMORYSTATUSEX>() };
        if (!GlobalMemoryStatusEx(ref status))
        {
            return new MemoryInfo();
        }

        return new MemoryInfo
        {
            TotalPhysicalBytes = status.ullTotalPhys,
            AvailablePhysicalBytes = status.ullAvailPhys
        };
    }

    [DllImport("psapi.dll", SetLastError = true)]
    private static extern bool EmptyWorkingSet(IntPtr hProcess);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool GlobalMemoryStatusEx(ref MEMORYSTATUSEX lpBuffer);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    private struct MEMORYSTATUSEX
    {
        public uint dwLength;
        public uint dwMemoryLoad;
        public ulong ullTotalPhys;
        public ulong ullAvailPhys;
        public ulong ullTotalPageFile;
        public ulong ullAvailPageFile;
        public ulong ullTotalVirtual;
        public ulong ullAvailVirtual;
        public ulong ullAvailExtendedVirtual;
    }
}
