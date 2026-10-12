using FtpAi.Data;
using FtpAi.Services.Ftp;
using FtpAi.Services.Licensing;
using FtpAi.Services.Persistence;
using FtpAi.ViewModels;
using FtpAi.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.UI.Xaml;
using System;
using System.IO;

namespace FtpAi;

/// <summary>
/// Application entry point. Registers DI services and hosts the main window.
/// ADIM 2: real FTP/SFTP session service; licensing/site repo remain stubs.
/// </summary>
public partial class App : Application
{
    private Window? _mainWindow;

    /// <summary>Root DI container for the application lifetime.</summary>
    public static IServiceProvider Services { get; private set; } = null!;

    public App()
    {
        InitializeComponent();
        Services = ConfigureServices();
    }

    /// <summary>
    /// Builds the DI container. Protocol work uses <see cref="FtpSessionService"/>;
    /// licensing and site persistence stay stubbed until later ADIMs.
    /// </summary>
    private static IServiceProvider ConfigureServices()
    {
        var services = new ServiceCollection();

        // Persistence (EF Core + SQLite) — Site Manager UI/repo still stubbed
        var dbPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "FtpAi",
            "ftpai.db");
        Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite($"Data Source={dbPath}"));

        services.AddSingleton<ISiteRepository, SiteRepositoryStub>();

        // ADIM 2: FluentFTP + SSH.NET behind IFtpService
        services.AddSingleton<IFtpService, FtpSessionService>();
        services.AddSingleton<ILicenseService, LicenseServiceStub>();

        // ViewModels
        services.AddTransient<MainViewModel>();

        // Views (resolved when MainWindow is created)
        services.AddTransient<MainWindow>();

        return services.BuildServiceProvider();
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        _mainWindow = Services.GetRequiredService<MainWindow>();
        _mainWindow.Activate();
    }
}
