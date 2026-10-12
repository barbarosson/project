using System;

namespace FtpAi.Models.Entities;

/// <summary>Saved FTP/SFTP site. Mapped to SQLite in ADIM 2+.</summary>
public class SiteEntity
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 21;

    /// <summary>ftp | ftps | sftp</summary>
    public string Protocol { get; set; } = "ftp";

    public string Username { get; set; } = string.Empty;

    /// <summary>Encrypted at rest in later ADIMs; plain stub field for now.</summary>
    public string? PasswordEncrypted { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
