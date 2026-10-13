namespace UplinkFtp.Services.Licensing;

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
