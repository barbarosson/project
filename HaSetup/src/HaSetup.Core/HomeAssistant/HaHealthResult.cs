namespace HaSetup.Core.HomeAssistant;

public sealed record HaHealthResult(
    bool IsReachable,
    int? StatusCode,
    string MessageTr,
    TimeSpan Elapsed)
{
    public static HaHealthResult Unreachable(string messageTr, TimeSpan elapsed) =>
        new(false, null, messageTr, elapsed);
}
