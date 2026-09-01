using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using WinAirPlay.Core.Discovery;
using WinAirPlay.Core.Rtsp;

namespace WinAirPlay.Core.Raop;

public sealed class RaopHandshakeOptions
{
    /// <summary>Receivers gate features on the client version string, so it is worth faking iTunes.</summary>
    public string UserAgent { get; set; } = "AirPlay/366.0";

    public RaopAudioParameters Audio { get; set; } = RaopAudioParameters.Default;

    public RaopStreamCodec Codec { get; set; } = RaopStreamCodec.AppleLossless;

    /// <summary>
    /// Wraps an AES key into the ANNOUNCE body and encrypts every payload. Receivers that advertise
    /// no encryption requirement accept plain audio, so this stays off unless asked for.
    /// </summary>
    public bool UseEncryption { get; set; }

    public RaopMediaFormat MediaFormat => RaopMediaFormat.For(Codec, Audio);

    public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(10);

    /// <summary>Volume applied right after RECORD, in dB. <c>null</c> leaves it untouched.</summary>
    public double? InitialVolumeDb { get; set; } = -20;
}

public interface IRaopHandshake
{
    event EventHandler<RtspTrace>? Traced;

    Task<RaopSession> ConnectAsync(AirPlayDevice device, CancellationToken cancellationToken = default);
}

/// <summary>
/// Performs the RAOP control dialogue: OPTIONS → ANNOUNCE → SETUP → RECORD. On success the
/// receiver has allocated its audio, control and timing ports and is waiting for RTP.
/// </summary>
public sealed class RaopHandshake : IRaopHandshake
{
    private readonly RaopHandshakeOptions _options;

    public RaopHandshake(RaopHandshakeOptions? options = null) => _options = options ?? new RaopHandshakeOptions();

    public event EventHandler<RtspTrace>? Traced;

    /// <summary>Raised when the receiver's clock request is answered; useful to see timing works.</summary>
    public event EventHandler<IPEndPoint>? TimingRequestAnswered;

    public async Task<RaopSession> ConnectAsync(
        AirPlayDevice device,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(device);

        if (device.RtspEndPoint is not { } endPoint)
        {
            throw new InvalidOperationException(
                $"'{device.Name}' bir RAOP (ses) portu yayınlamıyor, bağlanılamaz.");
        }

        var client = new RtspClient(_options.Timeout);
        client.Traced += (_, trace) => Traced?.Invoke(this, trace);

        UdpClient? controlSocket = null;
        UdpClient? timingSocket = null;
        RaopTimingResponder? timing = null;

        try
        {
            await client.ConnectAsync(endPoint, cancellationToken).ConfigureAwait(false);

            var localAddress = client.LocalEndPoint!.Address;
            var announcedSessionId = (uint)RandomNumberGenerator.GetInt32(1, int.MaxValue);
            var controlUri = $"rtsp://{FormatHost(localAddress)}/{announcedSessionId}";

            client.DefaultHeaders.Add(new("User-Agent", _options.UserAgent));
            client.DefaultHeaders.Add(new("Client-Instance", RandomHex(8)));
            client.DefaultHeaders.Add(new("DACP-ID", RandomHex(8)));
            client.DefaultHeaders.Add(new("Active-Remote", RandomUInt32().ToString()));

            var encryption = _options.UseEncryption ? RaopEncryptionKeys.Create() : null;

            await SendOptionsAsync(client, cancellationToken).ConfigureAwait(false);
            await SendAnnounceAsync(
                    client, controlUri, announcedSessionId, localAddress, device, encryption, cancellationToken)
                .ConfigureAwait(false);

            controlSocket = new UdpClient(0, AddressFamily.InterNetwork);
            timingSocket = new UdpClient(0, AddressFamily.InterNetwork);

            // Must be listening before SETUP: the receiver sends its first timing request while
            // handling SETUP and withholds the response until we answer.
            timing = new RaopTimingResponder(timingSocket);
            timing.RequestAnswered += (_, from) => TimingRequestAnswered?.Invoke(this, from);
            timing.Start();

            var transport = await SendSetupAsync(
                client, controlUri, controlSocket, timingSocket, cancellationToken).ConfigureAwait(false);

            var initialSequence = (ushort)RandomNumberGenerator.GetInt32(ushort.MaxValue);
            var initialRtpTimestamp = RandomUInt32();

            var audioLatency = await SendRecordAsync(
                client, controlUri, initialSequence, initialRtpTimestamp, cancellationToken).ConfigureAwait(false);

            var session = new RaopSession(
                client,
                device,
                controlUri,
                client.SessionId!,
                announcedSessionId,
                localAddress,
                transport,
                controlSocket,
                timingSocket,
                timing,
                initialSequence,
                initialRtpTimestamp,
                audioLatency,
                _options.Audio,
                _options.MediaFormat,
                encryption);

            if (_options.InitialVolumeDb is { } volume)
            {
                await session.SetVolumeAsync(volume, cancellationToken).ConfigureAwait(false);
            }

            return session;
        }
        catch
        {
            timing?.Dispose();
            controlSocket?.Dispose();
            timingSocket?.Dispose();
            await client.DisposeAsync().ConfigureAwait(false);
            throw;
        }
    }

