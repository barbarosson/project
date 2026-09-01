using System.Globalization;

namespace WinAirPlay.App.Localization;

public sealed class LocalizationService : ILocalizationService
{
    private static readonly IReadOnlyDictionary<string, string> Turkish = BuildTurkish();
    private static readonly IReadOnlyDictionary<string, string> English = BuildEnglish();

    private AppLanguage _language = AppLanguage.Tr;

    public AppLanguage Language
    {
        get => _language;
        set
        {
            if (_language == value)
            {
                return;
            }

            _language = value;
            LanguageChanged?.Invoke(this, EventArgs.Empty);
        }
    }

    public event EventHandler? LanguageChanged;

    public string Get(string key) =>
        Resolve(key) ?? key;

    public string Format(string key, params object[] args) =>
        string.Format(CultureInfo.InvariantCulture, Get(key), args);

    private string? Resolve(string key) =>
        (_language == AppLanguage.En ? English : Turkish).TryGetValue(key, out var value) ? value : null;

    private static Dictionary<string, string> BuildTurkish() => new()
    {
        [LocKeys.Ready] = "Hazır.",
        [LocKeys.Connect] = "Bağlan",
        [LocKeys.Disconnect] = "Bağlantıyı Kes",

        [LocKeys.StateIdle] = "Bağlı değil",
        [LocKeys.StateScanning] = "Taranıyor",
        [LocKeys.StateConnecting] = "Bağlanıyor",
        [LocKeys.StateStreaming] = "Yayında",
        [LocKeys.StateStopping] = "Durduruluyor",
        [LocKeys.StateFaulted] = "Hata",

        [LocKeys.TargetDevice] = "HEDEF CİHAZ",
        [LocKeys.AudioSource] = "SES KAYNAĞI",
        [LocKeys.BufferLatency] = "TAMPON (GECİKME)",
        [LocKeys.Volume] = "SES SEVİYESİ",
        [LocKeys.Streaming] = "YAYIN",
        [LocKeys.Duration] = "SÜRE",
        [LocKeys.Throughput] = "AKIŞ HIZI",
        [LocKeys.Packets] = "PAKET",
        [LocKeys.Encoding] = "KODLAMA",
        [LocKeys.Scan] = "Tara",
        [LocKeys.LatencyHint] = "0 ms en düşük gecikme; ağ dalgalanmasında kesilmeye yol açabilir.",
        [LocKeys.AlacEncoding] = "ALAC kodlama",
        [LocKeys.MuteSpeakers] = "Yayın sırasında hoparlörü kapat",
        [LocKeys.MuteSpeakersHint] = "Ses yalnızca AirPlay cihazından gelir. Kapatılmazsa ikisinden birden duyulur.",
        [LocKeys.AutoConnect] = "Açılışta son cihaza bağlan",
        [LocKeys.StartMinimized] = "Simge durumunda başlat",
        [LocKeys.Language] = "DİL",
        [LocKeys.NoDevices] = "Cihaz bulunamadı",

        [LocKeys.VolumeMuted] = "kısık",
        [LocKeys.LatencyMs] = "{0} ms",
        [LocKeys.ThroughputKbps] = "{0} kbit/s",
        [LocKeys.PacketsSync] = "{0} paket · {1} sync",
        [LocKeys.CodecEncrypted] = "{0} · şifreli",
        [LocKeys.CodecAlacHint] = "ALAC — cihazın ilan ettiği biçim",
        [LocKeys.CodecPcmHint] = "Ham PCM (L16) — yalnızca sorun giderme için",

        [LocKeys.ScanningNetwork] = "Ağ taranıyor...",
        [LocKeys.NoReceiversFound] = "Ses akışı kabul eden cihaz bulunamadı.",
        [LocKeys.DevicesFound] = "{0} cihaz bulundu.",
        [LocKeys.ScanCancelled] = "Tarama iptal edildi.",
        [LocKeys.ScanFailed] = "Tarama başarısız: {0}",
        [LocKeys.ConnectingTo] = "{0} cihazına bağlanılıyor...",
        [LocKeys.SpeakersNotMuted] = "Hoparlör kapatılmadı: Windows sesi cihaz mute'undan önce yakalayamadı.",
        [LocKeys.StreamStartedMuted] = "{0} cihazına yayın başladı. Hoparlör susturuldu.",
        [LocKeys.StreamStarted] = "{0} cihazına yayın başladı.",
        [LocKeys.Disconnected] = "Bağlantı kapatıldı.",
        [LocKeys.DisconnectedFrom] = "{0} bağlantısı kapatıldı.",
        [LocKeys.VolumeFailed] = "Ses seviyesi ayarlanamadı: {0}",
        [LocKeys.ConnectionCancelled] = "Bağlantı iptal edildi.",
        [LocKeys.ConnectFailed] = "{0} cihazına bağlanılamadı: {1}",
        [LocKeys.PacketSendFailed] = "Paket gönderilemedi: {0}",
        [LocKeys.KeepAliveFailed] = "Oturum yenilenemedi: {0}",
        [LocKeys.CaptureStopped] = "Ses yakalama durdu: {0}",
        [LocKeys.StreamStopped] = "{0} yayını durdu: {1}",
        [LocKeys.CaptureDevicesFailed] = "Ses cihazları listelenemedi: {0}",

        [LocKeys.TrayShowWindow] = "Pencereyi Göster",
        [LocKeys.TrayExit] = "Çıkış",
        [LocKeys.TrayStreamingWithDevice] = "Yayında — {0}",
        [LocKeys.TrayStreaming] = "Yayında",
        [LocKeys.TrayConnecting] = "Bağlanıyor...",
        [LocKeys.TrayScanning] = "Ağ taranıyor...",
        [LocKeys.TrayStopping] = "Durduruluyor...",
        [LocKeys.TrayFaulted] = "Hata",
        [LocKeys.TrayNotConnected] = "Bağlı değil",

        [LocKeys.CrashTitle] = "WinAirPlay — beklenmeyen hata",
        [LocKeys.CrashDetails] = "{0}\n\nAyrıntılar: {1}",

        [LocKeys.SplashTagline] = "Windows sesini AirPlay cihazlarına aktarın",
        [LocKeys.SplashLoading] = "Başlatılıyor...",
    };

    private static Dictionary<string, string> BuildEnglish() => new()
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
        [LocKeys.MuteSpeakers] = "Mute PC speakers while streaming",
        [LocKeys.MuteSpeakersHint] = "Audio only from the AirPlay device. If off, you hear both outputs.",
        [LocKeys.AutoConnect] = "Connect to last device on startup",
        [LocKeys.StartMinimized] = "Start minimized to tray",
        [LocKeys.Language] = "LANGUAGE",
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
        [LocKeys.ScanCancelled] = "Scan cancelled.",
        [LocKeys.ScanFailed] = "Scan failed: {0}",
        [LocKeys.ConnectingTo] = "Connecting to {0}...",
        [LocKeys.SpeakersNotMuted] = "Speakers not muted: Windows could not capture before device mute.",
        [LocKeys.StreamStartedMuted] = "Streaming to {0}. PC speakers muted.",
        [LocKeys.StreamStarted] = "Streaming to {0}.",
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
