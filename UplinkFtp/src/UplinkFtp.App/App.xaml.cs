using System;
using UplinkFtp.Data;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Persistence;
using UplinkFtp.Services.Security;
using UplinkFtp.ViewModels;
using UplinkFtp.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.UI.Xaml;

namespace UplinkFtp;

/// <summary>
/// Application entry point. Registers DI services and hosts the main window.
/// ADIM 6+: Store / Web licensing with Free/Pro gates; Core pool + queue wiring.
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

        // Core settings + telemetry (defaults: AcceptAnyCertificate=false, telemetry opt-in false).
        services.AddSingleton(new UplinkFtp.Services.Settings.AppSettings
        {
            AcceptAnyCertificate = false
        });
        services.AddSingleton(sp =>
        {
            var settings = sp.GetRequiredService<UplinkFtp.Services.Settings.AppSettings>();
            return new UplinkFtp.Services.Privacy.TelemetryService(optedIn: settings.TelemetryOptIn);
        });

        // AI module: BYOK cloud adapter + local heuristics facade (IAiAssistantService).
        services.AddSingleton<UplinkFtp.Services.Ai.CloudAiAssistantService>();
        services.AddSingleton<UplinkFtp.Services.Ai.IAiAssistantService>(sp =>
            new UplinkFtp.Services.Ai.LocalAiAssistantService(
                sp.GetRequiredService<ICredentialStore>(),
                sp.GetRequiredService<UplinkFtp.Services.Settings.AppSettings>(),
                sp.GetRequiredService<UplinkFtp.Services.Ai.CloudAiAssistantService>()));

        RegisterLicensing(services);

        services.AddSingleton<UplinkFtp.Services.Ftp.IConnectionPool, UplinkFtp.Services.Ftp.ConnectionPool>();
        services.AddSingleton<UplinkFtp.Services.Ftp.IFtpService>(sp =>
            new UplinkFtp.Services.Ftp.FtpSessionService(
                sp.GetRequiredService<ILicenseService>(),
                sp.GetRequiredService<UplinkFtp.Services.Ftp.IConnectionPool>()));
        services.AddSingleton<UplinkFtp.Services.Transfer.ITransferQueueService>(sp =>
            new UplinkFtp.Services.Transfer.TransferQueueService(
                sp.GetRequiredService<UplinkFtp.Services.Ftp.IFtpService>(),
                sp.GetRequiredService<ILicenseService>(),
                sp.GetRequiredService<UplinkFtp.Services.Ftp.IConnectionPool>()));

        services.AddTransient<LocalBrowserViewModel>();
        services.AddTransient<RemoteBrowserViewModel>();
        services.AddTransient<LogViewModel>();
        services.AddTransient<TransferQueueViewModel>();
        services.AddTransient<SiteManagerViewModel>();
        services.AddTransient<SettingsViewModel>();
        services.AddTransient<LicenseViewModel>();
        services.AddTransient<AssistViewModel>();
        services.AddTransient<MainViewModel>();
        services.AddTransient<MainWindow>();

        return services.BuildServiceProvider();
    }

    private static void RegisterLicensing(IServiceCollection services)
    {
#if UPLINK_CHANNEL_STORE
        services.AddSingleton<ILicenseService, StoreLicenseService>();
#else
        var allowStubKeys =
            UplinkFtp.Services.Licensing.WebLicenseOptions.DefaultAllowStubKeys()
            || string.Equals(
                Environment.GetEnvironmentVariable("UPLINK_ALLOW_STUB_KEYS"),
                "1",
                StringComparison.Ordinal);

        services.AddSingleton(new UplinkFtp.Services.Licensing.WebLicenseOptions
        {
            ValidationBaseUrl = Environment.GetEnvironmentVariable("UPLINK_LICENSE_URL"),
            InitialLicenseKey = Environment.GetEnvironmentVariable("UPLINK_LICENSE_KEY"),
            AllowStubKeys = allowStubKeys
        });
        services.AddSingleton<ILicenseService>(sp =>
            new UplinkFtp.Services.Licensing.WebLicenseService(
                sp.GetRequiredService<UplinkFtp.Services.Licensing.WebLicenseOptions>(),
                sp.GetRequiredService<ICredentialStore>()));
#endif
    }

    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        await Services.GetRequiredService<IDatabaseInitializer>()
            .InitializeAsync()
            .ConfigureAwait(true);

        await Services.GetRequiredService<ILicenseService>()
            .RefreshAsync()
            .ConfigureAwait(true);

        _mainWindow = Services.GetRequiredService<MainWindow>();
        _mainWindow.Activate();
    }
}
