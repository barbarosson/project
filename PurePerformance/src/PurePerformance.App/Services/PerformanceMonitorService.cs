using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Background CPU / RAM / Disk / GPU (best-effort) sampling plus top processes.
/// All counter work runs off the UI thread.
/// </summary>
public sealed class PerformanceMonitorService : IPerformanceMonitorService
{
    public async IAsyncEnumerable<PerformanceSample> StreamSamplesAsync(
        TimeSpan interval,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        // Warm up process CPU times on a worker, then stream samples.
        var state = await Task.Run(SamplerState.Create, cancellationToken).ConfigureAwait(false);

        while (!cancellationToken.IsCancellationRequested)
        {
            PerformanceSample sample;
            var cancelled = false;

            try
            {
                sample = await Task.Run(() => state.TakeSample(), cancellationToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                cancelled = true;
                sample = null!;
            }
            catch
            {
                sample = new PerformanceSample
                {
                    Timestamp = DateTimeOffset.Now,
                    CpuPercent = 0,
                    MemoryPercent = 0,
                    DiskPercent = 0,
                    GpuPercent = null
                };
            }

            // yield must stay outside try/catch (CS1626 / CS1631).
            if (cancelled)
            {
                yield break;
            }

            yield return sample;

            try
            {
                await Task.Delay(interval, cancellationToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                cancelled = true;
            }

            if (cancelled)
            {
                yield break;
            }
        }
    }

    private sealed class SamplerState
    {
        private PerformanceCounter? _cpu;
        private PerformanceCounter? _disk;
        private readonly List<PerformanceCounter> _gpuCounters = [];
        private readonly Dictionary<int, (TimeSpan Total, DateTime Stamp)> _procCpu = new();

        public static SamplerState Create()
        {
            var s = new SamplerState();
            s.TryInitCounters();
            // Prime counters (first NextValue is often 0).
            _ = s._cpu?.NextValue();
            _ = s._disk?.NextValue();
            foreach (var g in s._gpuCounters)
            {
                _ = g.NextValue();
            }

            Thread.Sleep(200);
            return s;
        }

        private void TryInitCounters()
        {
            try
            {
                _cpu = new PerformanceCounter("Processor", "% Processor Time", "_Total");
            }
            catch
            {
                try
                {
                    _cpu = new PerformanceCounter("Processor Information", "% Processor Utility", "_Total");
                }
                catch
                {
                    _cpu = null;
                }
            }

            try
            {
                _disk = new PerformanceCounter("PhysicalDisk", "% Disk Time", "_Total");
            }
            catch
            {
                _disk = null;
            }

            try
            {
                var category = new PerformanceCounterCategory("GPU Engine");
                foreach (var instance in category.GetInstanceNames())
                {
                    if (!instance.Contains("engtype_3D", StringComparison.OrdinalIgnoreCase)
                        && !instance.Contains("engtype_Graphics", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    try
                    {
                        _gpuCounters.Add(new PerformanceCounter("GPU Engine", "Utilization Percentage", instance));
                    }
                    catch
                    {
                        // ignore individual engine
                    }
                }
            }
            catch
            {
                // GPU counters unavailable on some systems — leave null percent.
            }
        }

        public PerformanceSample TakeSample()
        {
            double cpu = 0;
            if (_cpu is not null)
            {
                try
                {
                    cpu = Math.Clamp(_cpu.NextValue(), 0, 100);
                }
                catch
                {
                    cpu = 0;
                }
            }

            double disk = 0;
            if (_disk is not null)
            {
                try
                {
                    disk = Math.Clamp(_disk.NextValue(), 0, 100);
                }
                catch
                {
                    disk = 0;
                }
            }

            double? gpu = null;
            if (_gpuCounters.Count > 0)
            {
                double sum = 0;
                var any = false;
                foreach (var g in _gpuCounters)
                {
                    try
                    {
                        sum += g.NextValue();
                        any = true;
                    }
                    catch
                    {
                        // ignore
                    }
                }

                if (any)
                {
                    gpu = Math.Clamp(sum, 0, 100);
                }
            }

            var mem = ReadMemory();
            var memPercent = mem.Total == 0 ? 0 : 100.0 * (mem.Total - mem.Avail) / mem.Total;
            var top = GetTopProcesses(8);

            return new PerformanceSample
            {
                Timestamp = DateTimeOffset.Now,
                CpuPercent = cpu,
                MemoryPercent = memPercent,
                DiskPercent = disk,
                GpuPercent = gpu,
                MemoryAvailableBytes = mem.Avail,
                MemoryTotalBytes = mem.Total,
                TopProcesses = top
            };
        }

        private List<ProcessUsage> GetTopProcesses(int count)
        {
            var now = DateTime.UtcNow;
            var list = new List<ProcessUsage>();
            var processorCount = Environment.ProcessorCount;

            foreach (var process in Process.GetProcesses())
            {
                try
                {
                    if (process.Id is 0 or 4)
                    {
                        continue;
                    }

                    TimeSpan total;
                    long ws;
                    string name;
                    try
                    {
                        total = process.TotalProcessorTime;
                        ws = process.WorkingSet64;
                        name = process.ProcessName;
                    }
                    catch
                    {
                        continue;
                    }

                    double cpuPct = 0;
                    if (_procCpu.TryGetValue(process.Id, out var prev))
                    {
                        var cpuDelta = (total - prev.Total).TotalMilliseconds;
                        var wallDelta = (now - prev.Stamp).TotalMilliseconds;
                        if (wallDelta > 0)
                        {
                            cpuPct = Math.Clamp(cpuDelta / (wallDelta * processorCount) * 100.0, 0, 100);
                        }
                    }

                    _procCpu[process.Id] = (total, now);

                    list.Add(new ProcessUsage
                    {
                        ProcessId = process.Id,
                        Name = name,
                        CpuPercent = cpuPct,
                        WorkingSetBytes = ws
                    });
                }
                finally
                {
                    process.Dispose();
                }
            }

            // Drop stale PID tracking
            var live = list.Select(p => p.ProcessId).ToHashSet();
            foreach (var id in _procCpu.Keys.Where(id => !live.Contains(id)).ToList())
            {
                _procCpu.Remove(id);
            }

            return list
                .OrderByDescending(p => p.CpuPercent)
                .ThenByDescending(p => p.WorkingSetBytes)
                .Take(count)
                .ToList();
        }

        private static (ulong Total, ulong Avail) ReadMemory()
        {
            var status = new MEMORYSTATUSEX { dwLength = (uint)Marshal.SizeOf<MEMORYSTATUSEX>() };
            if (!GlobalMemoryStatusEx(ref status))
            {
                return (0, 0);
            }

            return (status.ullTotalPhys, status.ullAvailPhys);
        }

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
}
