namespace WinAirPlay.Core.Raop;

/// <summary>
/// Sends periodic RTSP keepalive requests so the receiver does not tear down the session while
/// RTP audio keeps flowing. HomePod and most RAOP receivers drop the control channel after ~30 s
/// of RTSP idle and fade the audio out even though UDP packets still arrive.
/// </summary>
public sealed class RaopSessionKeepAlive : IDisposable
{
    /// <summary>
    /// Well under the ~30 s timeout observed on HomePod / AirPort Express, with headroom for jitter.
    /// </summary>
    public static TimeSpan DefaultInterval { get; } = TimeSpan.FromSeconds(10);

    private readonly Func<CancellationToken, Task> _sendKeepAlive;
    private readonly TimeSpan _interval;
    private readonly object _gate = new();
    private Timer? _timer;
    private int _inFlight;
    private bool _disposed;

    public RaopSessionKeepAlive(RaopSession session, TimeSpan? interval = null)
        : this(session.SendKeepAliveAsync, interval)
    {
    }

    internal RaopSessionKeepAlive(Func<CancellationToken, Task> sendKeepAlive, TimeSpan? interval = null)
    {
        _sendKeepAlive = sendKeepAlive ?? throw new ArgumentNullException(nameof(sendKeepAlive));
        _interval = interval ?? DefaultInterval;
    }

    public event EventHandler<Exception>? KeepAliveFailed;

    public void Start()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        lock (_gate)
        {
            if (_timer is not null)
            {
                return;
            }

            // Fire immediately so the first idle window never hits the receiver timeout.
            _timer = new Timer(_ => _ = SendAsync(), null, TimeSpan.Zero, _interval);
        }
    }

    public void Dispose()
    {
        lock (_gate)
        {
            if (_disposed)
            {
                return;
            }

            _disposed = true;
            _timer?.Dispose();
            _timer = null;
        }
    }

    private async Task SendAsync()
    {
        if (_disposed || Interlocked.CompareExchange(ref _inFlight, 1, 0) != 0)
        {
            return;
        }

        try
        {
            await _sendKeepAlive(CancellationToken.None).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            KeepAliveFailed?.Invoke(this, ex);
        }
        finally
        {
            Interlocked.Exchange(ref _inFlight, 0);
        }
    }
}
