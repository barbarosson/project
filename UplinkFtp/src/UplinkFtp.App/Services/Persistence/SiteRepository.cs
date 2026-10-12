using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Data;
using UplinkFtp.Models.Entities;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Security;
using Microsoft.EntityFrameworkCore;

namespace UplinkFtp.Services.Persistence;

/// <summary>EF Core site/folder repository with PasswordVault/DPAPI-backed secrets.</summary>
public sealed class SiteRepository : ISiteRepository
{
    private readonly IDbContextFactory<AppDbContext> _dbFactory;
    private readonly ICredentialStore _credentials;
    private readonly ILicenseService _license;

    public SiteRepository(
        IDbContextFactory<AppDbContext> dbFactory,
        ICredentialStore credentials,
        ILicenseService license)
    {
        _dbFactory = dbFactory;
        _credentials = credentials;
        _license = license;
    }

    public async Task<IReadOnlyList<SiteEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        return await db.Sites
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<SiteEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        return await db.Sites
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<int> CountAsync(CancellationToken cancellationToken = default)
    {
        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        return await db.Sites.CountAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<SiteEntity> AddAsync(
        SiteEntity site,
        string? password,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(site);

        var max = _license.GetMaxSavedSites();
        if (!_license.IsFeatureEnabled(LicenseFeature.UnlimitedSites))
        {
            var count = await CountAsync(cancellationToken).ConfigureAwait(false);
            if (count >= max)
            {
                throw new InvalidOperationException(
                    $"Free tier allows at most {max} saved sites. Upgrade to Pro for unlimited sites.");
            }
        }

        if (string.IsNullOrWhiteSpace(site.CredentialKey))
        {
            site.CredentialKey = Guid.NewGuid().ToString("N");
        }

        site.CreatedAtUtc = DateTime.UtcNow;
        site.UpdatedAtUtc = null;

        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        db.Sites.Add(site);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        if (!string.IsNullOrEmpty(password))
        {
            await _credentials.SaveSecretAsync(site.CredentialKey, site.Username, password, cancellationToken)
                .ConfigureAwait(false);
        }

        return site;
    }

    public async Task UpdateAsync(
        SiteEntity site,
        string? newPassword = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(site);

        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        var existing = await db.Sites.FirstOrDefaultAsync(s => s.Id == site.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new InvalidOperationException($"Site {site.Id} was not found.");

        var previousUser = existing.Username;
        var credentialKey = existing.CredentialKey;

        existing.Name = site.Name;
        existing.Host = site.Host;
        existing.Port = site.Port;
        existing.Protocol = site.Protocol;
        existing.Username = site.Username;
        existing.PrivateKeyPath = site.PrivateKeyPath;
        existing.InitialRemotePath = site.InitialRemotePath;
        existing.FolderId = site.FolderId;
        existing.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        if (newPassword is not null)
        {
            if (previousUser != existing.Username)
            {
                await _credentials.DeleteSecretAsync(credentialKey, previousUser, cancellationToken)
                    .ConfigureAwait(false);
            }

            if (newPassword.Length == 0)
            {
                await _credentials.DeleteSecretAsync(credentialKey, existing.Username, cancellationToken)
                    .ConfigureAwait(false);
            }
            else
            {
                await _credentials.SaveSecretAsync(credentialKey, existing.Username, newPassword, cancellationToken)
                    .ConfigureAwait(false);
            }
        }
        else if (previousUser != existing.Username)
        {
            // Username changed but password not rotated — move secret to new vault identity.
            var secret = await _credentials.GetSecretAsync(credentialKey, previousUser, cancellationToken)
                .ConfigureAwait(false);
            if (secret is not null)
            {
                await _credentials.DeleteSecretAsync(credentialKey, previousUser, cancellationToken)
                    .ConfigureAwait(false);
                await _credentials.SaveSecretAsync(credentialKey, existing.Username, secret, cancellationToken)
                    .ConfigureAwait(false);
            }
        }
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        var existing = await db.Sites.FirstOrDefaultAsync(s => s.Id == id, cancellationToken)
            .ConfigureAwait(false);
        if (existing is null)
        {
            return;
        }

        var key = existing.CredentialKey;
        var user = existing.Username;
        db.Sites.Remove(existing);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _credentials.DeleteSecretAsync(key, user, cancellationToken).ConfigureAwait(false);
    }

    public async Task<string?> GetPasswordAsync(int siteId, CancellationToken cancellationToken = default)
    {
        var site = await GetByIdAsync(siteId, cancellationToken).ConfigureAwait(false);
        if (site is null || string.IsNullOrWhiteSpace(site.CredentialKey))
        {
            return null;
        }

        return await _credentials.GetSecretAsync(site.CredentialKey, site.Username, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<SiteFolderEntity>> GetFoldersAsync(CancellationToken cancellationToken = default)
    {
        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        return await db.SiteFolders
            .AsNoTracking()
            .OrderBy(f => f.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<SiteFolderEntity> AddFolderAsync(
        SiteFolderEntity folder,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(folder);
        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        db.SiteFolders.Add(folder);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return folder;
    }

    public async Task DeleteFolderAsync(int folderId, CancellationToken cancellationToken = default)
    {
        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        var folder = await db.SiteFolders.FirstOrDefaultAsync(f => f.Id == folderId, cancellationToken)
            .ConfigureAwait(false);
        if (folder is null)
        {
            return;
        }

        var sites = await db.Sites.Where(s => s.FolderId == folderId).ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        foreach (var site in sites)
        {
            site.FolderId = null;
        }

        db.SiteFolders.Remove(folder);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
