namespace HaSetup.Core.HomeAssistant;

public sealed record HaHealthResult(
    bool IsReachable,
    int? StatusCode,
    string Message,
    TimeSpan Elapsed)
{
    public static HaHealthResult Unreachable(string message, TimeSpan elapsed) =>
        new(false, null, message, elapsed);
}
