namespace HaSetup.Core;

/// <summary>
/// Build-time channel: Store MSIX vs unpackaged/dev.
/// Pass <c>-p:StoreBuild=true</c> (defines <c>STORE_BUILD</c>) for Microsoft Store packages.
/// </summary>
public static class AppChannel
{
#if STORE_BUILD
    public const bool IsStoreBuild = true;
#else
    public const bool IsStoreBuild = false;
#endif

    /// <summary>Silent/winget Docker install is only for non-Store (dev/sideload) builds.</summary>
    public static bool AllowsSilentDockerInstall => !IsStoreBuild;

    public static string ChannelLabelTr =>
        IsStoreBuild ? "Microsoft Store sürümü" : "Geliştirme / sideload sürümü";
}
