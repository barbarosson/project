namespace HaSetup.Core.Backup;

public interface IConfigVolumeBackupService
{
    Task<BackupOperationResult> BackupToZipAsync(
        string zipPath,
        CancellationToken cancellationToken = default,
        IProgress<string>? progress = null);

    Task<BackupOperationResult> RestoreFromZipAsync(
        string zipPath,
        CancellationToken cancellationToken = default,
        IProgress<string>? progress = null);
}

public sealed record BackupOperationResult(bool Succeeded, string Message, string? Detail = null);
