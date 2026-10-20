using HaSetup.Core.Docker;

namespace HaSetup.Core.Windows;

/// <summary>
/// Docker Desktop guidance for Windows.
/// Store builds: deep-link + English steps only (no silent/winget install, no elevation).
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
    /// Listing / first-run disclosure. Docker is a separate product.
    /// </summary>
    public static string RequirementDisclosure { get; } =
        "Docker Desktop is required and installs separately (this app does not install Docker). " +
        "When Docker is ready, this app manages the local HA container. " +
        "Install Docker Desktop from the Microsoft Store or the official download page.";

    public static string BuildMissingMessage() =>
        AppChannel.IsStoreBuild ? BuildMissingMessageStore() : BuildMissingMessageDev();

    private static string BuildMissingMessageStore() =>
        """
        Docker Desktop is not installed.

        This Store app does not install Docker (no elevation / silent install).

        What to do:
        1) Use “Open Docker in Store” to open Docker Desktop in the Microsoft Store
           (or use the official download link).
        2) Install Docker Desktop; restart the PC if prompted.
        3) Open Docker Desktop and wait until the engine is running.
        4) Return here and press Refresh.

        Note: Windows Home needs WSL 2. On managed PCs, Docker licensing may be separate.
        """;

    private static string BuildMissingMessageDev() =>
        """
        Docker Desktop is not installed.

        What to do:
        1) Use “Open Docker in Store” / “Download Docker” or “Try silent install”.
        2) After install you may be asked to restart.
        3) Open Docker Desktop and wait until the engine is running.
        4) Return here and press Refresh.

        Note: Windows Home needs WSL 2; the installer usually enables it.
        On managed PCs, a separate Docker Desktop license may be required.
        Silent install is disabled in the Store (MSIX) build.
        """;

    public static string BuildNotRunningMessage() =>
        """
        Docker CLI was found, but Docker Desktop is not running.

        1) Open “Docker Desktop” from the Start menu.
        2) Wait until the whale tray icon is idle/green.
        3) Press Refresh in this app.
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
                This Microsoft Store build does not install Docker Desktop.
                Use “Open Docker in Store” or the official download page; then press Refresh.
                """;
        }

        if (!OperatingSystem.IsWindows())
        {
            return "Silent install only works on Windows. Install Docker manually on Linux/macOS.";
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
            return "Docker Desktop install started via winget. When it finishes, open Docker Desktop and refresh this app.";
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
            return $"Download failed ({ex.Message}). Install manually: {DownloadUrl}";
        }

        var install = await runner.RunAsync(
            installerPath,
            ["install", "--quiet", "--accept-license"],
            cancellationToken).ConfigureAwait(false);

        if (install.Succeeded)
        {
            return "Docker Desktop silent install finished (or started). A reboot may be required; then open Docker Desktop.";
        }

        return $"""
            Automatic install could not finish (exit {install.ExitCode}).
            UAC approval or administrator rights may be required.

            Manual install:
            - Microsoft Store: {MicrosoftStoreWebUrl}
            - Download: {DownloadUrl}
            - Docs: {DocsUrl}

            Detail: {install.CombinedOutput}
            """;
    }
}
