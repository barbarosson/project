namespace HaSetup.Core.Network;

/// <summary>
/// English copy for the Network &amp; device discovery panel.
/// </summary>
public static class NetworkDiscoveryGuidance
{
    public const string TabTitle = "Network & discovery";

    public const string PanelTitle = "Network & device discovery";

    public const string WhyAutoDiscoveryFails =
        "Many smart-home devices advertise themselves with mDNS (Bonjour) or SSDP/UPnP broadcasts. " +
        "Docker Desktop on Windows uses WSL2 networking: containers sit behind a NAT, so those discovery packets " +
        "often never reach the local hub container. Auto-discovery can look “broken” even when the hub itself is healthy on port 8123.";

    public const string ManualIpGuideTitle = "Manual IP setup (Philips Hue and similar)";

    public const string ManualIpGuideBody =
        "1. Open your router’s device list (or the Hue app) and note the bridge / device LAN IP.\n" +
        "2. In the local hub UI, add the integration and choose the option to enter the IP manually.\n" +
        "3. Prefer a DHCP reservation so the IP stays stable.\n" +
        "4. Ensure Windows Firewall allows the hub ports (use Add firewall rules below), then retry the integration.";

    public const string FirewallSectionTitle = "Windows Firewall (Free)";

    public const string FirewallSectionBody =
        "Adds inbound allow rules for the local hub UI (8123/TCP) and common discovery traffic (5353/UDP mDNS, 1900/UDP SSDP). " +
        "Windows will show a User Account Control (UAC) prompt — approve to apply the rules.";

    public const string FirewallButtonLabel = "Add firewall rules (UAC)";

    public const string MdnsSectionTitle = "mDNS helper (Experimental · Premium)";

    public const string MdnsSectionBody =
        "Optional host→WSL UDP forwarder for mDNS. This is experimental, Premium-locked, and off by default. " +
        "It may be fragile on some Docker Desktop / WSL2 setups — leave it disabled unless you need it.";

    public const string MdnsToggleLabel = "Enable mDNS helper (Experimental)";

    public const string PremiumLockHint = "Premium required — unlock in Microsoft Store or use Simulate premium (dev build).";
}
