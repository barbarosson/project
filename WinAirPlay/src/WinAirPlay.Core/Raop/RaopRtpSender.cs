using System.Buffers;
using System.Diagnostics;
using System.Net.Sockets;
using System.Security.Cryptography;
using WinAirPlay.Core.Audio;

namespace WinAirPlay.Core.Raop;

public sealed class RaopStreamOptions
{
    /// <summary>
    /// How far ahead of the play position audio is timestamped, in samples. The classic AirPlay
    /// value is 88200 (two seconds), which hides almost any Wi-Fi hiccup at the cost of lag; 2205
    /// (50 ms) measured well on a wired-quality network and is the better default here. 0 is allowed
    /// for the lowest possible lag on a stable LAN.
    /// </summary>
    public int LatencySamples { get; set; } = 2205;

    /// <summary>Receivers drift out of sync within a few seconds without these.</summary>
    public TimeSpan SyncInterval { get; set; } = TimeSpan.FromSeconds(1);

    /// <summary>
    /// Overrides the byte order implied by the negotiated codec. Only useful for diagnosing a
    /// receiver that disagrees about L16 endianness.
    /// </summary>
    public bool? ForceBigEndianPayload { get; set; }
}

/// <summary>
/// Wraps captured PCM blocks in RTP packets and sends them to the receiver's audio port, while a
/// background timer keeps the clock anchored through sync packets on the control port.
/// </summary>
public sealed class RaopRtpSender : IAudioSink
{
    /// <summary>
    /// A couple of frames is enough to absorb ALAC encoding time without adding noticeable lag.
    /// </summary>
    private const int SendQueueDepth = 3;

    private readonly RaopSession _session;
    private readonly RaopStreamOptions _options;
    private readonly UdpClient _audioSocket;
    private readonly Stopwatch _clock = Stopwatch.StartNew();
    private readonly TimeSpan _epochOffset;
    private readonly byte[] _packet;
    private readonly byte[] _encoded;
    private readonly IRaopPayloadEncoder _encoder;
    private readonly RaopPacketCipher? _cipher;
    private readonly uint _ssrc;
    private readonly int _framesPerPacket;
    private readonly object _sendLock = new();
    private readonly object _queueLock = new();
    private readonly Queue<byte[]> _sendQueue = new();
    private readonly AutoResetEvent _dataReady = new(false);

    private Thread? _sendThread;
    private volatile bool _sendCompleted;
    private Timer? _syncTimer;
    private ushort _sequence;
    private long _rtpTimestamp;
    private long _packetsSent;
    private long _syncPacketsSent;
    private long _bytesSent;
    private bool _disposed;

    public RaopRtpSender(RaopSession session, AudioFormat format, RaopStreamOptions? options = null)
    {
        _session = session ?? throw new ArgumentNullException(nameof(session));
        Format = format ?? throw new ArgumentNullException(nameof(format));
        _options = options ?? new RaopStreamOptions();

        _framesPerPacket = session.Audio.FramesPerPacket;
        PayloadLength = _framesPerPacket * format.BytesPerFrame;

        if (session.Audio.SampleRate != format.SampleRate || session.Audio.Channels != format.Channels)
        {
            throw new ArgumentException(
                $"Oturum {session.Audio.SampleRate} Hz/{session.Audio.Channels}ch bekliyor, yakalama {format}.",
                nameof(format));
        }

        _encoder = RaopPayloadEncoder.Create(session.MediaFormat, session.Audio, _options.ForceBigEndianPayload);
        _cipher = session.Encryption is { } keys ? new RaopPacketCipher(keys) : null;

        var maxEncoded = _encoder.GetMaxEncodedLength(PayloadLength);
        _encoded = new byte[maxEncoded];
        _packet = new byte[RtpAudioPacket.HeaderLength + maxEncoded];
        _ssrc = BitConverter.ToUInt32(RandomNumberGenerator.GetBytes(4));
        _sequence = session.InitialSequence;
        _rtpTimestamp = session.InitialRtpTimestamp;
        _epochOffset = DateTime.UtcNow - NtpTimestamp.Epoch;

        _audioSocket = new UdpClient(0, AddressFamily.InterNetwork);
    }

    public AudioFormat Format { get; }

    /// <summary>Exact PCM block size <see cref="Write"/> expects, matching one RTP packet.</summary>
    public int PayloadLength { get; }

    public RaopStreamCodec Codec => _encoder.Codec;

    public bool IsEncrypted => _cipher is not null;

    public long PacketsSent => Interlocked.Read(ref _packetsSent);

    public long SyncPacketsSent => Interlocked.Read(ref _syncPacketsSent);

    public long BytesSent => Interlocked.Read(ref _bytesSent);

    /// <summary>Audio sent so far, which also equals how far the stream clock has advanced.</summary>
    public TimeSpan StreamPosition => Format.DurationOf(PacketsSent * PayloadLength);

    public TimeSpan TargetLatency => TimeSpan.FromSeconds((double)_options.LatencySamples / Format.SampleRate);

    public Exception? LastError { get; private set; }

    public event EventHandler<Exception>? SendFailed;

    /// <summary>Sends the first sync packet and starts the periodic ones.</summary>
    public void Start()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (_syncTimer is not null)
        {
            return;
        }

        _sendThread = new Thread(SendLoop)
        {
            IsBackground = true,
            Name = "WinAirPlay.RtpSend",
            Priority = ThreadPriority.AboveNormal,
        };
        _sendThread.Start();

