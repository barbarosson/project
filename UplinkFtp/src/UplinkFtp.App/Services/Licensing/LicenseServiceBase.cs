using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Licensing;

/// <summary>Shared Free/Pro limit math for Store and Web implementations.</summary>
public abstract class LicenseServiceBase : ILicenseService
{
    private readonly object _gate = new();
    private LicenseTier _tier = LicenseTier.Free;
    private string _statusDetail = "Free tier";

    public abstract DistributionChannel Channel { get; }

    public LicenseTier GetCurrentTier()
    {
        lock (_gate) return _tier;
    }

    public string StatusDetail
    {
        get { lock (_gate) return _statusDetail; }
    }

    public bool IsFeatureEnabled(LicenseFeature feature)
    {
        if (GetCurrentTier() != LicenseTier.Pro)
        {
            return false;
        }

        return feature is LicenseFeature.UnlimitedSites
            or LicenseFeature.ConcurrentTransfers
            or LicenseFeature.ConcurrentConnections
            or LicenseFeature.Sync
            or LicenseFeature.Scripting;
    }

    public int GetMaxSavedSites()
        => GetCurrentTier() == LicenseTier.Pro
            ? LicenseLimits.ProUnlimited
            : LicenseLimits.FreeMaxSavedSites;

    public int GetMaxConcurrentTransfers()
        => GetCurrentTier() == LicenseTier.Pro
            ? LicenseLimits.ProUnlimited
            : LicenseLimits.FreeMaxConcurrentTransfers;

    public int GetMaxConcurrentConnections()
        => GetCurrentTier() == LicenseTier.Pro
            ? LicenseLimits.ProUnlimited
            : LicenseLimits.FreeMaxConcurrentConnections;

    public abstract Task RefreshAsync(CancellationToken cancellationToken = default);

    protected void SetTier(LicenseTier tier, string statusDetail)
    {
        lock (_gate)
        {
            _tier = tier;
            _statusDetail = statusDetail;
        }
    }
}
