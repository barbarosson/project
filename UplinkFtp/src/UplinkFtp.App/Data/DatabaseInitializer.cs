using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace UplinkFtp.Data;

public interface IDatabaseInitializer
{
    /// <summary>
    /// Ensures the local SQLite schema exists.
    /// ADIM 3: <c>EnsureCreatedAsync</c> for zero-friction local dev.
    /// Later: replace with <c>MigrateAsync</c> once EF migrations are added.
    /// </summary>
    Task InitializeAsync(CancellationToken cancellationToken = default);
}

public sealed class DatabaseInitializer : IDatabaseInitializer
{
    private readonly IDbContextFactory<AppDbContext> _dbFactory;

    public DatabaseInitializer(IDbContextFactory<AppDbContext> dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        AppDatabasePaths.TryMigrateLegacyDatabase();
        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        // EnsureCreated: creates schema if missing; does not apply incremental migrations.
        await db.Database.EnsureCreatedAsync(cancellationToken).ConfigureAwait(false);
    }
}

/// <summary>DI helper to resolve the shared SQLite path.</summary>
public static class AppDatabasePaths
{
    public const string AppFolderName = "UplinkFtp";

    /// <summary>Pre-rename folder left on disk for optional one-time DB copy.</summary>
    public const string LegacyAppFolderName = "FtpAi";

    public static string GetSqlitePath()
    {
        var dir = Path.Combine(
            System.Environment.GetFolderPath(System.Environment.SpecialFolder.LocalApplicationData),
            AppFolderName);
        Directory.CreateDirectory(dir);
        return Path.Combine(dir, "uplinkftp.db");
    }

    public static string GetSqliteConnectionString()
        => $"Data Source={GetSqlitePath()}";

    public static string GetCredentialStoreDirectory()
    {
        var dir = Path.Combine(
            System.Environment.GetFolderPath(System.Environment.SpecialFolder.LocalApplicationData),
            AppFolderName,
            "credentials");
        Directory.CreateDirectory(dir);
        return dir;
    }

    public static string GetLegacyCredentialStoreDirectory()
        => Path.Combine(
            System.Environment.GetFolderPath(System.Environment.SpecialFolder.LocalApplicationData),
            LegacyAppFolderName,
            "credentials");

    public static string GetAppDataDirectory()
    {
        var dir = Path.Combine(
            System.Environment.GetFolderPath(System.Environment.SpecialFolder.LocalApplicationData),
            AppFolderName);
        Directory.CreateDirectory(dir);
        return dir;
    }

    public static string GetSettingsPath()
        => Path.Combine(GetAppDataDirectory(), "settings.json");

    public static string GetSshHostKeysPath()
        => Path.Combine(GetAppDataDirectory(), "ssh-host-keys.json");

    public static string GetTransferQueuePath()
        => Path.Combine(GetAppDataDirectory(), "transfer-queue.json");

    public static string GetSiteBookmarksPath()
        => Path.Combine(GetAppDataDirectory(), "site-bookmarks.json");

    /// <summary>
    /// If the new DB is missing but <c>%LocalAppData%/FtpAi/ftpai.db</c> exists, copy it once.
    /// The legacy folder is not deleted (manual cleanup).
    /// </summary>
    public static void TryMigrateLegacyDatabase()
    {
        var target = GetSqlitePath();
        if (File.Exists(target))
        {
            return;
        }

        var legacy = Path.Combine(
            System.Environment.GetFolderPath(System.Environment.SpecialFolder.LocalApplicationData),
            LegacyAppFolderName,
            "ftpai.db");
        if (!File.Exists(legacy))
        {
            return;
        }

        Directory.CreateDirectory(Path.GetDirectoryName(target)!);
        File.Copy(legacy, target);
    }
}
