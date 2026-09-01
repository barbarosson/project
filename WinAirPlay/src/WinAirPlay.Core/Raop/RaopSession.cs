using System.Globalization;
using System.Net;
using System.Net.Sockets;
using WinAirPlay.Core.Discovery;
using WinAirPlay.Core.Rtsp;

namespace WinAirPlay.Core.Raop;

/// <summary>
/// A negotiated RAOP streaming session. Owns the RTSP control connection and the local UDP
/// sockets that Phase 4 will send audio, control and timing packets from.
/// </summary>
public sealed class RaopSession : IAsyncDisposable
{
    private readonly RtspClient _client;
    private readonly string _controlUri;
    private bool _tornDown;

    internal RaopSession(
        RtspClient client,
        AirPlayDevice device,
        string controlUri,
        string sessionId,
        uint announcedSessionId,
        IPAddress localAddress,
        RaopTransport transport,
        UdpClient controlSocket,
        UdpClient timingSocket,
        RaopTimingResponder timingResponder,
        ushort initialSequence,
        uint initialRtpTimestamp,
        int? audioLatency,
        RaopAudioParameters audio,
        RaopMediaFormat mediaFormat,
        RaopEncryptionKeys? encryption)
    {
        MediaFormat = mediaFormat;
        Encryption = encryption;
        _client = client;
        _controlUri = controlUri;
        Device = device;
        SessionId = sessionId;
        AnnouncedSessionId = announcedSessionId;
        LocalAddress = localAddress;
        Transport = transport;
        ControlSocket = controlSocket;
        TimingSocket = timingSocket;
        TimingResponder = timingResponder;
        InitialSequence = initialSequence;
        InitialRtpTimestamp = initialRtpTimestamp;
        AudioLatency = audioLatency;
        Audio = audio;
    }

    public AirPlayDevice Device { get; }

    /// <summary>Session identifier returned by the receiver in the SETUP response.</summary>
    public string SessionId { get; }

    /// <summary>Identifier we generated for the ANNOUNCE URI and SDP origin line.</summary>
    public uint AnnouncedSessionId { get; }

    public IPAddress LocalAddress { get; }

    /// <summary>Ports on the receiver that Phase 4 sends to.</summary>
    public RaopTransport Transport { get; }

    public UdpClient ControlSocket { get; }

    public UdpClient TimingSocket { get; }

    /// <summary>Keeps serving the receiver's clock for as long as the session is alive.</summary>
    public RaopTimingResponder TimingResponder { get; }

    public int LocalControlPort => ((IPEndPoint)ControlSocket.Client.LocalEndPoint!).Port;

    public int LocalTimingPort => ((IPEndPoint)TimingSocket.Client.LocalEndPoint!).Port;

    public ushort InitialSequence { get; }

    public uint InitialRtpTimestamp { get; }

    /// <summary>Buffer the receiver keeps, in samples. Phase 4 uses it to schedule packets.</summary>
    public int? AudioLatency { get; }

    public RaopAudioParameters Audio { get; }

    /// <summary>Codec and RTP payload type the receiver accepted during ANNOUNCE.</summary>
    public RaopMediaFormat MediaFormat { get; }

    /// <summary>AES key announced to the receiver, or <c>null</c> when audio is sent in the clear.</summary>
    public RaopEncryptionKeys? Encryption { get; }

    public IPEndPoint AudioEndPoint => new(Device.Address!, Transport.AudioPort);

    public IPEndPoint RemoteControlEndPoint => new(Device.Address!, Transport.ControlPort);

    public IPEndPoint RemoteTimingEndPoint => new(Device.Address!, Transport.TimingPort);

    /// <param name="decibels">-30 (quiet) to 0 (loud); -144 mutes.</param>
    public async Task SetVolumeAsync(double decibels, CancellationToken cancellationToken = default)
    {
        var request = new RtspRequest("SET_PARAMETER", _controlUri)
            .WithBody(
                $"volume: {decibels.ToString("F6", CultureInfo.InvariantCulture)}\r\n",
                "text/parameters");

        var response = await _client.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (!response.IsSuccess)
        {
            throw new RtspException($"Ses seviyesi ayarlanamadı: {response.StatusLine}", response);
        }
    }

    public async Task TeardownAsync(CancellationToken cancellationToken = default)
    {
        if (_tornDown || !_client.IsConnected)
        {
            return;
        }

        _tornDown = true;

        try
        {
            await _client.SendAsync(new RtspRequest("TEARDOWN", _controlUri), cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception)
        {
            // The receiver often just drops the connection instead of answering TEARDOWN.
        }
    }

    public async ValueTask DisposeAsync()
    {
        await TeardownAsync().ConfigureAwait(false);

        TimingResponder.Dispose();
        ControlSocket.Dispose();
        TimingSocket.Dispose();
        await _client.DisposeAsync().ConfigureAwait(false);
    }
}
