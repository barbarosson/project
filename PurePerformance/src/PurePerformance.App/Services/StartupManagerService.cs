using System.Collections.Concurrent;
using Microsoft.Win32;
using PurePerformance.Helpers;
using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Lists and toggles startup entries from Registry Run keys and Startup folders.
/// Disable = move to a Pure Performance backup key/folder (reversible). Never blind deletion.
/// </summary>
public sealed class StartupManagerService : IStartupManagerService
{
    private const string DisabledRoot = @"Software\PurePerformance\DisabledStartup";
    private static readonly ConcurrentDictionary<string, StartupEntryMeta> Meta = new();

    private sealed record StartupEntryMeta(
        StartupLocation Location,
        string Name,
        string? OriginalPath);

    public Task<IReadOnlyList<StartupEntry>> GetStartupEntriesAsync(
        CancellationToken cancellationToken = default) =>
        Task.Run(() => (IReadOnlyList<StartupEntry>)EnumerateAll(cancellationToken).ToList(), cancellationToken);

    public Task<StartupChangeResult> SetEnabledAsync(
        string entryId,
        bool enabled,
        CancellationToken cancellationToken = default) =>
        Task.Run(() => SetEnabledCore(entryId, enabled), cancellationToken);

    private static IEnumerable<StartupEntry> EnumerateAll(CancellationToken ct)
    {
        Meta.Clear();
        foreach (var e in ReadRunKey(RegistryHive.CurrentUser, StartupLocation.CurrentUserRun, requiresAdmin: false, ct))
            yield return e;
        foreach (var e in ReadRunKey(RegistryHive.LocalMachine, StartupLocation.LocalMachineRun, requiresAdmin: true, ct))
            yield return e;
        foreach (var e in ReadStartupFolder(
                     Environment.GetFolderPath(Environment.SpecialFolder.Startup),
                     StartupLocation.StartupFolderUser,
                     requiresAdmin: false,
                     ct))
            yield return e;
        foreach (var e in ReadStartupFolder(
                     Environment.GetFolderPath(Environment.SpecialFolder.CommonStartup),
                     StartupLocation.StartupFolderCommon,
                     requiresAdmin: true,
                     ct))
            yield return e;
    }

    private static IEnumerable<StartupEntry> ReadRunKey(
        RegistryHive hive,
        StartupLocation location,
        bool requiresAdmin,
        CancellationToken ct)
    {
        const string runPath = @"Software\Microsoft\Windows\CurrentVersion\Run";

        // Active entries
        using (var baseKey = RegistryKey.OpenBaseKey(hive, RegistryView.Registry64))
        using (var key = baseKey.OpenSubKey(runPath, writable: false))
        {
            if (key is not null)
            {
                foreach (var name in key.GetValueNames())
                {
                    ct.ThrowIfCancellationRequested();
                    var command = key.GetValue(name)?.ToString() ?? string.Empty;
                    var id = MakeId(location, name, enabled: true);
                    Meta[id] = new StartupEntryMeta(location, name, null);
                    yield return new StartupEntry
                    {
                        Id = id,
                        Name = name,
                        Command = command,
                        Location = location,
                        IsEnabled = true,
                        RequiresAdmin = requiresAdmin
                    };
                }
            }
        }

        // Disabled backups under HKCU (we always store backups in HKCU for Store-safe writes).
        // Collect first — C# forbids yield inside try/catch (CS1626 / CS1631).
        var backupPath = $@"{DisabledRoot}\{location}";
        List<StartupEntry>? disabledEntries = null;
        try
        {
            using var cu = RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64);
            using var disabled = cu.OpenSubKey(backupPath, writable: false);
            if (disabled is not null)
            {
                disabledEntries = [];
                foreach (var name in disabled.GetValueNames())
                {
                    ct.ThrowIfCancellationRequested();
                    var command = disabled.GetValue(name)?.ToString() ?? string.Empty;
                    var id = MakeId(location, name, enabled: false);
                    Meta[id] = new StartupEntryMeta(location, name, null);
                    disabledEntries.Add(new StartupEntry
                    {
                        Id = id,
                        Name = name,
                        Command = command,
                        Location = location,
                        IsEnabled = false,
                        RequiresAdmin = requiresAdmin
                    });
                }
            }
        }
        catch (UnauthorizedAccessException)
        {
            // Ignore backup enumeration failures.
        }

