using UplinkFtp.Data;
using UplinkFtp.Services.Ftp;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Persistence;
using UplinkFtp.Services.Security;
using UplinkFtp.Services.Transfer;
using UplinkFtp.ViewModels;
using UplinkFtp.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.UI.Xaml;
using System;

namespace UplinkFtp;

/// <summary>
/// Application entry point. Registers DI services and hosts the main window.
/// ADIM 5: transfer queue service + tabbed queue UI.
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

    private static IServiceProvider ConfigureServices()
    {
        var services = new ServiceCollection();

        services.AddDbContextFactory<AppDbContext>(options =>
            options.UseSqlite(AppDatabasePaths.GetSqliteConnectionString()));

        services.AddSingleton<IDatabaseInitializer, DatabaseInitializer>();
        services.AddSingleton<ICredentialStore, WindowsCredentialStore>();
        services.AddSingleton<ISiteRepository, SiteRepository>();
        services.AddSingleton<IFtpService, FtpSessionService>();
        services.AddSingleton<ILicenseService, LicenseServiceStub>();
        services.AddSingleton<ITransferQueueService, TransferQueueService>();

        services.AddTransient<LocalBrowserViewModel>();
        services.AddTransient<RemoteBrowserViewModel>();
        services.AddTransient<LogViewModel>();
        services.AddTransient<TransferQueueViewModel>();
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
