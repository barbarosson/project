using System;
using WinAirPlay.App.Localization;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Raop;

namespace WinAirPlay.App.Services;

/// <summary>
/// Everything the app remembers between runs. Plain properties so it round-trips through
/// System.Text.Json without a custom converter.
/// </summary>
public sealed class AppSettings
{
    public const int MinLatencyMs = 0;
    public const int MaxLatencyMs = 2000;
    public const int LatencyStepMs = 10;
    public const double MinVolumeDb = -30;
    public const double MaxVolumeDb = 0;

    /// <summary>Maps receiver dB attenuation (-30…0) to a 0–100% slider value.</summary>
    public static double DbToPercent(double decibels) =>
        Math.Clamp((decibels - MinVolumeDb) / (MaxVolumeDb - MinVolumeDb) * 100.0, 0, 100);

    /// <summary>Maps a 0–100% slider value back to receiver dB attenuation.</summary>
    public static double PercentToDb(double percent)
    {
        var clamped = Math.Clamp(percent, 0, 100);
        return MinVolumeDb + (clamped / 100.0) * (MaxVolumeDb - MinVolumeDb);
    }

    /// <summary>Hardware id of the receiver last streamed to, so it can be reselected after a scan.</summary>
    public string? LastDeviceId { get; set; }

    public string? LastDeviceName { get; set; }

    /// <summary>WASAPI endpoint to capture. <c>null</c> follows the Windows default output.</summary>
    public string? CaptureDeviceId { get; set; }

    public RaopStreamCodec Codec { get; set; } = RaopStreamCodec.AppleLossless;

    public int LatencyMs { get; set; } = 50;

    public double VolumeDb { get; set; } = -20;

    public bool StartMinimized { get; set; }

    /// <summary>Reconnects to the last receiver as soon as the app starts.</summary>
    public bool AutoConnect { get; set; }

    /// <summary>
    /// Silences the PC speakers while AirPlay is running so sound only comes from the receiver.
    /// Used when no virtual cable is available (compatibility mode).
    /// </summary>
    public bool MuteLocalSpeakers { get; set; } = true;

    /// <summary>
    /// Auto uses a virtual cable when Windows has one; otherwise mutes the speakers.
    /// </summary>
    public AudioRoutingMode RoutingMode { get; set; } = AudioRoutingMode.Auto;

    /// <summary>Hardware id of the preferred VB-Audio / VoiceMeeter playback endpoint.</summary>
    public string? PreferredVirtualDeviceId { get; set; }

    /// <summary>
    /// Follow the Windows volume keys / mixer on the capture endpoint so HomePod tracks PC volume.
    /// </summary>
    public bool FollowWindowsVolume { get; set; } = true;

    public AppLanguage Language { get; set; } = AppLanguage.Tr;

    /// <summary>Brings values back into the ranges the UI and the receiver accept.</summary>
    public AppSettings Normalize()
    {
        LatencyMs = Math.Clamp(LatencyMs, MinLatencyMs, MaxLatencyMs);
        VolumeDb = Math.Clamp(double.IsFinite(VolumeDb) ? VolumeDb : -20, MinVolumeDb, MaxVolumeDb);

        if (!Enum.IsDefined(Language))
        {
            Language = AppLanguage.Tr;
        }

        if (!Enum.IsDefined(Codec))
        {
            Codec = RaopStreamCodec.AppleLossless;
        }

        if (!Enum.IsDefined(RoutingMode))
        {
            RoutingMode = AudioRoutingMode.Auto;
        }

        if (string.IsNullOrWhiteSpace(LastDeviceId))
        {
            LastDeviceId = null;
        }

        if (string.IsNullOrWhiteSpace(CaptureDeviceId))
        {
            CaptureDeviceId = null;
        }

        if (string.IsNullOrWhiteSpace(PreferredVirtualDeviceId))
        {
            PreferredVirtualDeviceId = null;
        }

        return this;
    }

    public AppSettings Clone() => (AppSettings)MemberwiseClone();
}
