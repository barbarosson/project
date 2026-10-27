using System;
using UplinkFtp.Data;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Persistence;
using UplinkFtp.Services.Security;
using UplinkFtp.Services.Transfer;
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
        services.AddSingleton<ISiteBookmarkStore>(_ =>
            new JsonSiteBookmarkStore(AppDatabasePaths.GetSiteBookmarksPath()));

        // Settings: singleton instance loaded from LocalAppData JSON (secrets stay in Credential Locker).
        var appSettings = new UplinkFtp.Services.Settings.AppSettings
        {
            AcceptAnyCertificate = false
        };
        services.AddSingleton(appSettings);
        services.AddSingleton<UplinkFtp.Services.Settings.IAppSettingsStore>(_ =>
            new UplinkFtp.Services.Settings.JsonAppSettingsStore(AppDatabasePaths.GetSettingsPath()));
        services.AddSingleton(sp =>
        {
            var settings = sp.GetRequiredService<UplinkFtp.Services.Settings.AppSettings>();
            return new UplinkFtp.Services.Privacy.TelemetryService(optedIn: settings.TelemetryOptIn);
        });

        // SFTP host-key pin + UI prompt.
        services.AddSingleton<ISshHostKeyStore>(_ =>
            new JsonSshHostKeyStore(AppDatabasePaths.GetSshHostKeysPath()));
        services.AddSingleton<UiSshHostKeyPrompt>();
        services.AddSingleton<ISshHostKeyPrompt>(sp => sp.GetRequiredService<UiSshHostKeyPrompt>());
        services.AddSingleton(sp =>
            new SshHostKeyVerifier(
                sp.GetRequiredService<ISshHostKeyStore>(),
                sp.GetRequiredService<ISshHostKeyPrompt>()));

        // Transfer conflict Ask prompt.
        services.AddSingleton<UiTransferConflictPrompt>();
        services.AddSingleton<ITransferConflictPrompt>(sp => sp.GetRequiredService<UiTransferConflictPrompt>());

        // Queue persistence.
        services.AddSingleton<ITransferQueuePersistence>(_ =>
            new JsonTransferQueuePersistence(AppDatabasePaths.GetTransferQueuePath()));

        // AI module: BYOK cloud adapter + local heuristics facade (IAiAssistantService).
        services.AddSingleton<UplinkFtp.Services.Ai.CloudAiAssistantService>();
        services.AddSingleton<UplinkFtp.Services.Ai.IAiAssistantService>(sp =>
            new UplinkFtp.Services.Ai.LocalAiAssistantService(
                sp.GetRequiredService<ICredentialStore>(),
                sp.GetRequiredService<UplinkFtp.Services.Settings.AppSettings>(),
                sp.GetRequiredService<UplinkFtp.Services.Ai.CloudAiAssistantService>()));

        // HWND for WinRT Store purchase UI (InitializeWithWindow) — Window set in OnLaunched.
        services.AddSingleton<MainWindowHandleProvider>();
        services.AddSingleton<IWindowHandleProvider>(sp => sp.GetRequiredService<MainWindowHandleProvider>());

        RegisterLicensing(services);

        services.AddSingleton<UplinkFtp.Services.Ftp.IConnectionPool, UplinkFtp.Services.Ftp.ConnectionPool>();
        services.AddSingleton<UplinkFtp.Services.Ftp.IFtpService>(sp =>
            new UplinkFtp.Services.Ftp.FtpSessionService(
                sp.GetRequiredService<ILicenseService>(),
                sp.GetRequiredService<UplinkFtp.Services.Ftp.IConnectionPool>()));
        // Transfers: Pro leases pool clients; Free falls back to gated IFtpService APIs.
        services.AddSingleton<UplinkFtp.Services.Transfer.ITransferQueueService>(sp =>
            new UplinkFtp.Services.Transfer.TransferQueueService(
                sp.GetRequiredService<UplinkFtp.Services.Ftp.IFtpService>(),
                sp.GetRequiredService<ILicenseService>(),
                conflictPrompt: sp.GetRequiredService<ITransferConflictPrompt>(),
                askSuggestedDefault: sp.GetRequiredService<UplinkFtp.Services.Settings.AppSettings>()
                    .ConflictAskDefault));
        services.AddSingleton<UplinkFtp.Services.Browse.IDirectoryCompareService,
            UplinkFtp.Services.Browse.DirectoryCompareService>();
        services.AddSingleton<UplinkFtp.Services.Browse.IDirectorySyncService,
            UplinkFtp.Services.Browse.DirectorySyncService>();

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
        // Store IDs: defaults match Partner Center (9MTN64PZGQCM); override via UPLINK_STORE_* env.
        services.AddSingleton(new UplinkFtp.Services.Licensing.StoreCommerceOptions());
        services.AddSingleton<ILicenseService>(sp =>
            new StoreLicenseService(
                sp.GetRequiredService<UplinkFtp.Services.Licensing.StoreCommerceOptions>(),
                sp.GetRequiredService<IWindowHandleProvider>()));
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
        var settingsStore = Services.GetRequiredService<UplinkFtp.Services.Settings.IAppSettingsStore>();
        var settings = Services.GetRequiredService<UplinkFtp.Services.Settings.AppSettings>();
        await settingsStore.LoadIntoAsync(settings).ConfigureAwait(true);
        Services.GetRequiredService<UplinkFtp.Services.Privacy.TelemetryService>()
            .SetOptIn(settings.TelemetryOptIn);

        await Services.GetRequiredService<IDatabaseInitializer>()
            .InitializeAsync()
            .ConfigureAwait(true);

        // Construct the window first so StoreContext can InitializeWithWindow (WinUI 3
        // desktop throws COMException on RequestPurchaseAsync without an HWND). Refresh
        // before Activate so MainViewModel.InitializeAsync still sees a ready tier.
        _mainWindow = Services.GetRequiredService<MainWindow>();
        Services.GetRequiredService<MainWindowHandleProvider>().Window = _mainWindow;

        await Services.GetRequiredService<ILicenseService>()
            .RefreshAsync()
            .ConfigureAwait(true);

        _mainWindow.Activate();
    }
}
