using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<LicenseApiOptions>(builder.Configuration.GetSection("LicenseApi"));
builder.Services.PostConfigure<LicenseApiOptions>(opts =>
{
    var envKey = Environment.GetEnvironmentVariable("UPLINK_LICENSE_SIGNING_KEY");
    if (!string.IsNullOrWhiteSpace(envKey))
    {
        opts.SigningKey = envKey;
    }
});
builder.Services.AddSingleton<ILicenseKeyStore, InMemoryLicenseKeyStore>();
builder.Services.AddSingleton<ILicenseTokenSigner, HmacLicenseTokenSigner>();

var app = builder.Build();

app.MapGet("/", () => Results.Ok(new
{
    service = "UplinkFtp.LicenseApi",
    note = "SAMPLE ONLY — not production-hosted. See README.md.",
    validate = "POST /v1/licenses/validate"
}));

app.MapPost("/v1/licenses/validate", (
    ValidateRequest request,
    ILicenseKeyStore store,
    ILicenseTokenSigner signer,
    IOptions<LicenseApiOptions> options) =>
{
    if (string.IsNullOrWhiteSpace(request.LicenseKey) ||
        string.IsNullOrWhiteSpace(request.ProductId))
    {
        return Results.Json(
            new ValidateResponse(false, null, null, null),
            statusCode: StatusCodes.Status400BadRequest);
    }

    if (!string.Equals(request.ProductId, options.Value.ProductId, StringComparison.Ordinal))
    {
        return Results.Json(new ValidateResponse(false, "Free", null, null));
    }

    if (!store.TryGet(request.LicenseKey.Trim(), out var record) || record is null)
    {
        return Results.Json(new ValidateResponse(false, "Free", null, null));
    }

    var expiresAt = DateTimeOffset.UtcNow.Add(options.Value.TokenLifetime);
    var token = signer.CreateToken(request.ProductId, record.Tier, expiresAt);
    return Results.Json(new ValidateResponse(true, record.Tier, token, expiresAt));
});

app.Run();

public sealed record ValidateRequest(
    [property: JsonPropertyName("licenseKey")] string LicenseKey,
    [property: JsonPropertyName("productId")] string ProductId);

public sealed record ValidateResponse(
    [property: JsonPropertyName("valid")] bool Valid,
    [property: JsonPropertyName("tier")] string? Tier,
    [property: JsonPropertyName("token")] string? Token,
    [property: JsonPropertyName("expiresAt")] DateTimeOffset? ExpiresAt);

public sealed class LicenseApiOptions
{
    /// <summary>Must match WebLicenseOptions.ProductId ("UplinkFtp").</summary>
    public string ProductId { get; set; } = "UplinkFtp";

    /// <summary>
    /// HMAC signing key. Prefer env UPLINK_LICENSE_SIGNING_KEY.
    /// Default is a documented placeholder only — never use in production.
    /// </summary>
    public string SigningKey { get; set; } = "DEV-PLACEHOLDER-SIGNING-KEY-NOT-FOR-PRODUCTION";

    public TimeSpan TokenLifetime { get; set; } = TimeSpan.FromHours(24);

    /// <summary>
    /// Sample keys (Development). Prefer env UPLINK_LICENSE_SAMPLE_KEYS
    /// as KEY:Tier,KEY:Tier. Do not put production keys here.
    /// </summary>
    public Dictionary<string, string> SampleKeys { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed record LicenseRecord(string Tier);

public interface ILicenseKeyStore
{
    bool TryGet(string licenseKey, out LicenseRecord? record);
}

public sealed class InMemoryLicenseKeyStore : ILicenseKeyStore
{
    private readonly Dictionary<string, LicenseRecord> _keys;

    public InMemoryLicenseKeyStore(IOptions<LicenseApiOptions> options, IHostEnvironment env)
    {
        _keys = new Dictionary<string, LicenseRecord>(StringComparer.OrdinalIgnoreCase);

        foreach (var (key, tier) in options.Value.SampleKeys)
        {
            if (!string.IsNullOrWhiteSpace(key))
            {
                _keys[key.Trim()] = new LicenseRecord(NormalizeTier(tier));
            }
        }

        // Optional env seed: SAMPLE-PRO-KEY:Pro,SAMPLE-FREE-KEY:Free
        var envSeed = Environment.GetEnvironmentVariable("UPLINK_LICENSE_SAMPLE_KEYS");
        if (!string.IsNullOrWhiteSpace(envSeed))
        {
            foreach (var part in envSeed.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                var pair = part.Split(':', 2, StringSplitOptions.TrimEntries);
                if (pair.Length == 2 && !string.IsNullOrWhiteSpace(pair[0]))
                {
                    _keys[pair[0]] = new LicenseRecord(NormalizeTier(pair[1]));
                }
            }
        }

        // Hard fallback for empty Development store — clearly SAMPLE, never UPLINK-PRO.
        if (_keys.Count == 0 && env.IsDevelopment())
        {
            _keys["SAMPLE-PRO-KEY"] = new LicenseRecord("Pro");
            _keys["SAMPLE-FREE-KEY"] = new LicenseRecord("Free");
        }
    }

    public bool TryGet(string licenseKey, out LicenseRecord? record)
        => _keys.TryGetValue(licenseKey, out record);

    private static string NormalizeTier(string? tier)
        => string.Equals(tier, "Pro", StringComparison.OrdinalIgnoreCase) ? "Pro" : "Free";
}

public interface ILicenseTokenSigner
{
    string CreateToken(string productId, string tier, DateTimeOffset expiresAt);
}

/// <summary>
/// Compact JWT-like token: header.payload.hmacsha256 (URL-safe Base64).
/// Sample contract for WebLicenseService — not a full JWT library.
/// </summary>
public sealed class HmacLicenseTokenSigner : ILicenseTokenSigner
{
    private readonly byte[] _key;

    public HmacLicenseTokenSigner(IOptions<LicenseApiOptions> options)
    {
        _key = Encoding.UTF8.GetBytes(options.Value.SigningKey);
    }

    public string CreateToken(string productId, string tier, DateTimeOffset expiresAt)
    {
        var header = Base64Url(Encoding.UTF8.GetBytes(
            """{"alg":"HS256","typ":"JWT"}"""));

        var payloadObj = new
        {
            productId,
            tier,
            plan = tier,
            exp = expiresAt.ToUnixTimeSeconds(),
            iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
        };
        var payloadJson = JsonSerializer.Serialize(payloadObj);
        var payload = Base64Url(Encoding.UTF8.GetBytes(payloadJson));

        var data = Encoding.ASCII.GetBytes($"{header}.{payload}");
        var sig = HMACSHA256.HashData(_key, data);
        return $"{header}.{payload}.{Base64Url(sig)}";
    }

    private static string Base64Url(byte[] bytes)
        => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
