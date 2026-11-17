namespace PurePerformance.Services;

/// <summary>Local credential storage for optional Pro AI settings — never logs secret values.</summary>
public interface ISecureCredentialStore
{
    bool TryGetSecret(string key, out string? value);

    void SetSecret(string key, string value);

    void RemoveSecret(string key);

    bool HasSecret(string key);
}
