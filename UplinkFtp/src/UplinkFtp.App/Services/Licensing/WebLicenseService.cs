using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Services.Security;

namespace UplinkFtp.Services.Licensing;

/// <summary>
/// Web / sideload licensing: license key → REST validate + JWT claims, with offline stub keys.
/// </summary>
public sealed class WebLicenseService : LicenseServiceBase
{
    public const string CredentialResourceKey = "web-license";
    public const string CredentialUserName = "license-key";

    private readonly WebLicenseOptions _options;
    private readonly ICredentialStore _credentials;
    private readonly HttpClient _http;

    public WebLicenseService(
        WebLicenseOptions options,
        ICredentialStore credentials,
        HttpClient? httpClient = null)
    {
        _options = options;
        _credentials = credentials;
        _http = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
    }

    public override DistributionChannel Channel => DistributionChannel.Web;

    public override async Task RefreshAsync(CancellationToken cancellationToken = default)
    {
        var key = _options.InitialLicenseKey;
        if (string.IsNullOrWhiteSpace(key))
        {
            key = await _credentials.GetSecretAsync(CredentialResourceKey, CredentialUserName, cancellationToken)
                .ConfigureAwait(false);
        }

        if (string.IsNullOrWhiteSpace(key))
        {
            SetTier(LicenseTier.Free, "Web: no license key (Free)");
            return;
        }

        if (IsStubProKey(key))
        {
            SetTier(LicenseTier.Pro, "Web: stub Pro key");
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.ValidationBaseUrl))
        {
            SetTier(LicenseTier.Free, "Web: key present but no ValidationBaseUrl (Free)");
            return;
        }

        try
        {
            var url = _options.ValidationBaseUrl.TrimEnd('/') + "/v1/licenses/validate";
            using var response = await _http.PostAsJsonAsync(
                url,
                new ValidateRequest(key.Trim(), WebLicenseOptions.ProductId),
                cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                SetTier(LicenseTier.Free, $"Web: validate HTTP {(int)response.StatusCode} (Free)");
                return;
            }

            var body = await response.Content.ReadFromJsonAsync<ValidateResponse>(cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (body is null || !body.Valid)
            {
                SetTier(LicenseTier.Free, "Web: invalid license (Free)");
                return;
            }

            var tier = ParseTier(body.Tier, body.Token);
            SetTier(
                tier,
                tier == LicenseTier.Pro
                    ? "Web: validated Pro"
                    : "Web: validated Free");
        }
        catch (Exception ex)
        {
            SetTier(LicenseTier.Free, $"Web: validate failed — {ex.GetType().Name} (Free)");
        }
    }

    /// <summary>Persists a license key and refreshes entitlement.</summary>
    public async Task SetLicenseKeyAsync(string? licenseKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(licenseKey))
        {
            await _credentials.DeleteSecretAsync(CredentialResourceKey, CredentialUserName, cancellationToken)
                .ConfigureAwait(false);
        }
        else
        {
            await _credentials.SaveSecretAsync(
                    CredentialResourceKey,
                    CredentialUserName,
                    licenseKey.Trim(),
                    cancellationToken)
                .ConfigureAwait(false);
        }

        await RefreshAsync(cancellationToken).ConfigureAwait(false);
    }

    private bool IsStubProKey(string key)
        => _options.StubProKeys.Any(k => string.Equals(k, key.Trim(), StringComparison.OrdinalIgnoreCase));

    private static LicenseTier ParseTier(string? tier, string? jwt)
    {
        if (!string.IsNullOrWhiteSpace(tier) &&
            tier.Equals("Pro", StringComparison.OrdinalIgnoreCase))
        {
            return LicenseTier.Pro;
        }

        if (!string.IsNullOrWhiteSpace(jwt) && TryReadJwtTier(jwt) == LicenseTier.Pro)
        {
            return LicenseTier.Pro;
        }

        return LicenseTier.Free;
    }

    /// <summary>Best-effort JWT payload decode (no signature verify — server already validated).</summary>
    private static LicenseTier TryReadJwtTier(string jwt)
    {
        try
        {
            var parts = jwt.Split('.');
            if (parts.Length < 2)
            {
                return LicenseTier.Free;
            }

            var payload = parts[1].Replace('-', '+').Replace('_', '/');
            switch (payload.Length % 4)
            {
                case 2: payload += "=="; break;
                case 3: payload += "="; break;
            }

            var json = Encoding.UTF8.GetString(Convert.FromBase64String(payload));
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("tier", out var tierProp) &&
                tierProp.GetString()?.Equals("Pro", StringComparison.OrdinalIgnoreCase) == true)
            {
                return LicenseTier.Pro;
            }

            if (doc.RootElement.TryGetProperty("plan", out var planProp) &&
                planProp.GetString()?.Equals("Pro", StringComparison.OrdinalIgnoreCase) == true)
            {
                return LicenseTier.Pro;
            }
        }
        catch
        {
            // ignore malformed tokens
        }

        return LicenseTier.Free;
    }

    private sealed record ValidateRequest(string LicenseKey, string ProductId);

    private sealed record ValidateResponse(bool Valid, string? Tier, string? Token, DateTimeOffset? ExpiresAt);
}
