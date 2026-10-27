using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Security;

/// <summary>UI callback for first-connect / changed SFTP host key confirmation.</summary>
public interface ISshHostKeyPrompt
{
    Task<SshHostKeyPromptResult> PromptAsync(
        SshHostKeyPromptRequest request,
        CancellationToken cancellationToken = default);
}

public enum SshHostKeyPromptKind
{
    FirstConnect = 0,
    Mismatch = 1
}

public sealed class SshHostKeyPromptRequest
{
    public required string Host { get; init; }
    public required int Port { get; init; }
    public required string FingerprintSha256 { get; init; }
    public string? KeyType { get; init; }
    public string? PreviousFingerprintSha256 { get; init; }
    public SshHostKeyPromptKind Kind { get; init; }
}

public enum SshHostKeyDecision
{
    Reject = 0,
    AcceptOnce = 1,
    PinAndTrust = 2
}

public sealed class SshHostKeyPromptResult
{
    public required SshHostKeyDecision Decision { get; init; }
}