        if (disabledEntries is null)
        {
            yield break;
        }

        foreach (var entry in disabledEntries)
        {
            yield return entry;
        }
    }

    private static IEnumerable<StartupEntry> ReadStartupFolder(
        string folder,
        StartupLocation location,
        bool requiresAdmin,
        CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(folder) && Directory.Exists(folder))
        {
            foreach (var file in Directory.EnumerateFiles(folder))
            {
                ct.ThrowIfCancellationRequested();
                var name = Path.GetFileName(file);
                var id = MakeId(location, name, enabled: true);
                Meta[id] = new StartupEntryMeta(location, name, file);
                yield return new StartupEntry
                {
                    Id = id,
                    Name = name,
                    Command = file,
                    Location = location,
                    IsEnabled = true,
                    RequiresAdmin = requiresAdmin
                };
            }
        }

        var disabledDir = GetDisabledFolder(location);
        if (!Directory.Exists(disabledDir))
        {
            yield break;
        }

        foreach (var file in Directory.EnumerateFiles(disabledDir))
        {
            ct.ThrowIfCancellationRequested();
            var name = Path.GetFileName(file);
            var id = MakeId(location, name, enabled: false);
            Meta[id] = new StartupEntryMeta(location, name, file);
            yield return new StartupEntry
            {
                Id = id,
                Name = name,
                Command = file,
                Location = location,
                IsEnabled = false,
                RequiresAdmin = requiresAdmin
            };
        }
    }

    private static StartupChangeResult SetEnabledCore(string entryId, bool enabled)
    {
        if (!Meta.TryGetValue(entryId, out var meta))
        {
            // Refresh once in case UI is stale.
            _ = EnumerateAll(CancellationToken.None).ToList();
            if (!Meta.TryGetValue(entryId, out meta))
            {
                return new StartupChangeResult
                {
                    Success = false,
                    Message = "Entry not found. Refresh the list and try again."
                };
            }
        }

        var needsAdmin = meta.Location is StartupLocation.LocalMachineRun or StartupLocation.StartupFolderCommon;
        if (needsAdmin && !ElevationHelper.IsRunningElevated())
        {
            return new StartupChangeResult
            {
                Success = false,
                NeedsElevation = true,
                Message =
                    "This all-users startup item needs administrator permission. " +
                    "Use “Relaunch as admin” then try again. Pure Performance will not change it without your UAC approval."
            };
        }

        try
        {
            if (meta.Location is StartupLocation.CurrentUserRun or StartupLocation.LocalMachineRun)
            {
                return enabled ? EnableRun(meta) : DisableRun(meta);
            }

            return enabled ? EnableFolderItem(meta) : DisableFolderItem(meta);
        }
        catch (UnauthorizedAccessException ex)
        {
            return new StartupChangeResult
            {
                Success = false,
                NeedsElevation = needsAdmin,
                Message = $"Access denied: {ex.Message}"
            };
        }
        catch (Exception ex)
        {
            return new StartupChangeResult
            {
                Success = false,
                Message = $"Could not update startup entry: {ex.Message}"
            };
        }
    }

    private static StartupChangeResult DisableRun(StartupEntryMeta meta)
    {
        var hive = meta.Location == StartupLocation.LocalMachineRun
            ? RegistryHive.LocalMachine
            : RegistryHive.CurrentUser;
        const string runPath = @"Software\Microsoft\Windows\CurrentVersion\Run";

        using var baseKey = RegistryKey.OpenBaseKey(hive, RegistryView.Registry64);
        using var run = baseKey.OpenSubKey(runPath, writable: true)
                        ?? throw new InvalidOperationException("Could not open the Run key for writing.");

        var value = run.GetValue(meta.Name);
        if (value is null)
        {
            return new StartupChangeResult { Success = false, Message = "Value already removed from Run." };
        }

        using var cu = RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64);
        using var disabled = cu.CreateSubKey($@"{DisabledRoot}\{meta.Location}", writable: true)
                             ?? throw new InvalidOperationException("Could not create the disabled-startup backup key.");

        disabled.SetValue(meta.Name, value, run.GetValueKind(meta.Name));
        run.DeleteValue(meta.Name, throwOnMissingValue: false);

        return new StartupChangeResult
        {
            Success = true,
            Message =
                $"Disabled “{meta.Name}”. The command was moved to a Pure Performance backup key " +
                $"(HKCU\\{DisabledRoot}\\{meta.Location}) so you can re-enable it later. Nothing was permanently deleted."
        };
    }

    private static StartupChangeResult EnableRun(StartupEntryMeta meta)
    {
        var hive = meta.Location == StartupLocation.LocalMachineRun
            ? RegistryHive.LocalMachine
            : RegistryHive.CurrentUser;
        const string runPath = @"Software\Microsoft\Windows\CurrentVersion\Run";

        using var cu = RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64);
        using var disabled = cu.OpenSubKey($@"{DisabledRoot}\{meta.Location}", writable: true);
        if (disabled is null)
        {
            return new StartupChangeResult { Success = false, Message = "No backup found for this entry." };
        }

        var value = disabled.GetValue(meta.Name);
        if (value is null)
        {
            return new StartupChangeResult { Success = false, Message = "Backup value missing." };
        }

        var kind = disabled.GetValueKind(meta.Name);
        using var baseKey = RegistryKey.OpenBaseKey(hive, RegistryView.Registry64);
        using var run = baseKey.OpenSubKey(runPath, writable: true)
                        ?? baseKey.CreateSubKey(runPath, writable: true)
                        ?? throw new InvalidOperationException("Could not open Run key.");

        run.SetValue(meta.Name, value, kind);
        disabled.DeleteValue(meta.Name, throwOnMissingValue: false);

        return new StartupChangeResult
        {
            Success = true,
            Message = $"Re-enabled “{meta.Name}” in the Windows Run key from the Pure Performance backup."
        };
    }

    private static StartupChangeResult DisableFolderItem(StartupEntryMeta meta)
    {
        var source = meta.OriginalPath;
        if (string.IsNullOrWhiteSpace(source) || !File.Exists(source))
        {
            return new StartupChangeResult { Success = false, Message = "Startup shortcut not found." };
        }

        var destDir = GetDisabledFolder(meta.Location);
        Directory.CreateDirectory(destDir);
        var dest = Path.Combine(destDir, Path.GetFileName(source));
        if (File.Exists(dest))
        {
            File.Delete(dest);
        }

        File.Move(source, dest);

        return new StartupChangeResult
        {
            Success = true,
            Message =
                $"Disabled “{meta.Name}” by moving the shortcut to:\n{destDir}\n" +
                "You can re-enable it anytime. The file was not deleted."
        };
    }

    private static StartupChangeResult EnableFolderItem(StartupEntryMeta meta)
    {
        var source = meta.OriginalPath;
        if (string.IsNullOrWhiteSpace(source) || !File.Exists(source))
        {
            source = Path.Combine(GetDisabledFolder(meta.Location), meta.Name);
        }

        if (!File.Exists(source))
        {
            return new StartupChangeResult { Success = false, Message = "Disabled shortcut not found." };
        }

        var destDir = meta.Location == StartupLocation.StartupFolderCommon
            ? Environment.GetFolderPath(Environment.SpecialFolder.CommonStartup)
            : Environment.GetFolderPath(Environment.SpecialFolder.Startup);

        Directory.CreateDirectory(destDir);
        var dest = Path.Combine(destDir, Path.GetFileName(source));
        if (File.Exists(dest))
        {
            File.Delete(dest);
        }

        File.Move(source, dest);

        return new StartupChangeResult
        {
            Success = true,
            Message = $"Re-enabled “{meta.Name}” in the Startup folder."
        };
    }

    private static string GetDisabledFolder(StartupLocation location) =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PurePerformance",
            "DisabledStartup",
            location.ToString());

    private static string MakeId(StartupLocation location, string name, bool enabled) =>
        $"{location}|{(enabled ? "on" : "off")}|{name}";
}
