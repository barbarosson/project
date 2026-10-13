namespace UplinkFtp.Services.Licensing;

/// <summary>Build / distribution channel that selects the <see cref="ILicenseService"/> implementation.</summary>
public enum DistributionChannel
{
    /// <summary>Microsoft Store / MSIX with Store licensing APIs.</summary>
    Store = 0,

    /// <summary>Web / sideload installer with license-key + REST/JWT validation.</summary>
    Web = 1
}
