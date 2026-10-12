using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using UplinkFtp.Services.Licensing;
using UplinkFtp.Services.Security;

namespace UplinkFtp.Core.Tests;

public sealed class WebLicenseServiceTests
{
    [Fact]
    public async Task Stub_key_grants_Pro_when_AllowStubKeys_true()
    {
        using var _ = StubKeysEnv.Enable();
        var store = new MemoryCredentialStore();
        var sut = new WebLicenseService(
            new WebLicenseOptions
            {
                AllowStubKeys = true,
                InitialLicenseKey = "UPLINK-PRO"
            },
            store);

        await sut.RefreshAsync();
        Assert.Equal(LicenseTier.Pro, sut.GetCurrentTier());
        Assert.Contains("stub", sut.StatusDetail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Stub_key_ignored_when_AllowStubKeys_false()
    {
        var store = new MemoryCredentialStore();
        var sut = new WebLicenseService(
            new WebLicenseOptions
            {
                AllowStubKeys = false,
                InitialLicenseKey = "UPLINK-PRO",
                ValidationBaseUrl = null
            },
            store);

        await sut.RefreshAsync();
        Assert.Equal(LicenseTier.Free, sut.GetCurrentTier());
    }

    [Fact]
    public async Task No_key_stays_Free()
    {
        var sut = new WebLicenseService(new WebLicenseOptions { AllowStubKeys = true }, new MemoryCredentialStore());
        await sut.RefreshAsync();
        Assert.Equal(LicenseTier.Free, sut.GetCurrentTier());
    }

    [Fact]
    public async Task SetLicenseKeyAsync_persists_and_refreshes()
    {
        using var _ = StubKeysEnv.Enable();
        var store = new MemoryCredentialStore();
        var sut = new WebLicenseService(
            new WebLicenseOptions { AllowStubKeys = true },
            store);

        await sut.SetLicenseKeyAsync("UPLINK-PRO-DEV");
        Assert.Equal(LicenseTier.Pro, sut.GetCurrentTier());

        var saved = await store.GetSecretAsync(
            WebLicenseService.CredentialResourceKey,
            WebLicenseService.CredentialUserName);
        Assert.Equal("UPLINK-PRO-DEV", saved);
    }

    /// <summary>Release builds also require UPLINK_ALLOW_STUB_KEYS=1 for stubs.</summary>
    private sealed class StubKeysEnv : IDisposable
    {
        private readonly string? _previous;

        private StubKeysEnv(string? previous) => _previous = previous;

        public static StubKeysEnv Enable()
        {
            var previous = Environment.GetEnvironmentVariable("UPLINK_ALLOW_STUB_KEYS");
            Environment.SetEnvironmentVariable("UPLINK_ALLOW_STUB_KEYS", "1");
            return new StubKeysEnv(previous);
        }

        public void Dispose()
            => Environment.SetEnvironmentVariable("UPLINK_ALLOW_STUB_KEYS", _previous);
    }

    [Fact]
    public async Task Validate_endpoint_grants_Pro_from_response()
    {
        var handler = new StubHttpHandler((req, _) =>
        {
            Assert.Equal(HttpMethod.Post, req.Method);
            Assert.EndsWith("/v1/licenses/validate", req.RequestUri!.AbsoluteUri, StringComparison.Ordinal);
            var json = JsonSerializer.Serialize(new { valid = true, tier = "Pro", token = (string?)null });
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
        });

        var http = new HttpClient(handler);
        var sut = new WebLicenseService(
            new WebLicenseOptions
            {
                AllowStubKeys = false,
                InitialLicenseKey = "REAL-KEY-123",
                ValidationBaseUrl = "https://license.test"
            },
            new MemoryCredentialStore(),
            http);

        await sut.RefreshAsync();
        Assert.Equal(LicenseTier.Pro, sut.GetCurrentTier());
        Assert.Contains("validated Pro", sut.StatusDetail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Validate_http_failure_stays_Free()
    {
        var handler = new StubHttpHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.Unauthorized)));

        var sut = new WebLicenseService(
            new WebLicenseOptions
            {
                AllowStubKeys = false,
                InitialLicenseKey = "BAD",
                ValidationBaseUrl = "https://license.test"
            },
            new MemoryCredentialStore(),
            new HttpClient(handler));

        await sut.RefreshAsync();
        Assert.Equal(LicenseTier.Free, sut.GetCurrentTier());
    }

    private sealed class StubHttpHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _handler;

        public StubHttpHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler)
            => _handler = handler;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
            => _handler(request, cancellationToken);
    }
}
