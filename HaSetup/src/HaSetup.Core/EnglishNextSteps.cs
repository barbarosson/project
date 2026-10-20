namespace HaSetup.Core;

/// <summary>
/// English onboarding copy shown in the next-steps panel.
/// </summary>
public static class EnglishNextSteps
{
    public const string Title = "Next steps (local hub)";

    public static string Body { get; } =
        """
        1) In your browser, open http://localhost:8123 and create an admin account.

        2) Finish location / language / unit settings.

        3) Add your first integrations: Settings → Devices & services → Add integration
           (e.g. Shelly, Tuya, some Wi‑Fi / cloud bridges — some need an account).
           Apple HomeKit devices (HomePod, Apple TV) cannot pair on Windows Docker
           (mDNS / NAT limitation) — even with a known IP. See Network & discovery.

        4) From your phone on the same Wi‑Fi, open http://<PC-IP>:8123
           (if Windows Firewall prompts, choose Allow).

        5) Out of scope: Apple HomeKit, Zigbee USB sticks, add-on stores, cloud tunnels.
           This app is a container manager — not a whole-home device bridge.

        Config persists in Docker volume “smart-home-ha-config”.
        """;
}
