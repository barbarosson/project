using System;

namespace UplinkFtp.Models.Entities;

/// <summary>
/// Saved FTP/SFTP site metadata in SQLite.
/// Secrets live in the credential store (PasswordVault / DPAPI) — never in this table.
/// </summary>
public class SiteEntity
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 21;

    /// <summary>ftp | ftps | sftp</summary>
    public string Protocol { get; set; } = "ftp";

    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Stable key for PasswordVault / DPAPI lookup (GUID string).
    /// Not a password and not reversible to a secret by itself.
    /// </summary>
    public string CredentialKey { get; set; } = string.Empty;

    /// <summary>Optional path to an OpenSSH private key file (path only; passphrase via credential store).</summary>
    public string? PrivateKeyPath { get; set; }

    public string? InitialRemotePath { get; set; }

    public int? FolderId { get; set; }

    public SiteFolderEntity? Folder { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }
}
