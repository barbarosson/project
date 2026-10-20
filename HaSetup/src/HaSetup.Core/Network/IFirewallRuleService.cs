namespace HaSetup.Core.Network;

public interface IFirewallRuleService
{
    /// <summary>
    /// Ensures inbound allow rules for 8123/TCP, 5353/UDP, and 1900/UDP (UAC elevation on Windows).
    /// </summary>
    Task<FirewallRuleResult> EnsureHaDiscoveryRulesAsync(CancellationToken cancellationToken = default);
}

public sealed record FirewallRuleResult(bool Succeeded, string Message, string? Detail = null);
