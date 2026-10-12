namespace UplinkFtp.Services.Ai;

/// <summary>Credential Locker resource keys for AI BYOK secrets.</summary>
public static class AiCredentialKeys
{
    /// <summary>PasswordVault / DPAPI resource for the user-supplied LLM API key.</summary>
    public const string ApiKeyResource = "ai.apiKey";

    /// <summary>Username slot paired with <see cref="ApiKeyResource"/> (provider id).</summary>
    public const string ApiKeyUserName = "uplink-ai";
}
