using PurePerformance.Helpers;
using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Safe, named folder cleanup only (temp, prefetch, browser caches).
/// Does not touch the registry.
/// </summary>
public sealed class SystemCleanerService : ISystemCleanerService
{
    private readonly IRuleEngineService? _rules;

    public SystemCleanerService(IRuleEngineService? rules = null)
    {
        _rules = rules;
    }

    public Task<IReadOnlyList<CleanupTarget>> GetSafeCleanupTargetsAsync(
        CancellationToken cancellationToken = default) =>
        Task.Run(() => (IReadOnlyList<CleanupTarget>)BuildTargets(cancellationToken), cancellationToken);

    public Task<CleanupResult> CleanAsync(
        IEnumerable<string> actionIds,
        IProgress<string>? progress = null,
        CancellationToken cancellationToken = default) =>
        Task.Run(() => CleanCore(actionIds.ToHashSet(StringComparer.OrdinalIgnoreCase), progress, cancellationToken),
            cancellationToken);

    private static List<CleanupTarget> BuildTargets(CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var userTemp = Path.GetTempPath().TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var windowsTemp = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "Temp");
        var prefetch = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "Prefetch");

        var chromeCache = Path.Combine(local, "Google", "Chrome", "User Data", "Default", "Cache");
        var chromeCode = Path.Combine(local, "Google", "Chrome", "User Data", "Default", "Code Cache");
        var edgeCache = Path.Combine(local, "Microsoft", "Edge", "User Data", "Default", "Cache");
        var edgeCode = Path.Combine(local, "Microsoft", "Edge", "User Data", "Default", "Code Cache");
        var firefoxProfiles = Path.Combine(local, "Mozilla", "Firefox", "Profiles");

        var firefoxCachePaths = new List<string>();
        if (Directory.Exists(firefoxProfiles))
        {
            foreach (var profile in Directory.EnumerateDirectories(firefoxProfiles))
            {
                var cache2 = Path.Combine(profile, "cache2");
                if (Directory.Exists(cache2))
                {
                    firefoxCachePaths.Add(cache2);
                }
            }
        }

        var targets = new List<CleanupTarget>
        {
            Make("user-temp", "User temporary files",
                "Deletes files only under your user TEMP folder that are not locked.",
                [userTemp], requiresAdmin: false),
            Make("windows-temp", "Windows TEMP folder",
                "Deletes unlocked files under C:\\Windows\\Temp. Needs admin if access is denied.",
                [windowsTemp], requiresAdmin: true),
            Make("prefetch", "Prefetch files",
                "Removes .pf files under C:\\Windows\\Prefetch. Windows rebuilds them as apps launch. Needs admin.",
                [prefetch], requiresAdmin: true),
            Make("chrome-cache", "Google Chrome cache",
                "Clears Chrome Default Cache and Code Cache under LocalAppData. Close Chrome first for best results.",
                [chromeCache, chromeCode], requiresAdmin: false),
            Make("edge-cache", "Microsoft Edge cache",
                "Clears Edge Default Cache and Code Cache under LocalAppData. Close Edge first for best results.",
                [edgeCache, edgeCode], requiresAdmin: false),
        };

        if (firefoxCachePaths.Count > 0)
        {
            targets.Add(Make("firefox-cache", "Firefox cache",
                "Clears cache2 folders inside your Firefox profiles under LocalAppData. Close Firefox first for best results.",
                firefoxCachePaths, requiresAdmin: false));
        }

        return targets;
    }

    private static CleanupTarget Make(
        string id,
        string name,
        string what,
        IReadOnlyList<string> paths,
        bool requiresAdmin)
    {
        long bytes = 0;
        foreach (var path in paths)
        {
            bytes += MeasurePath(path);
        }

        return new CleanupTarget
        {
            Id = id,
            DisplayName = name,
            WhatItCleans = what,
            Paths = paths,
            RequiresAdmin = requiresAdmin,
            EstimatedBytes = bytes,
            IsSelected = true
        };
    }

    private CleanupResult CleanCore(
        HashSet<string> ids,
        IProgress<string>? progress,
        CancellationToken ct)
    {
        var targets = BuildTargets(ct).Where(t => ids.Contains(t.Id)).ToList();
        long removedBytes = 0;
        int removedFiles = 0;
        int skipped = 0;
        var notes = new List<string>();

        foreach (var target in targets)
        {
            ct.ThrowIfCancellationRequested();

            if (target.RequiresAdmin && !ElevationHelper.IsRunningElevated())
            {
                // Try anyway; if access denied we note it. Prefer not blocking the whole run.
                notes.Add($"{target.DisplayName}: may need admin — attempting without elevation.");
            }

            progress?.Report($"Cleaning {target.DisplayName}…");

            foreach (var path in target.Paths)
            {
                if (_rules?.IsCleanerPathWhitelisted(path) == true)
                {
                    notes.Add($"{target.DisplayName}: skipped by Pro whitelist rule ({path}).");
                    skipped++;
                    continue;
                }

                if (!Directory.Exists(path) && !File.Exists(path))
                {
                    notes.Add($"{target.DisplayName}: path not found ({path}) — skipped.");
                    continue;
                }

                try
                {
                    var (b, f, s) = DeleteContents(path, ct, _rules);
                    removedBytes += b;
                    removedFiles += f;
                    skipped += s;
                }
                catch (UnauthorizedAccessException ex)
                {
                    notes.Add($"{target.DisplayName}: access denied ({path}). {ex.Message}");
                    if (target.RequiresAdmin && !ElevationHelper.IsRunningElevated())
                    {
                        notes.Add("Relaunch Pure Performance as admin to clean this location.");
                    }
                }
                catch (Exception ex)
                {
                    notes.Add($"{target.DisplayName}: {ex.Message}");
                }
            }
        }

        notes.Insert(0,
            "Registry was not modified. Only the selected named folders/files above were targeted.");

        return new CleanupResult
        {
            BytesRemoved = removedBytes,
            FilesRemoved = removedFiles,
            FilesSkipped = skipped,
            Notes = notes
        };
    }

    private static (long bytes, int files, int skipped) DeleteContents(
        string path,
        CancellationToken ct,
        IRuleEngineService? rules)
    {
        long bytes = 0;
        int files = 0;
        int skipped = 0;

        if (File.Exists(path))
        {
            if (rules?.IsCleanerPathWhitelisted(path) == true)
            {
                return (0, 0, 1);
            }

            try
            {
                var info = new FileInfo(path);
                var size = info.Length;
                info.Delete();
                return (size, 1, 0);
            }
            catch
            {
                return (0, 0, 1);
            }
        }

        if (!Directory.Exists(path))
        {
            return (0, 0, 0);
        }

        foreach (var file in Directory.EnumerateFiles(path, "*", SearchOption.AllDirectories))
        {
            ct.ThrowIfCancellationRequested();
            if (rules?.IsCleanerPathWhitelisted(file) == true)
            {
                skipped++;
                continue;
            }

            try
            {
                var info = new FileInfo(file);
                var size = info.Length;
                info.IsReadOnly = false;
                info.Delete();
                bytes += size;
                files++;
            }
            catch
            {
                skipped++;
            }
        }

        // Remove empty subdirectories (best effort); keep the root folder itself.
        foreach (var dir in Directory.EnumerateDirectories(path, "*", SearchOption.AllDirectories)
                     .OrderByDescending(d => d.Length))
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                if (!Directory.EnumerateFileSystemEntries(dir).Any())
                {
                    Directory.Delete(dir, recursive: false);
                }
            }
            catch
            {
                // ignore
            }
        }

        return (bytes, files, skipped);
    }

    private static long MeasurePath(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                return new FileInfo(path).Length;
            }

            if (!Directory.Exists(path))
            {
                return 0;
            }

            long total = 0;
            foreach (var file in Directory.EnumerateFiles(path, "*", SearchOption.AllDirectories))
            {
                try
                {
                    total += new FileInfo(file).Length;
                }
                catch
                {
                    // skip locked/unreadable
                }
            }

            return total;
        }
        catch
        {
            return 0;
        }
    }
}
