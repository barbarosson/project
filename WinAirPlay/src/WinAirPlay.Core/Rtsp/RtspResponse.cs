using System.Text;

namespace WinAirPlay.Core.Rtsp;

public sealed class RtspResponse
{
    public RtspResponse(
        int statusCode,
        string reasonPhrase,
        IReadOnlyDictionary<string, string> headers,
        byte[] body)
    {
        StatusCode = statusCode;
        ReasonPhrase = reasonPhrase;
        Headers = headers;
        Body = body;
    }

    public int StatusCode { get; }

    public string ReasonPhrase { get; }

    public IReadOnlyDictionary<string, string> Headers { get; }

    public byte[] Body { get; }

    public bool IsSuccess => StatusCode is >= 200 and < 300;

    public string StatusLine => $"RTSP/1.0 {StatusCode} {ReasonPhrase}";

    public string? this[string header] => Headers.TryGetValue(header, out var value) ? value : null;

    public int? Sequence =>
        int.TryParse(this["CSeq"], out var sequence) ? sequence : null;

    public string? BodyText => Body.Length == 0 ? null : Encoding.UTF8.GetString(Body);

    public override string ToString()
    {
        var builder = new StringBuilder();
        builder.Append(StatusLine).Append("\r\n");

        foreach (var (name, value) in Headers)
        {
            builder.Append(name).Append(": ").Append(value).Append("\r\n");
        }

        builder.Append("\r\n");

        if (BodyText is { } text)
        {
            builder.Append(text);
        }

        return builder.ToString();
    }
}

public sealed class RtspException : Exception
{
    public RtspException(string message, RtspResponse? response = null) : base(message) =>
        Response = response;

    public RtspResponse? Response { get; }
}
