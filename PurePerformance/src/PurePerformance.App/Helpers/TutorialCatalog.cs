namespace PurePerformance.Helpers;

public sealed class TutorialSection
{
    public required string Title { get; init; }
    public required string Steps { get; init; }
}

/// <summary>In-app Help / Tutorial content (English to match the UI).</summary>
public static class TutorialCatalog
{
    public static IReadOnlyList<TutorialSection> Sections { get; } =
    [
        new TutorialSection
        {
            Title = "1. Dashboard",
            Steps =
                "• Open Dashboard from the left navigation.\n" +
                "• Tap Start monitoring to sample CPU, RAM, disk, and GPU (best effort).\n" +
                "• Watch the high-usage process list for spikes — this pane never deletes files.\n" +
                "• Stop monitoring anytime; samples pause until you start again."
        },
        new TutorialSection
        {
            Title = "2. Crash Analyzer (copy)",
            Steps =
                "• Choose Last 24 hours or Last 72 hours, then Scan Event Logs.\n" +
                "• Select a finding to read the plain-English explanation and recommended fix.\n" +
                "• Copy selected or Copy all — text is fully selectable for support tickets.\n" +
                "• Nothing is deleted; the scan only reads Application and System Event Viewer logs.\n" +
                "• With Pro + AI configured, use Suggest fix with AI for an optional second opinion."
        },
        new TutorialSection
        {
            Title = "3. Startup, Cleaner, and Memory",
            Steps =
                "• Startup Optimizer: refresh the list, disable unneeded Run keys / Startup folder items. Disable is reversible (backed up).\n" +
                "• System Cleaner: scan named temp/cache folders only — no registry cleaner, no junk scores. Review targets before cleaning.\n" +
                "• Memory Optimizer: trims working sets on accessible processes (EmptyWorkingSet). Safe to retry; it does not uninstall apps.\n" +
                "• Some actions need Run as administrator — use the elevate button when the page asks."
        },
        new TutorialSection
        {
            Title = "4. Themes and accents",
            Steps =
                "• Open Settings (gear).\n" +
                "• Choose Follow system, Light, or Dark — applied to this window immediately.\n" +
                "• Pick a free accent pack (Windows, Ocean, Forest, Sunset, Slate, Berry) for buttons and highlights.\n" +
                "• Accents are independent of Pro; no restart required."
        },
        new TutorialSection
        {
            Title = "5. Pro features",
            Steps =
                "• Pro panes sit under the Pro header: Scheduled scans, Advanced Crash, Auto rules, Profiles, Alerts, Whitelist / Rules.\n" +
                "• Without Pro, those items open an honest Unlock Pro gate — free tools stay available.\n" +
                "• Unlock via Settings → Unlock Pro… (Store durable add-on). Debug builds may show a labeled local bypass.\n" +
                "• After unlock, reopen the Pro pane from the left navigation."
        },
        new TutorialSection
        {
            Title = "6. AI setup (Pro)",
            Steps =
                "• Unlock Pro, then open Settings → Pro AI assist.\n" +
                "• Set an OpenAI-compatible Base URL, Model, and API key (examples for OpenAI, Groq, Ollama, LM Studio are on that page).\n" +
                "• Save AI settings — the key goes to PasswordVault; URL/model go to local settings.\n" +
                "• Return to Crash Analyzer, select a finding, tap Suggest fix with AI.\n" +
                "• Claude / Gemini native APIs need a compatible proxy; see the AI help note in Settings."
        }
    ];
}
