using System.Net;
using System.Text;
using UplinkFtp.Services.Ai;
using UplinkFtp.Services.Security;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.Core.Tests;

public sealed class CloudAiGeminiTests
{
    [Fact]
    public void ResolveGeminiUrl_uses_default_model_and_base()
    {
        var url = CloudAiAssistantService.ResolveGeminiUrl(null, null);
        Assert.Equal(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            url);
    }

    [Fact]
    public void ResolveGeminiUrl_honors_override()
    {
        var url = CloudAiAssistantService.ResolveGeminiUrl(
            "ignored",
            "https://example.test/custom:generateContent");
        Assert.Equal("https://example.test/custom:generateContent", url);
    }

    [Fact]
    public void DefaultModelFor_gemini_is_flash()
    {
        Assert.Equal("gemini-2.0-flash", CloudAiAssistantService.DefaultModelFor(AiProviderKind.Gemini));
    }

    [Fact]
    public async Task Troubleshoot_Gemini_posts_generateContent_with_api_key_header()
    {
        HttpRequestMessage? seen = null;
        var handler = new StubHandler(req =>
        {
            seen = req;
            var json =
                """
                {
                  "candidates": [{
                    "content": {
                      "parts": [{ "text": "{\"title\":\"Gemini ok\",\"advice\":\"Use passive mode.\",\"steps\":[\"Retry\"],\"suggestedUiAction\":\"Settings\"}" }]
                    }
                  }]
                }
                """;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
        });

        var store = new MemoryCredentialStore();
        await store.SaveSecretAsync(AiCredentialKeys.ApiKeyResource, AiCredentialKeys.ApiKeyUserName, "AIza-test-key");
        var settings = new AppSettings
        {
            AiProvider = AiProviderKind.Gemini,
            AiModel = "gemini-2.0-flash"
        };
        var cloud = new CloudAiAssistantService(store, settings, new HttpClient(handler));

        var result = await cloud.TroubleshootAsync(new AiTroubleshootRequest
        {
            LogLines = ["ERROR: Connection timed out"],
            Protocol = "FTP",
            Host = "127.0.0.1"
        });

        Assert.True(result.UsedCloudModel);
        Assert.Equal("Gemini ok", result.Title);
        Assert.Contains("passive", result.Advice, StringComparison.OrdinalIgnoreCase);
        Assert.NotNull(seen);
        Assert.Equal(HttpMethod.Post, seen!.Method);
        Assert.Contains("generativelanguage.googleapis.com", seen.RequestUri!.Host, StringComparison.Ordinal);
        Assert.Contains("gemini-2.0-flash:generateContent", seen.RequestUri.AbsoluteUri, StringComparison.Ordinal);
        Assert.True(seen.Headers.Contains("x-goog-api-key"));
        Assert.Equal("AIza-test-key", seen.Headers.GetValues("x-goog-api-key").Single());
        Assert.Null(seen.Headers.Authorization);
    }

    [Fact]
    public async Task Troubleshoot_Gemini_invalid_key_throws_clear_message()
    {
        var handler = new StubHandler(_ => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden)
        {
            Content = new StringContent("{\"error\":{\"message\":\"API key not valid\"}}", Encoding.UTF8, "application/json")
        }));

        var store = new MemoryCredentialStore();
        await store.SaveSecretAsync(AiCredentialKeys.ApiKeyResource, AiCredentialKeys.ApiKeyUserName, "bad");
        var cloud = new CloudAiAssistantService(
            store,
            new AppSettings { AiProvider = AiProviderKind.Gemini },
            new HttpClient(handler));

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            cloud.TroubleshootAsync(new AiTroubleshootRequest { LogLines = ["fail"] }));

        Assert.Contains("HTTP 403", ex.Message, StringComparison.Ordinal);
        Assert.Contains("Gemini", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Troubleshoot_missing_key_throws_before_http()
    {
        var handler = new StubHandler(_ => throw new InvalidOperationException("HTTP should not run"));
        var cloud = new CloudAiAssistantService(
            new MemoryCredentialStore(),
            new AppSettings { AiProvider = AiProviderKind.Gemini },
            new HttpClient(handler));

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            cloud.TroubleshootAsync(new AiTroubleshootRequest { LogLines = ["x"] }));

        Assert.Contains("No API key", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Local_surfaces_cloud_error_then_falls_back()
    {
        var handler = new StubHandler(_ => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Unauthorized)
        {
            Content = new StringContent("nope")
        }));
        var store = new MemoryCredentialStore();
        await store.SaveSecretAsync(AiCredentialKeys.ApiKeyResource, AiCredentialKeys.ApiKeyUserName, "k");
        var settings = new AppSettings { AiProvider = AiProviderKind.Gemini };
        var cloud = new CloudAiAssistantService(store, settings, new HttpClient(handler));
        var local = new LocalAiAssistantService(store, settings, cloud);

        var result = await local.TroubleshootAsync(new AiTroubleshootRequest
        {
            LogLines = ["ERROR: Authentication failed"],
            Protocol = "SFTP"
        });

        Assert.False(result.UsedCloudModel);
        Assert.Contains("Cloud AI", result.Advice, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("fallback", result.Advice, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, Task<HttpResponseMessage>> _responder;

        public StubHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> responder)
            => _responder = responder;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
            => _responder(request);
    }
}
