using System.Diagnostics;
using System.Net;
using System.Net.Sockets;

namespace WinAirPlay.Core.Raop;

/// <summary>
/// Answers the receiver's NTP timing requests on the local timing port. AirPlay receivers stall
/// the SETUP response until the sender proves it can serve the clock, so this must run before the
/// handshake continues.
/// </summary>
public sealed class RaopTimingResponder : IDisposable
{
    private readonly UdpClient _socket;
    private readonly CancellationTokenSource _cts = new();
    private readonly Stopwatch _clock = Stopwatch.StartNew();
    private readonly TimeSpan _epochOffset;

    private Task? _loop;
    private long _requestCount;
    private bool _disposed;

    public RaopTimingResponder(UdpClient socket)
    {
        _socket = socket ?? throw new ArgumentNullException(nameof(socket));
        _epochOffset = DateTime.UtcNow - NtpTimestamp.Epoch;
    }

    public long RequestCount => Interlocked.Read(ref _requestCount);

    public IPEndPoint? LastRequestFrom { get; private set; }

    public event EventHandler<IPEndPoint>? RequestAnswered;

    public void Start()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        _loop ??= Task.Run(() => ReceiveLoopAsync(_cts.Token));
    }

    private async Task ReceiveLoopAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            UdpReceiveResult received;

            try
            {
                received = await _socket.ReceiveAsync(cancellationToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (SocketException)
            {
                continue;
            }
            catch (ObjectDisposedException)
            {
                return;
            }

            var receivedAt = CurrentNtp();

            if (!RtpTimingPacket.IsTimingRequest(received.Buffer))
            {
                continue;
            }

            var originate = RtpTimingPacket.ReadTransmitTimestamp(received.Buffer);
            var reply = RtpTimingPacket.BuildReply(originate, receivedAt, CurrentNtp());

            try
            {
                await _socket.SendAsync(reply, received.RemoteEndPoint, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception)
            {
                continue;
            }

            Interlocked.Increment(ref _requestCount);
            LastRequestFrom = received.RemoteEndPoint;
            RequestAnswered?.Invoke(this, received.RemoteEndPoint);
        }
    }

    /// <summary>
    /// Wall-clock time is read once and advanced with a monotonic timer, so NTP replies stay
    /// consistent even if Windows adjusts the system clock mid-stream.
    /// </summary>
    private ulong CurrentNtp() => NtpTimestamp.FromTimeSpanSinceEpoch(_epochOffset + _clock.Elapsed);

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _cts.Cancel();
        _cts.Dispose();
    }
}
