using HaSetup.Core.Docker;

namespace HaSetup.Core.Windows;

/// <summary>
/// Docker Desktop installation helpers for Windows.
/// Silent install is best-effort: UAC, reboot, and WSL enablement often still need the user.
/// </summary>
public static class DockerDesktopGuidance
{
    public const string DownloadUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe";
    public const string DocsUrl = "https://docs.docker.com/desktop/setup/install/windows-install/";

    public static string BuildMissingMessageTr() =>
        """
        Docker Desktop yüklü değil.

        Ne yapmalısınız:
        1) Aşağıdaki indirme bağlantısını açın veya “Sessiz kurulum dene”ye basın.
        2) Kurulum bitince bilgisayarı yeniden başlatmanız istenebilir.
        3) Docker Desktop’ı açın ve “Engine running” olana kadar bekleyin.
        4) Bu uygulamaya dönüp “Yenile”ye basın.

        Not: Windows Home’da WSL 2 gerekir; kurulum sihirbazı bunu açmaya çalışır.
        Kurumsal bilgisayarlarda Docker Desktop lisansı ayrıca gerekebilir.
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
    /// Returns guidance text; never throws for expected user-facing failures.
    /// </summary>
    public static async Task<string> TrySilentInstallAsync(
        IProcessRunner runner,
        CancellationToken cancellationToken = default)
    {
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
            - İndirme: {DownloadUrl}
            - Belgeler: {DocsUrl}

            Ayrıntı: {install.CombinedOutput}
            """;
    }
}
