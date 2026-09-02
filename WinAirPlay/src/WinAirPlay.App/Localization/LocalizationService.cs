using System.Globalization;

namespace WinAirPlay.App.Localization;

public sealed class LocalizationService : ILocalizationService
{
    private static readonly IReadOnlyDictionary<string, string> Strings = BuildStrings();

    public string Get(string key) =>
        Strings.TryGetValue(key, out var value) ? value : key;

    public string Format(string key, params object[] args) =>
        string.Format(CultureInfo.InvariantCulture, Get(key), args);

    private static Dictionary<string, string> BuildStrings() => new()
    {
        [LocKeys.Ready] = "Ready.",
        [LocKeys.Connect] = "Connect",
        [LocKeys.Disconnect] = "Disconnect",

        [LocKeys.StateIdle] = "Not connected",
        [LocKeys.StateScanning] = "Scanning",
        [LocKeys.StateConnecting] = "Connecting",
        [LocKeys.StateStreaming] = "Streaming",
        [LocKeys.StateStopping] = "Stopping",
        [LocKeys.StateFaulted] = "Error",

        [LocKeys.TargetDevice] = "TARGET DEVICE",
        [LocKeys.AudioSource] = "AUDIO SOURCE",
        [LocKeys.BufferLatency] = "BUFFER (LATENCY)",
        [LocKeys.Volume] = "VOLUME",
        [LocKeys.Streaming] = "STREAM",
        [LocKeys.Duration] = "TIME",
        [LocKeys.Throughput] = "BITRATE",
        [LocKeys.Packets] = "PACKETS",
        [LocKeys.Encoding] = "CODEC",
        [LocKeys.Scan] = "Scan",
        [LocKeys.LatencyHint] = "0 ms is the lowest latency; may cut out on unstable networks.",
        [LocKeys.AlacEncoding] = "ALAC encoding",
        [LocKeys.MuteSpeakers] = "Mute speakers in compatibility mode",
        [LocKeys.MuteSpeakersHint] = "Speakers are muted when no virtual cable is installed. VB-Audio Cable or VoiceMeeter keeps them unmuted.",
        [LocKeys.RoutingCaption] = "AUDIO ROUTING",
        [LocKeys.RoutingAuto] = "Auto",
        [LocKeys.RoutingVirtual] = "Virtual cable",
        [LocKeys.RoutingMute] = "Mute speakers",
        [LocKeys.RoutingHintRedirect] = "Speakers stay on. Default output becomes {0} while streaming; Windows volume keys control HomePod.",
        [LocKeys.RoutingHintMute] = "Windows copies this mix to the speakers; it cannot move it to HomePod without a virtual device. Compatibility mode mutes speakers and still applies Windows volume to HomePod.",
        [LocKeys.RoutingHintNoCable] = "No virtual cable found. Install VB-Audio Cable or VoiceMeeter; otherwise compatibility mode (speaker mute) is used.",
        [LocKeys.FollowWindowsVolume] = "Apply Windows volume to HomePod",
        [LocKeys.FollowWindowsVolumeHint] = "System volume keys and the mixer carry the capture endpoint's level to HomePod.",
        [LocKeys.VolumeHint] = "HomePod trim. Windows volume is the main control.",
        [LocKeys.AutoConnect] = "Connect to last device on startup",
        [LocKeys.StartMinimized] = "Start minimized to tray",
        [LocKeys.NoDevices] = "No devices found",

        [LocKeys.VolumeMuted] = "muted",
        [LocKeys.LatencyMs] = "{0} ms",
        [LocKeys.ThroughputKbps] = "{0} kbit/s",
        [LocKeys.PacketsSync] = "{0} packets · {1} sync",
        [LocKeys.CodecEncrypted] = "{0} · encrypted",
        [LocKeys.CodecAlacHint] = "ALAC — format advertised by the device",
        [LocKeys.CodecPcmHint] = "Raw PCM (L16) — troubleshooting only",

        [LocKeys.ScanningNetwork] = "Scanning network...",
        [LocKeys.NoReceiversFound] = "No audio receivers found.",
        [LocKeys.DevicesFound] = "Found {0} device(s).",
        [LocKeys.DevicesFoundList] = "Found {0} device(s): {1}",
        [LocKeys.ScanCancelled] = "Scan cancelled.",
        [LocKeys.ScanFailed] = "Scan failed: {0}",
        [LocKeys.ConnectingTo] = "Connecting to {0}...",
        [LocKeys.SpeakersNotMuted] = "Speakers not muted: Windows could not capture before device mute.",
        [LocKeys.StreamStartedMuted] = "Streaming to {0}. PC speakers muted (compatibility mode).",
        [LocKeys.StreamStarted] = "Streaming to {0}.",
        [LocKeys.StreamStartedRedirected] = "Streaming to {0}. Default output is {1}; speakers stay on.",
        [LocKeys.RoutingRedirectFailed] = "Could not switch the default output to the virtual cable; falling back to speaker mute.",
        [LocKeys.Disconnected] = "Disconnected.",
        [LocKeys.DisconnectedFrom] = "Disconnected from {0}.",
        [LocKeys.VolumeFailed] = "Could not set volume: {0}",
        [LocKeys.ConnectionCancelled] = "Connection cancelled.",
        [LocKeys.ConnectFailed] = "Could not connect to {0}: {1}",
        [LocKeys.PacketSendFailed] = "Could not send packet: {0}",
        [LocKeys.KeepAliveFailed] = "Session keepalive failed: {0}",
        [LocKeys.CaptureStopped] = "Audio capture stopped: {0}",
        [LocKeys.StreamStopped] = "{0} stream stopped: {1}",
        [LocKeys.CaptureDevicesFailed] = "Could not list audio devices: {0}",

        [LocKeys.TrayShowWindow] = "Show Window",
        [LocKeys.TrayExit] = "Exit",
        [LocKeys.TrayStreamingWithDevice] = "Streaming — {0}",
        [LocKeys.TrayStreaming] = "Streaming",
        [LocKeys.TrayConnecting] = "Connecting...",
        [LocKeys.TrayScanning] = "Scanning network...",
        [LocKeys.TrayStopping] = "Stopping...",
        [LocKeys.TrayFaulted] = "Error",
        [LocKeys.TrayNotConnected] = "Not connected",

        [LocKeys.CrashTitle] = "WinAirPlay — unexpected error",
        [LocKeys.CrashDetails] = "{0}\n\nDetails: {1}",

        [LocKeys.SplashTagline] = "Stream Windows audio to AirPlay devices",
        [LocKeys.SplashLoading] = "Starting...",
    };
}
