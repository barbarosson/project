using Windows.Security.Credentials;

namespace PurePerformance.Services;

/// <summary>
/// Stores secrets in the Windows PasswordVault (per-user, local).
/// Values are never written to user-settings.json.
/// </summary>
public sealed class PasswordVaultCredentialStore : ISecureCredentialStore
{
    private const string ResourcePrefix = "PurePerformance/";

    public bool TryGetSecret(string key, out string? value)
    {
        value = null;
        try
        {
            var vault = new PasswordVault();
            var cred = vault.Retrieve(ResourcePrefix + key, "default");
            cred.RetrievePassword();
            value = cred.Password;
            return !string.IsNullOrEmpty(value);
        }
        catch
        {
            return false;
        }
    }

    public void SetSecret(string key, string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            RemoveSecret(key);
            return;
        }

        var vault = new PasswordVault();
        var resource = ResourcePrefix + key;
        try
        {
            // Remove prior entry so updates replace cleanly.
            var existing = vault.FindAllByResource(resource);
            foreach (var c in existing)
            {
                vault.Remove(c);
            }
        }
        catch
        {
            // No prior secret.
        }

        vault.Add(new PasswordCredential(resource, "default", value.Trim()));
    }

    public void RemoveSecret(string key)
    {
        try
        {
            var vault = new PasswordVault();
            var existing = vault.FindAllByResource(ResourcePrefix + key);
            foreach (var c in existing)
            {
                vault.Remove(c);
            }
        }
        catch
        {
            // Already absent.
        }
    }

    public bool HasSecret(string key) => TryGetSecret(key, out _);
}
