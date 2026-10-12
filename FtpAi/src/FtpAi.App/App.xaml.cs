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
/// ADIM 1: skeleton only — FTP/transfer/licensing implementations are stubs.
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
    /// Builds the DI container. Later ADIMs replace stubs with real implementations
    /// without changing ViewModel constructor signatures.
    /// </summary>
    private static IServiceProvider ConfigureServices()
    {
        var services = new ServiceCollection();

        // Persistence (EF Core + SQLite) — schema/migrations land in ADIM 2+
        var dbPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "FtpAi",
            "ftpai.db");
        Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite($"Data Source={dbPath}"));

        services.AddSingleton<ISiteRepository, SiteRepositoryStub>();

        // Protocol / transfer stubs (ADIM 2–4)
        services.AddSingleton<IFtpService, FtpServiceStub>();
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
