namespace UplinkFtp.Services.Licensing;

/// <summary>Build / distribution channel that selects the <see cref="ILicenseService"/> implementation.</summary>
public enum DistributionChannel
{
    /// <summary>Microsoft Store / MSIX with Store licensing APIs.</summary>
    Store = 0,

    /// <summary>Web / sideload installer with license-key + REST/JWT validation.</summary>
    Web = 1
}

/// <summary>
/// Compile-time channel switch. Override with
/// <c>/p:UplinkDistributionChannel=Store</c> or <c>Web</c> (default Web for unpackaged).
/// </summary>
public static class DistributionOptions
{
#if UPLINK_CHANNEL_STORE
    public const DistributionChannel Channel = DistributionChannel.Store;
#else
    public const DistributionChannel Channel = DistributionChannel.Web;
#endif
}
