namespace WinAirPlay.App.Localization;

/// <summary>Stable keys shared by the UI, tray and stream controller.</summary>
internal static class LocKeys
{
    internal const string Ready = "ready";
    internal const string Connect = "connect";
    internal const string Disconnect = "disconnect";

    internal const string StateIdle = "state.idle";
    internal const string StateScanning = "state.scanning";
    internal const string StateConnecting = "state.connecting";
    internal const string StateStreaming = "state.streaming";
    internal const string StateStopping = "state.stopping";
    internal const string StateFaulted = "state.faulted";

    internal const string TargetDevice = "ui.target_device";
    internal const string AudioSource = "ui.audio_source";
    internal const string BufferLatency = "ui.buffer_latency";
    internal const string Volume = "ui.volume";
    internal const string Streaming = "ui.streaming";
    internal const string Duration = "ui.duration";
    internal const string Throughput = "ui.throughput";
    internal const string Packets = "ui.packets";
    internal const string Encoding = "ui.encoding";
    internal const string Scan = "ui.scan";
    internal const string LatencyHint = "ui.latency_hint";
    internal const string AlacEncoding = "ui.alac_encoding";
    internal const string MuteSpeakers = "ui.mute_speakers";
    internal const string MuteSpeakersHint = "ui.mute_speakers_hint";
    internal const string RoutingCaption = "ui.routing";
    internal const string RoutingAuto = "ui.routing_auto";
    internal const string RoutingVirtual = "ui.routing_virtual";
    internal const string RoutingMute = "ui.routing_mute";
    internal const string RoutingHintRedirect = "ui.routing_hint_redirect";
    internal const string RoutingHintMute = "ui.routing_hint_mute";
    internal const string RoutingHintNoCable = "ui.routing_hint_no_cable";
    internal const string FollowWindowsVolume = "ui.follow_windows_volume";
    internal const string FollowWindowsVolumeHint = "ui.follow_windows_volume_hint";
    internal const string VolumeHint = "ui.volume_hint";
    internal const string AutoConnect = "ui.auto_connect";
    internal const string StartMinimized = "ui.start_minimized";
    internal const string NoDevices = "ui.no_devices";

    internal const string VolumeMuted = "volume.muted";
    internal const string LatencyMs = "format.latency_ms";
    internal const string ThroughputKbps = "format.throughput_kbps";
    internal const string PacketsSync = "format.packets_sync";
    internal const string CodecEncrypted = "format.codec_encrypted";
    internal const string CodecAlacHint = "codec.alac_hint";
    internal const string CodecPcmHint = "codec.pcm_hint";

    internal const string ScanningNetwork = "stream.scanning_network";
    internal const string NoReceiversFound = "stream.no_receivers";
    internal const string DevicesFound = "stream.devices_found";
    internal const string DevicesFoundList = "stream.devices_found_list";
    internal const string ScanCancelled = "stream.scan_cancelled";
    internal const string ScanFailed = "stream.scan_failed";
    internal const string ConnectingTo = "stream.connecting_to";
    internal const string SpeakersNotMuted = "stream.speakers_not_muted";
    internal const string StreamStartedMuted = "stream.started_muted";
    internal const string StreamStarted = "stream.started";
    internal const string StreamStartedRedirected = "stream.started_redirected";
    internal const string RoutingRedirectFailed = "stream.routing_redirect_failed";
    internal const string Disconnected = "stream.disconnected";
    internal const string DisconnectedFrom = "stream.disconnected_from";
    internal const string VolumeFailed = "stream.volume_failed";
    internal const string ConnectionCancelled = "stream.connection_cancelled";
    internal const string ConnectFailed = "stream.connect_failed";
    internal const string PacketSendFailed = "stream.packet_send_failed";
    internal const string KeepAliveFailed = "stream.keepalive_failed";
    internal const string CaptureStopped = "stream.capture_stopped";
    internal const string StreamStopped = "stream.stream_stopped";
    internal const string CaptureDevicesFailed = "stream.capture_devices_failed";

    internal const string TrayShowWindow = "tray.show_window";
    internal const string TrayExit = "tray.exit";
    internal const string TrayStreamingWithDevice = "tray.streaming_with_device";
    internal const string TrayStreaming = "tray.streaming";
    internal const string TrayConnecting = "tray.connecting";
    internal const string TrayScanning = "tray.scanning";
    internal const string TrayStopping = "tray.stopping";
    internal const string TrayFaulted = "tray.faulted";
    internal const string TrayNotConnected = "tray.not_connected";

    internal const string CrashTitle = "crash.title";
    internal const string CrashDetails = "crash.details";

    internal const string SplashTagline = "splash.tagline";
    internal const string SplashLoading = "splash.loading";
}