        SendSync(isFirst: true);
        _syncTimer = new Timer(_ => SendSync(isFirst: false), null, _options.SyncInterval, _options.SyncInterval);
    }

    /// <summary>
    /// Copies the PCM block and returns immediately so capture never waits on ALAC or the network.
    /// </summary>
    public void Write(ReadOnlySpan<byte> pcm)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (pcm.Length != PayloadLength)
        {
            throw new ArgumentException(
                $"Block must be {PayloadLength} bytes, got {pcm.Length} bytes.", nameof(pcm));
        }

        // ArrayPool.Rent may return a buffer larger than requested. Only PayloadLength bytes are
        // meaningful; SendLoop must slice or the encoder writes past _encoded and kills the process.
        var block = ArrayPool<byte>.Shared.Rent(PayloadLength);
        pcm.CopyTo(block.AsSpan(0, PayloadLength));

        lock (_queueLock)
        {
            if (_disposed || _sendCompleted)
            {
                ArrayPool<byte>.Shared.Return(block);
                return;
            }

            _sendQueue.Enqueue(block);

            while (_sendQueue.Count > SendQueueDepth)
            {
                ArrayPool<byte>.Shared.Return(_sendQueue.Dequeue());
            }
        }

        _dataReady.Set();
    }

    private void SendLoop()
    {
        try
        {
            while (true)
            {
                byte[]? block = null;

                lock (_queueLock)
                {
                    if (_sendQueue.Count > 0)
                    {
                        block = _sendQueue.Dequeue();
                    }
                    else if (_sendCompleted || _disposed)
                    {
                        return;
                    }
                }

                if (block is null)
                {
                    _dataReady.WaitOne();
                    continue;
                }

                try
                {
                    if (!_disposed)
                    {
                        SendBlock(block.AsSpan(0, PayloadLength));
                    }
                }
                catch (Exception ex)
                {
                    LastError = ex;
                    RaiseSendFailed(ex);
                    return;
                }
                finally
                {
                    ArrayPool<byte>.Shared.Return(block);
                }
            }
        }
        catch (Exception ex)
        {
            LastError = ex;
            RaiseSendFailed(ex);
        }
    }

    private void SendBlock(ReadOnlySpan<byte> pcm)
    {
        lock (_sendLock)
        {
            var timestamp = (uint)Interlocked.Read(ref _rtpTimestamp);

            RtpAudioPacket.WriteHeader(
                _packet,
                _session.MediaFormat.PayloadType,
                _sequence,
                timestamp,
                _ssrc,
                marker: _packetsSent == 0);

            var encodedLength = _encoder.Encode(pcm, _encoded);
            var payload = _packet.AsSpan(RtpAudioPacket.HeaderLength);

            if (_cipher is not null)
            {
                _cipher.Encrypt(_encoded.AsSpan(0, encodedLength), payload);
            }
            else
            {
                _encoded.AsSpan(0, encodedLength).CopyTo(payload);
            }

            var packetLength = RtpAudioPacket.HeaderLength + encodedLength;

            try
            {
                _audioSocket.Send(_packet, packetLength, _session.AudioEndPoint);
            }
            catch (Exception ex)
            {
                LastError = ex;
                RaiseSendFailed(ex);
                return;
            }

            _sequence++;
            Interlocked.Add(ref _rtpTimestamp, _framesPerPacket);
            Interlocked.Increment(ref _packetsSent);
            Interlocked.Add(ref _bytesSent, packetLength);
        }
    }

    /// <summary>
    /// Tells the receiver which RTP timestamp is playing right now, so it can schedule the audio
    /// it has buffered. The gap between the two timestamps is the stream latency.
    /// </summary>
    private void SendSync(bool isFirst)
    {
        if (_disposed)
        {
            return;
        }

        var next = (uint)Interlocked.Read(ref _rtpTimestamp);
        var playing = unchecked(next - (uint)_options.LatencySamples);
        var packet = RaopSyncPacket.Build(playing, CurrentNtp(), next, isFirst);

        try
        {
            _session.ControlSocket.Send(packet, packet.Length, _session.RemoteControlEndPoint);
            Interlocked.Increment(ref _syncPacketsSent);
        }
        catch (Exception ex)
        {
            LastError = ex;
            RaiseSendFailed(ex);
        }
    }

    private void RaiseSendFailed(Exception exception)
    {
        try
        {
            SendFailed?.Invoke(this, exception);
        }
        catch (Exception)
        {
            // A subscriber must never take the RTP thread down with it.
        }
    }

    private ulong CurrentNtp() => NtpTimestamp.FromTimeSpanSinceEpoch(_epochOffset + _clock.Elapsed);

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _sendCompleted = true;
        _dataReady.Set();
        _syncTimer?.Dispose();

        var sendThreadFinished = true;
        if (_sendThread is { IsAlive: true } thread)
        {
            sendThreadFinished = thread.Join(TimeSpan.FromSeconds(2));
        }

        if (sendThreadFinished)
        {
            lock (_queueLock)
            {
                while (_sendQueue.Count > 0)
                {
                    ArrayPool<byte>.Shared.Return(_sendQueue.Dequeue());
                }
            }

            _dataReady.Dispose();
        }

        _cipher?.Dispose();
        _audioSocket.Dispose();
    }
}
