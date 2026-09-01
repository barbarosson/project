using System.Text;

namespace WinAirPlay.Core.Rtsp;

/// <summary>
/// An RTSP/1.0 request. The wire format is HTTP-like but the protocol token differs, so
/// <see cref="System.Net.Http.HttpClient"/> cannot be used.
/// </summary>
public sealed class RtspRequest
{
    public RtspRequest(string method, string uri)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(method);
        ArgumentException.ThrowIfNullOrWhiteSpace(uri);

        Method = method.ToUpperInvariant();
        Uri = uri;
    }

    public string Method { get; }

    public string Uri { get; }

    /// <summary>Insertion order is preserved so traces read the same way every run.</summary>
    public List<KeyValuePair<string, string>> Headers { get; } = new();

    public byte[]? Body { get; private set; }

    public string? ContentType { get; private set; }

    public RtspRequest WithHeader(string name, string value)
    {
        Headers.Add(new KeyValuePair<string, string>(name, value));
        return this;
    }

    public RtspRequest WithBody(string body, string contentType)
    {
        Body = Encoding.UTF8.GetBytes(body);
        ContentType = contentType;
        return this;
    }

    public string? GetHeader(string name) => Headers
        .FirstOrDefault(h => string.Equals(h.Key, name, StringComparison.OrdinalIgnoreCase))
        .Value;

    /// <summary>Renders the request exactly as it goes on the wire, including the body.</summary>
    public override string ToString()
    {
        var builder = new StringBuilder();
        builder.Append(Method).Append(' ').Append(Uri).Append(" RTSP/1.0\r\n");

        foreach (var (name, value) in Headers)
        {
            builder.Append(name).Append(": ").Append(value).Append("\r\n");
        }

        if (Body is { Length: > 0 })
        {
            builder.Append("Content-Type: ").Append(ContentType).Append("\r\n");
            builder.Append("Content-Length: ").Append(Body.Length).Append("\r\n");
        }

        builder.Append("\r\n");

        if (Body is { Length: > 0 })
        {
            builder.Append(Encoding.UTF8.GetString(Body));
        }

        return builder.ToString();
    }

    public byte[] ToBytes() => Encoding.UTF8.GetBytes(ToString());
}
