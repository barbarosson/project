namespace HaSetup.Core.HomeAssistant;

public enum HaLifecycleState
{
    Unknown,
    NotCreated,
    Created,
    Running,
    Exited,
    Restarting,
    Paused,
    Dead,
    Removing,
}

public sealed record HaContainerInfo(
    HaLifecycleState State,
    string? ContainerId,
    string? StatusText,
    string? Image,
    bool Exists)
{
    public static HaContainerInfo Missing { get; } = new(
        HaLifecycleState.NotCreated,
        ContainerId: null,
        StatusText: "Yok",
        Image: null,
        Exists: false);
}
