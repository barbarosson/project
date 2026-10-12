using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Dto;

namespace UplinkFtp.Services.Ftp;

/// <summary>
/// Remote file-management surface (FluentFTP / SSH.NET).
/// Implemented by <see cref="FtpSessionService"/>; protocol details stay in <see cref="IRemoteProtocolClient"/>.
/// </summary>
public interface IFtpFileOperations
{
    Task<IReadOnlyList<RemoteEntry>> ListDirectoryAsync(
        string remotePath,
        RemoteListOptions? options = null,
        CancellationToken cancellationToken = default);

    Task CreateDirectoryAsync(string remotePath, CancellationToken cancellationToken = default);

    /// <summary>Create an empty remote file (0 bytes). Fails if the path already exists.</summary>
    Task CreateEmptyFileAsync(string remotePath, CancellationToken cancellationToken = default);

    /// <summary>Rename or move a remote path (FTP RNFR/RNTO / SFTP rename).</summary>
    Task RenameAsync(string fromPath, string toPath, CancellationToken cancellationToken = default);

    /// <summary>Server-side move without download/upload (alias of <see cref="RenameAsync"/>).</summary>
    Task MoveAsync(string fromPath, string toPath, CancellationToken cancellationToken = default);

    Task DeleteFileAsync(string remotePath, CancellationToken cancellationToken = default);

    /// <summary>Recursively delete a remote directory tree.</summary>
    Task DeleteDirectoryAsync(string remotePath, CancellationToken cancellationToken = default);

    /// <summary>
    /// Set Unix mode bits. SFTP preferred; FTP uses SITE CHMOD when the server supports it.
    /// </summary>
    Task SetPermissionsAsync(
        string remotePath,
        UnixFilePermissions permissions,
        CancellationToken cancellationToken = default);

    Task<UnixFilePermissions?> GetPermissionsAsync(
        string remotePath,
        CancellationToken cancellationToken = default);

    Task<DirectorySizeResult> CalculateDirectorySizeAsync(
        string remotePath,
        IProgress<DirectorySizeResult>? progress = null,
        CancellationToken cancellationToken = default);
}