    private static async Task SendOptionsAsync(RtspClient client, CancellationToken cancellationToken)
    {
        var request = new RtspRequest("OPTIONS", "*")
            .WithHeader("Apple-Challenge", CreateAppleChallenge());

        var response = await client.SendAsync(request, cancellationToken).ConfigureAwait(false);
        EnsureSuccess(response, "OPTIONS");
    }

    private async Task SendAnnounceAsync(
        RtspClient client,
        string controlUri,
        uint sessionId,
        IPAddress localAddress,
        AirPlayDevice device,
        RaopEncryptionKeys? encryption,
        CancellationToken cancellationToken)
    {
        var sdp = SdpBuilder.BuildAnnounce(
            sessionId,
            localAddress,
            device.Address!,
            _options.MediaFormat,
            encryption?.WrappedKeyBase64,
            encryption?.IvBase64);

        var request = new RtspRequest("ANNOUNCE", controlUri)
            .WithHeader("Apple-Challenge", CreateAppleChallenge())
            .WithBody(sdp, "application/sdp");

        var response = await client.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (response.StatusCode == 406 && encryption is not null)
        {
            throw new RtspException(
                "ANNOUNCE başarısız: cihaz eski RSA/AES anahtar değişimini kabul etmiyor. " +
                "AirPlay 2 cihazları (HomePod, yeni Apple TV) bunun yerine eşleştirme tabanlı " +
                "şifreleme bekler; şifreleme olmadan tekrar deneyin.",
                response);
        }

        EnsureSuccess(response, "ANNOUNCE");
    }

    private static async Task<RaopTransport> SendSetupAsync(
        RtspClient client,
        string controlUri,
        UdpClient controlSocket,
        UdpClient timingSocket,
        CancellationToken cancellationToken)
    {
        var localControlPort = ((IPEndPoint)controlSocket.Client.LocalEndPoint!).Port;
        var localTimingPort = ((IPEndPoint)timingSocket.Client.LocalEndPoint!).Port;

        var request = new RtspRequest("SETUP", controlUri)
            .WithHeader(
                "Transport",
                "RTP/AVP/UDP;unicast;interleaved=0-1;mode=record;" +
                $"control_port={localControlPort};timing_port={localTimingPort}");

        var response = await client.SendAsync(request, cancellationToken).ConfigureAwait(false);
        EnsureSuccess(response, "SETUP");

        client.SessionId = response["Session"]
            ?? throw new RtspException("SETUP yanıtında Session başlığı yok.", response);

        return RaopTransport.Parse(response["Transport"]);
    }

    private static async Task<int?> SendRecordAsync(
        RtspClient client,
        string controlUri,
        ushort initialSequence,
        uint initialRtpTimestamp,
        CancellationToken cancellationToken)
    {
        var request = new RtspRequest("RECORD", controlUri)
            .WithHeader("Range", "npt=0-")
            .WithHeader("RTP-Info", $"seq={initialSequence};rtptime={initialRtpTimestamp}");

        var response = await client.SendAsync(request, cancellationToken).ConfigureAwait(false);
        EnsureSuccess(response, "RECORD");

        return int.TryParse(response["Audio-Latency"], out var latency) ? latency : null;
    }

    private static void EnsureSuccess(RtspResponse response, string step)
    {
        if (response.IsSuccess)
        {
            return;
        }

        var hint = response.StatusCode switch
        {
            401 or 403 => " Cihaz kimlik doğrulama (pairing) istiyor.",
            406 => " Cihaz istenen biçimi desteklemiyor.",
            453 => " Cihaz başka bir kaynaktan yayın alıyor.",
            _ => string.Empty,
        };

        throw new RtspException($"{step} başarısız: {response.StatusLine}.{hint}", response);
    }

    /// <summary>16 random bytes, base64 without padding — what iTunes sends to prove liveness.</summary>
    private static string CreateAppleChallenge() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(16)).TrimEnd('=');

    private static string RandomHex(int byteCount) =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(byteCount));

    private static uint RandomUInt32() => BitConverter.ToUInt32(RandomNumberGenerator.GetBytes(4));

    private static string FormatHost(IPAddress address) =>
        address.AddressFamily == AddressFamily.InterNetworkV6 ? $"[{address}]" : address.ToString();
}
