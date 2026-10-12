namespace UplinkFtp.Services.Licensing;

/// <summary>Canonical Free / Pro numeric gates for Uplink FTP (ADIM 6).</summary>
public static class LicenseLimits
{
    public const int FreeMaxSavedSites = 3;

    public const int FreeMaxConcurrentConnections = 1;

    public const int FreeMaxConcurrentTransfers = 1;

    public const int ProUnlimited = int.MaxValue;
}
