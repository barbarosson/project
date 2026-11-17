using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IStartupManagerService
{
    Task<IReadOnlyList<StartupEntry>> GetStartupEntriesAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Enables or disables a startup entry by moving it to/from a Pure Performance backup location.
    /// Never blindly deletes registry values.
    /// </summary>
    Task<StartupChangeResult> SetEnabledAsync(
        string entryId,
        bool enabled,
        CancellationToken cancellationToken = default);
}

public sealed class StartupChangeResult
{
    public bool Success { get; init; }

    public bool NeedsElevation { get; init; }

    public string Message { get; init; } = string.Empty;
}
