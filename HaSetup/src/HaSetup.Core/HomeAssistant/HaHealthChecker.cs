using System.Diagnostics;
using HaSetup.Core.Diagnostics;

namespace HaSetup.Core.HomeAssistant;

public interface IHaHealthChecker
{
    Task<HaHealthResult> CheckAsync(
        Uri? url = null,
        TimeSpan? timeout = null,
        CancellationToken cancellationToken = default);
}

public sealed class HaHealthChecker : IHaHealthChecker
{
    private readonly HttpClient _httpClient;

    public HaHealthChecker(HttpClient? httpClient = null)
    {
        _httpClient = httpClient ?? new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(5),
        };
    }

    public async Task<HaHealthResult> CheckAsync(
        Uri? url = null,
        TimeSpan? timeout = null,
        CancellationToken cancellationToken = default)
    {
        var target = url ?? new Uri(HaConstants.LocalUrl);
        var sw = Stopwatch.StartNew();

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            if (timeout is not null)
            {
                cts.CancelAfter(timeout.Value);
            }

            using var response = await _httpClient.GetAsync(target, HttpCompletionOption.ResponseHeadersRead, cts.Token)
                .ConfigureAwait(false);
            sw.Stop();

            var code = (int)response.StatusCode;
            // HA returns 200 (ready) or 302/401 during early boot / auth — treat 2xx–4xx as "up".
            if (code is >= 200 and < 500)
            {
                return new HaHealthResult(
                    IsReachable: true,
                    StatusCode: code,
                    Message: $"Local hub is responding (HTTP {code}).",
                    Elapsed: sw.Elapsed);
            }

            return new HaHealthResult(
                IsReachable: false,
                StatusCode: code,
                Message: $"Unexpected response: HTTP {code}.",
                Elapsed: sw.Elapsed);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            sw.Stop();
            return HaHealthResult.Unreachable("Timed out — the local hub may not be ready yet.", sw.Elapsed);
        }
        catch (HttpRequestException ex)
        {
            sw.Stop();
            return HaHealthResult.Unreachable(
                FriendlyErrorHandler.ToUserMessage(
                    ex.Message,
                    "Unreachable. If the container just started, wait 1–2 minutes."),
                sw.Elapsed);
        }
        catch (Exception ex)
        {
            sw.Stop();
            return HaHealthResult.Unreachable(FriendlyErrorHandler.ToUserMessage(ex, "Health check failed."), sw.Elapsed);
        }
    }
}
