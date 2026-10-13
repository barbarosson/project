namespace UplinkFtp.Services.Assist;

/// <summary>Parsed connection fields from a URI or host line (local smart assist).</summary>
public sealed class ConnectionAssistParseResult
{
    public string? Host { get; init; }
    public int? Port { get; init; }
    public string? Protocol { get; init; }
    public string? Username { get; init; }
    public string? Password { get; init; }
    public string? RemotePath { get; init; }
    public string Summary { get; init; } = string.Empty;
    public bool Success { get; init; }
}

/// <summary>Heuristic diagnosis from log / error text.</summary>
public sealed class ConnectionAssistDiagnosis
{
    public string Title { get; init; } = string.Empty;
    public string Advice { get; init; } = string.Empty;
    public string? SuggestedProtocol { get; init; }
    public int? SuggestedPort { get; init; }
}
