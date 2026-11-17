namespace PurePerformance.Helpers;

/// <summary>
/// Static copy for Settings → Pro AI assist. Keep in sync with OpenAiCompatibleAssistService.
/// </summary>
public static class AiSetupHelp
{
    public const string Summary =
        "Pro AI assist calls an OpenAI-compatible Chat Completions API that you configure. " +
        "The app posts to {Base URL}/chat/completions with your model name and Bearer API key. " +
        "Nothing is sent until you tap “Suggest fix with AI” on a Crash Analyzer finding.";

    public const string FieldGuide =
        "Base URL — the API root that already includes /v1 (or your provider’s equivalent). " +
        "Do not paste the full /chat/completions path unless your proxy requires it; the app appends that segment when missing.\n\n" +
        "Model — exact model id your provider expects (for example gpt-4o-mini, llama-3.3-70b-versatile, or a local tag).\n\n" +
        "API key — stored only in Windows PasswordVault on this PC. Leave the password box blank when saving if you only want to change URL/model.";

    public const string Examples =
        "OpenAI\n" +
        "  Base URL: https://api.openai.com/v1\n" +
        "  Model: gpt-4o-mini (or another chat model you have access to)\n" +
        "  API key: sk-… from platform.openai.com\n\n" +
        "Groq\n" +
        "  Base URL: https://api.groq.com/openai/v1\n" +
        "  Model: llama-3.3-70b-versatile (or any Groq chat model id)\n" +
        "  API key: from console.groq.com\n\n" +
        "Ollama (local)\n" +
        "  Base URL: http://127.0.0.1:11434/v1\n" +
        "  Model: the tag you pulled (example: llama3.2)\n" +
        "  API key: any non-empty placeholder if Ollama ignores auth (some builds require a value)\n\n" +
        "LM Studio (local OpenAI server)\n" +
        "  Base URL: http://127.0.0.1:1234/v1\n" +
        "  Model: the loaded model id shown in LM Studio\n" +
        "  API key: often lm-studio or any placeholder the server accepts";

    public const string ProviderNote =
        "Claude (Anthropic) and Gemini (Google) native APIs are not OpenAI-compatible. " +
        "To use them here you need a compatible proxy or gateway that exposes /v1/chat/completions " +
        "(for example OpenRouter, LiteLLM, or a self-hosted adapter). Point Base URL at that proxy and use the model id it documents.";

    public const string PrivacyNote =
        "Crash excerpts you choose to analyze are sent only to the Base URL you set. " +
        "The app never ships with a built-in key and does not forward calls through Modulus servers.";
}
