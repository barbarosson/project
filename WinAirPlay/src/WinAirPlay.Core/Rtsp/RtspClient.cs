using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;

namespace WinAirPlay.Core.Rtsp;

public enum RtspTraceDirection
{
    Sent,
    Received,
}

public sealed record RtspTrace(RtspTraceDirection Direction, string Text, TimeSpan Elapsed);

/// <summary>
/// Minimal RTSP/1.0 client over a persistent TCP connection: enough for the RAOP handshake.
/// Every exchange is surfaced through <see cref="Traced"/> so the console can show the dialogue.
/// </summary>
public sealed class RtspClient : IAsyncDisposable
{
    private readonly TimeSpan _timeout;
    private readonly SemaphoreSlim _exchangeLock = new(1, 1);

    private TcpClient? _tcp;
    private NetworkStream? _stream;
    private int _sequence;

    public RtspClient(TimeSpan? timeout = null) => _timeout = timeout ?? TimeSpan.FromSeconds(10);

    public event EventHandler<RtspTrace>? Traced;

    /// <summary>Added to every request unless the request already carries the header.</summary>
    public List<KeyValuePair<string, string>> DefaultHeaders { get; } = new();

    /// <summary>Set from the SETUP response; echoed on every later request.</summary>
    public string? SessionId { get; set; }

    public IPEndPoint? LocalEndPoint => _tcp?.Client.LocalEndPoint as IPEndPoint;

    public IPEndPoint? RemoteEndPoint => _tcp?.Client.RemoteEndPoint as IPEndPoint;

    public bool IsConnected => _tcp?.Connected == true;

    public async Task ConnectAsync(IPEndPoint endPoint, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(endPoint);

        if (_tcp is not null)
        {
            throw new InvalidOperationException("This client is already connected.");
        }

        var tcp = new TcpClient(endPoint.AddressFamily) { NoDelay = true };

        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutSource.CancelAfter(_timeout);

        try
        {
            await tcp.ConnectAsync(endPoint.Address, endPoint.Port, timeoutSource.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            tcp.Dispose();
            throw new RtspException($"Could not connect to {endPoint} within {_timeout.TotalSeconds:F0} seconds.");
        }
        catch (SocketException ex)
        {
            tcp.Dispose();
            throw new RtspException($"Could not connect to {endPoint}: {ex.Message}");
        }

        _tcp = tcp;
        _stream = tcp.GetStream();
        _sequence = 0;
    }

    public async Task<RtspResponse> SendAsync(RtspRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (_stream is null)
        {
            throw new InvalidOperationException("Call ConnectAsync before sending a request.");
        }

        await _exchangeLock.WaitAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            ApplyStandardHeaders(request);

            using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutSource.CancelAfter(_timeout);

            var stopwatch = Stopwatch.StartNew();

            await _stream.WriteAsync(request.ToBytes(), timeoutSource.Token).ConfigureAwait(false);
            await _stream.FlushAsync(timeoutSource.Token).ConfigureAwait(false);
            Traced?.Invoke(this, new RtspTrace(RtspTraceDirection.Sent, request.ToString(), stopwatch.Elapsed));

            RtspResponse response;
            try
            {
                response = await ReadResponseAsync(timeoutSource.Token).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                throw new RtspException(
                    $"{request.Method} did not get a response within {_timeout.TotalSeconds:F0} seconds.");
            }

            stopwatch.Stop();
            Traced?.Invoke(this, new RtspTrace(RtspTraceDirection.Received, response.ToString(), stopwatch.Elapsed));

            return response;
        }
        finally
        {
            _exchangeLock.Release();
        }
    }

    private void ApplyStandardHeaders(RtspRequest request)
    {
        if (request.GetHeader("CSeq") is null)
        {
            request.Headers.Insert(0, new KeyValuePair<string, string>(
                "CSeq", (++_sequence).ToString()));
        }

        foreach (var (name, value) in DefaultHeaders)
        {
            if (request.GetHeader(name) is null)
            {
                request.WithHeader(name, value);
            }
        }

        if (SessionId is not null && request.GetHeader("Session") is null)
        {
            request.WithHeader("Session", SessionId);
        }
    }

    private async Task<RtspResponse> ReadResponseAsync(CancellationToken cancellationToken)
    {
        var stream = _stream!;
        var buffer = new byte[4096];
        var accumulated = new List<byte>(4096);
        int headerEnd;

        while ((headerEnd = FindHeaderEnd(accumulated)) < 0)
        {
            var read = await stream.ReadAsync(buffer, cancellationToken).ConfigureAwait(false);
            if (read == 0)
            {
                throw new RtspException("The connection was closed before a response arrived.");
            }

            accumulated.AddRange(buffer[..read]);
        }

        var raw = accumulated.ToArray();
        var (statusCode, reasonPhrase, headers) = RtspMessageParser.ParseHead(
            Encoding.UTF8.GetString(raw, 0, headerEnd));

        var bodyStart = headerEnd + 4;
        var contentLength =
            headers.TryGetValue("Content-Length", out var rawLength) && int.TryParse(rawLength, out var length)
                ? length
                : 0;

        var body = new byte[contentLength];
        var copied = Math.Min(contentLength, raw.Length - bodyStart);
        Array.Copy(raw, bodyStart, body, 0, copied);

        while (copied < contentLength)
        {
            var read = await stream.ReadAsync(body.AsMemory(copied), cancellationToken).ConfigureAwait(false);
            if (read == 0)
            {
                throw new RtspException("The response body was truncated.");
            }

            copied += read;
        }

        return new RtspResponse(statusCode, reasonPhrase, headers, body);
    }

    private static int FindHeaderEnd(List<byte> data)
    {
        for (var i = 0; i + 3 < data.Count; i++)
        {
            if (data[i] == '\r' && data[i + 1] == '\n' && data[i + 2] == '\r' && data[i + 3] == '\n')
            {
                return i;
            }
        }

        return -1;
    }

    public ValueTask DisposeAsync()
    {
        _stream?.Dispose();
        _tcp?.Dispose();
        _stream = null;
        _tcp = null;
        _exchangeLock.Dispose();

        return ValueTask.CompletedTask;
    }
}
