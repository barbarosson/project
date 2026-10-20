namespace HaSetup.Core;

/// <summary>
/// English onboarding copy shown in the next-steps panel.
/// </summary>
public static class EnglishNextSteps
{
    public const string Title = "Next steps (Home Assistant)";

    public static string Body { get; } =
        """
        1) In your browser, open http://localhost:8123 and create an admin account.

        2) Finish location / language / unit settings.

        3) Add your first integrations: Settings → Devices & services → Add integration
           (e.g. Google Cast, Shelly, Tuya — some need an account).

        4) From your phone on the same Wi‑Fi, open http://<PC-IP>:8123
           (if Windows Firewall prompts, choose Allow).

        5) Zigbee USB sticks, the add-on store, and cloud tunnels are out of scope for this MVP.

        Config persists in Docker volume “smart-home-ha-config”.
        """;
}
