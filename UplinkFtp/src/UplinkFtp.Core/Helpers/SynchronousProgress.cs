using System;

namespace UplinkFtp.Helpers;

/// <summary>
/// <see cref="IProgress{T}"/> that invokes the handler on the calling thread.
/// Prefer this over <see cref="Progress{T}"/> inside transfer workers so byte offsets
/// are visible immediately for pause/resume (Progress may post to a sync context).
/// </summary>
public sealed class SynchronousProgress<T> : IProgress<T>
{
    private readonly Action<T> _handler;

    public SynchronousProgress(Action<T> handler)
    {
        _handler = handler ?? throw new ArgumentNullException(nameof(handler));
    }

    public void Report(T value) => _handler(value);
}
