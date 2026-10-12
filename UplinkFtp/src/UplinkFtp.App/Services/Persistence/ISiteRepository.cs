using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Entities;

namespace UplinkFtp.Services.Persistence;

/// <summary>CRUD for saved connection sites and folders (SQLite + secure credentials).</summary>
public interface ISiteRepository
{
    Task<IReadOnlyList<SiteEntity>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<SiteEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<int> CountAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Inserts site metadata and stores <paramref name="password"/> in the credential store.
    /// Enforces Free-tier site limit via <see cref="Licensing.ILicenseService"/>.
    /// </summary>
    Task<SiteEntity> AddAsync(
        SiteEntity site,
        string? password,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates metadata. Pass <paramref name="newPassword"/> to rotate the secret;
    /// null keeps the existing credential.
    /// </summary>
    Task UpdateAsync(
        SiteEntity site,
        string? newPassword = null,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Loads the FTP/SFTP password (or key passphrase) from the credential store.</summary>
    Task<string?> GetPasswordAsync(int siteId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SiteFolderEntity>> GetFoldersAsync(CancellationToken cancellationToken = default);

    Task<SiteFolderEntity> AddFolderAsync(
        SiteFolderEntity folder,
        CancellationToken cancellationToken = default);

    Task DeleteFolderAsync(int folderId, CancellationToken cancellationToken = default);
}
