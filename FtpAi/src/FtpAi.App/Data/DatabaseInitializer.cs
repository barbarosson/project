using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace FtpAi.Data;

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
        await using var db = await _dbFactory.CreateDbContextAsync(cancellationToken).ConfigureAwait(false);
        // EnsureCreated: creates schema if missing; does not apply incremental migrations.
        await db.Database.EnsureCreatedAsync(cancellationToken).ConfigureAwait(false);
    }
}

/// <summary>DI helper to resolve the shared SQLite path.</summary>
public static class AppDatabasePaths
{
    public static string GetSqlitePath()
    {
        var dir = System.IO.Path.Combine(
            System.Environment.GetFolderPath(System.Environment.SpecialFolder.LocalApplicationData),
            "FtpAi");
        System.IO.Directory.CreateDirectory(dir);
        return System.IO.Path.Combine(dir, "ftpai.db");
    }

    public static string GetSqliteConnectionString()
        => $"Data Source={GetSqlitePath()}";

    public static string GetCredentialStoreDirectory()
    {
        var dir = System.IO.Path.Combine(
            System.Environment.GetFolderPath(System.Environment.SpecialFolder.LocalApplicationData),
            "FtpAi",
            "credentials");
        System.IO.Directory.CreateDirectory(dir);
        return dir;
    }
}
