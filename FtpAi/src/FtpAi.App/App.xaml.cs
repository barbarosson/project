using FtpAi.Data;
using FtpAi.Services.Ftp;
using FtpAi.Services.Licensing;
using FtpAi.Services.Persistence;
using FtpAi.Services.Security;
using FtpAi.ViewModels;
using FtpAi.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.UI.Xaml;
using System;

namespace FtpAi;

/// <summary>
/// Application entry point. Registers DI services and hosts the main window.
/// ADIM 3: SQLite Site Manager persistence + PasswordVault/DPAPI credentials.
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
    /// Builds the DI container.
    /// </summary>
    private static IServiceProvider ConfigureServices()
    {
        var services = new ServiceCollection();

        // Persistence — EF Core SQLite (EnsureCreated on launch)
        services.AddDbContextFactory<AppDbContext>(options =>
            options.UseSqlite(AppDatabasePaths.GetSqliteConnectionString()));

        services.AddSingleton<IDatabaseInitializer, DatabaseInitializer>();
        services.AddSingleton<ICredentialStore, WindowsCredentialStore>();
        services.AddSingleton<ISiteRepository, SiteRepository>();

        // Protocol (ADIM 2)
        services.AddSingleton<IFtpService, FtpSessionService>();

        // Licensing stub with Free-tier site-count hook
        services.AddSingleton<ILicenseService, LicenseServiceStub>();

        // ViewModels / Views
        services.AddTransient<MainViewModel>();
        services.AddTransient<MainWindow>();

        return services.BuildServiceProvider();
    }

    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        await Services.GetRequiredService<IDatabaseInitializer>()
            .InitializeAsync()
            .ConfigureAwait(true);

        _mainWindow = Services.GetRequiredService<MainWindow>();
        _mainWindow.Activate();
    }
}
