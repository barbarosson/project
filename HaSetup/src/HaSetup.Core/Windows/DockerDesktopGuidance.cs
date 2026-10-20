using HaSetup.Core.Docker;

namespace HaSetup.Core.Windows;

/// <summary>
/// Docker Desktop guidance for Windows.
/// Store builds: deep-link + Turkish steps only (no silent/winget install, no elevation).
/// Dev/sideload builds may attempt best-effort silent install.
/// </summary>
public static class DockerDesktopGuidance
{
    public const string DownloadUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe";
    public const string DocsUrl = "https://docs.docker.com/desktop/setup/install/windows-install/";
    public const string MicrosoftStoreWebUrl = "https://apps.microsoft.com/detail/xp8cbj40xlbwkx";
    public const string MicrosoftStoreProductId = "XP8CBJ40XLBWKX";
    public const string MicrosoftStoreDeepLink = "ms-windows-store://pdp/?ProductId=XP8CBJ40XLBWKX";

    /// <summary>
    /// Listing / first-run disclosure (Turkish). Docker is a separate product.
    /// </summary>
    public static string RequirementDisclosureTr { get; } =
        "Docker Desktop gerekir ve ayrı kurulur (bu uygulama Docker kurmaz). " +
        "Docker hazırsa Home Assistant container’ı yönetilir. " +
        "Microsoft Store / resmi indirme sayfasından Docker Desktop’ı yükleyin.";

    public static string BuildMissingMessageTr() =>
        AppChannel.IsStoreBuild ? BuildMissingMessageStoreTr() : BuildMissingMessageDevTr();

    private static string BuildMissingMessageStoreTr() =>
        """
        Docker Desktop yüklü değil.

        Bu Store uygulaması Docker’ı kurmaz (yükseltme / sessiz kurulum yok).

        Ne yapmalısınız:
        1) “Docker Store’da aç” ile Microsoft Store’daki Docker Desktop sayfasını açın
           (veya resmi indirme linkini kullanın).
        2) Docker Desktop’ı kurun; gerekirse bilgisayarı yeniden başlatın.
        3) Docker Desktop’ı açın ve “Engine running” olana kadar bekleyin.
        4) Bu uygulamaya dönüp “Yenile”ye basın.

        Not: Windows Home’da WSL 2 gerekir. Kurumsal PC’lerde Docker lisansı ayrı olabilir.
        """;

    private static string BuildMissingMessageDevTr() =>
        """
        Docker Desktop yüklü değil.

        Ne yapmalısınız:
        1) “Docker Store’da aç” / “Docker indir” veya “Sessiz kurulum dene”yi kullanın.
        2) Kurulum bitince bilgisayarı yeniden başlatmanız istenebilir.
        3) Docker Desktop’ı açın ve “Engine running” olana kadar bekleyin.
        4) Bu uygulamaya dönüp “Yenile”ye basın.

        Not: Windows Home’da WSL 2 gerekir; kurulum sihirbazı bunu açmaya çalışır.
        Kurumsal bilgisayarlarda Docker Desktop lisansı ayrıca gerekebilir.
        Store (MSIX) sürümünde sessiz kurulum kapalıdır.
        """;

    public static string BuildNotRunningMessageTr() =>
        """
        Docker CLI bulundu ancak Docker Desktop çalışmıyor.

        1) Başlat menüsünden “Docker Desktop”ı açın.
        2) Sistem tepsisinde balina ikonu yeşil/idle olana kadar bekleyin.
        3) Bu uygulamada “Yenile”ye basın.
        """;

    /// <summary>
    /// Attempts a quiet Docker Desktop install via winget, then falls back to downloading the installer.
    /// Disabled for Store builds. Never throws for expected user-facing failures.
    /// </summary>
    public static async Task<string> TrySilentInstallAsync(
        IProcessRunner runner,
        CancellationToken cancellationToken = default)
    {
        if (!AppChannel.AllowsSilentDockerInstall)
        {
            return """
                Bu Microsoft Store sürümü Docker Desktop kurmaz.
                “Docker Store’da aç” veya resmi indirme sayfasını kullanın; kurulum bitince Yenile’ye basın.
                """;
        }

        if (!OperatingSystem.IsWindows())
        {
            return "Sessiz kurulum yalnızca Windows üzerinde çalışır. Linux/macOS için Docker’ı manuel kurun.";
        }

        var winget = await runner.RunAsync(
            "winget",
            [
                "install",
                "-e",
                "--id", "Docker.DockerDesktop",
                "--accept-package-agreements",
                "--accept-source-agreements",
                "--disable-interactivity",
            ],
            cancellationToken).ConfigureAwait(false);

        if (winget.Succeeded)
        {
            return "winget ile Docker Desktop kurulumu başlatıldı. Kurulum bitince Docker Desktop’ı açın ve uygulamayı yenileyin.";
        }

        var tempDir = Path.Combine(Path.GetTempPath(), "HaSetup");
        Directory.CreateDirectory(tempDir);
        var installerPath = Path.Combine(tempDir, "DockerDesktopInstaller.exe");

        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromMinutes(10) };
            await using (var remote = await http.GetStreamAsync(DownloadUrl, cancellationToken).ConfigureAwait(false))
            await using (var local = File.Create(installerPath))
            {
                await remote.CopyToAsync(local, cancellationToken).ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            return $"İndirme başarısız ({ex.Message}). Manuel indirin: {DownloadUrl}";
        }

        var install = await runner.RunAsync(
            installerPath,
            ["install", "--quiet", "--accept-license"],
            cancellationToken).ConfigureAwait(false);

        if (install.Succeeded)
        {
            return "Docker Desktop sessiz kurulum tamamlandı (veya başlatıldı). Yeniden başlatma gerekebilir; sonra Docker Desktop’ı açın.";
        }

        return $"""
            Otomatik kurulum tamamlanamadı (çıkış {install.ExitCode}).
            UAC onayı veya yönetici hakları gerekebilir.

            Manuel kurulum:
            - Microsoft Store: {MicrosoftStoreWebUrl}
            - İndirme: {DownloadUrl}
            - Belgeler: {DocsUrl}

            Ayrıntı: {install.CombinedOutput}
            """;
    }
}
