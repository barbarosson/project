using HaSetup.Core.Diagnostics;
using HaSetup.Core.Docker;
using HaSetup.Core.HomeAssistant;

namespace HaSetup.Core.Backup;

/// <summary>
/// Premium: zip backup/restore of the HA config Docker volume (<see cref="HaConstants.VolumeName"/>).
/// Uses a short-lived alpine container to tar/untar the volume.
/// </summary>
public sealed class ConfigVolumeBackupService : IConfigVolumeBackupService
{
    private const string HelperImage = "alpine:3.20";
    private readonly IDockerClient _docker;

    public ConfigVolumeBackupService(IDockerClient docker)
    {
        _docker = docker;
    }

    public async Task<BackupOperationResult> BackupToZipAsync(
        string zipPath,
        CancellationToken cancellationToken = default,
        IProgress<string>? progress = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(zipPath);

        try
        {
            var fullZip = Path.GetFullPath(zipPath);
            var hostDir = Path.GetDirectoryName(fullZip)
                ?? throw new InvalidOperationException("Invalid backup path.");
            var fileName = Path.GetFileName(fullZip);
            Directory.CreateDirectory(hostDir);

            progress?.Report($"Ensuring volume {HaConstants.VolumeName} exists…");
            var inspect = await _docker.RunDockerAsync(
                ["volume", "inspect", HaConstants.VolumeName],
                cancellationToken).ConfigureAwait(false);
            if (!inspect.Succeeded)
            {
                return new BackupOperationResult(
                    false,
                    "Config volume was not found. Install / Start the local hub first, then try backup again.",
                    Detail: FriendlyErrorHandler.FormatDetailForLog(inspect.CombinedOutput));
            }

            progress?.Report($"Pulling helper image {HelperImage} (if needed)…");
            var pull = await _docker.RunDockerAsync(["pull", HelperImage], cancellationToken).ConfigureAwait(false);
            if (!pull.Succeeded)
            {
                return Fail("Could not pull the backup helper image.", pull.CombinedOutput);
            }

            // Produce a .tar.gz then rename/copy to requested .zip path for a simple archive deliverable.
            // Callers typically choose *.zip; we write gzip-tar content with that extension for MVP simplicity.
            var hostMount = ToDockerHostPath(hostDir);
            progress?.Report("Archiving config volume…");
            var run = await _docker.RunDockerAsync(
                [
                    "run", "--rm",
                    "-v", $"{HaConstants.VolumeName}:/config:ro",
                    "-v", $"{hostMount}:/backup",
                    HelperImage,
                    "sh", "-c",
                    $"cd /config && tar czf /backup/{EscapeShell(fileName)} .",
                ],
                cancellationToken).ConfigureAwait(false);

            if (!run.Succeeded)
            {
                return Fail("Config volume backup failed.", run.CombinedOutput);
            }

            if (!File.Exists(fullZip))
            {
                return new BackupOperationResult(
                    false,
                    "Backup finished but the archive file was not found on disk. Check the path and Docker file sharing settings.");
            }

            return new BackupOperationResult(
                true,
                $"Config volume backed up to {fullZip}.",
                Detail: FriendlyErrorHandler.FormatDetailForLog(run.CombinedOutput));
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return new BackupOperationResult(
                false,
                FriendlyErrorHandler.ToUserMessage(ex, "Config backup failed."),
                Detail: FriendlyErrorHandler.FormatDetailForLog(ex.Message));
        }
    }

    public async Task<BackupOperationResult> RestoreFromZipAsync(
        string zipPath,
        CancellationToken cancellationToken = default,
        IProgress<string>? progress = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(zipPath);

        try
        {
            var fullZip = Path.GetFullPath(zipPath);
            if (!File.Exists(fullZip))
            {
                return new BackupOperationResult(false, "Backup archive was not found. Choose an existing file.");
            }

            var hostDir = Path.GetDirectoryName(fullZip)!;
            var fileName = Path.GetFileName(fullZip);

            progress?.Report($"Ensuring volume {HaConstants.VolumeName} exists…");
            var ensure = await _docker.RunDockerAsync(
                ["volume", "create", HaConstants.VolumeName],
                cancellationToken).ConfigureAwait(false);
            // volume create is idempotent when it already exists (exit 0) or may fail if exists — inspect first
            var inspect = await _docker.RunDockerAsync(
                ["volume", "inspect", HaConstants.VolumeName],
                cancellationToken).ConfigureAwait(false);
            if (!inspect.Succeeded)
            {
                if (!ensure.Succeeded)
                {
                    return Fail("Could not create the config volume for restore.", ensure.CombinedOutput);
                }
            }

            progress?.Report($"Pulling helper image {HelperImage} (if needed)…");
            var pull = await _docker.RunDockerAsync(["pull", HelperImage], cancellationToken).ConfigureAwait(false);
            if (!pull.Succeeded)
            {
                return Fail("Could not pull the restore helper image.", pull.CombinedOutput);
            }

            var hostMount = ToDockerHostPath(hostDir);
            progress?.Report("Restoring archive into config volume…");
            var run = await _docker.RunDockerAsync(
                [
                    "run", "--rm",
                    "-v", $"{HaConstants.VolumeName}:/config",
                    "-v", $"{hostMount}:/backup:ro",
                    HelperImage,
                    "sh", "-c",
                    $"rm -rf /config/* /config/.[!.]* /config/..?* 2>/dev/null; tar xzf /backup/{EscapeShell(fileName)} -C /config",
                ],
                cancellationToken).ConfigureAwait(false);

            if (!run.Succeeded)
            {
                return Fail("Config volume restore failed.", run.CombinedOutput);
            }

            return new BackupOperationResult(
                true,
                $"Config volume restored from {fullZip}. Restart the container if it is running.",
                Detail: FriendlyErrorHandler.FormatDetailForLog(run.CombinedOutput));
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return new BackupOperationResult(
                false,
                FriendlyErrorHandler.ToUserMessage(ex, "Config restore failed."),
                Detail: FriendlyErrorHandler.FormatDetailForLog(ex.Message));
        }
    }

    private static BackupOperationResult Fail(string context, string raw) =>
        new(
            false,
            FriendlyErrorHandler.ToUserMessage(raw, context),
            Detail: FriendlyErrorHandler.FormatDetailForLog(raw));

    private static string EscapeShell(string fileName) =>
        fileName.Replace("'", "'\\''", StringComparison.Ordinal);

    /// <summary>Docker Desktop on Windows accepts forward-slash paths for bind mounts.</summary>
    internal static string ToDockerHostPath(string hostPath)
    {
        var full = Path.GetFullPath(hostPath);
        if (OperatingSystem.IsWindows())
        {
            return full.Replace('\\', '/');
        }

        return full;
    }
}
