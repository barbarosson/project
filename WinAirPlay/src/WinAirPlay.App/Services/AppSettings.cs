using System;
using WinAirPlay.Core.Raop;

namespace WinAirPlay.App.Services;

/// <summary>
/// Everything the app remembers between runs. Plain properties so it round-trips through
/// System.Text.Json without a custom converter.
/// </summary>
public sealed class AppSettings
{
    public const int MinLatencyMs = 50;
    public const int MaxLatencyMs = 2000;
    public const double MinVolumeDb = -30;
    public const double MaxVolumeDb = 0;

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
    /// </summary>
    public bool MuteLocalSpeakers { get; set; } = true;

    /// <summary>Brings values back into the ranges the UI and the receiver accept.</summary>
    public AppSettings Normalize()
    {
        LatencyMs = Math.Clamp(LatencyMs, MinLatencyMs, MaxLatencyMs);
        VolumeDb = Math.Clamp(double.IsFinite(VolumeDb) ? VolumeDb : -20, MinVolumeDb, MaxVolumeDb);

        if (!Enum.IsDefined(Codec))
        {
            Codec = RaopStreamCodec.AppleLossless;
        }

        if (string.IsNullOrWhiteSpace(LastDeviceId))
        {
            LastDeviceId = null;
        }

        if (string.IsNullOrWhiteSpace(CaptureDeviceId))
        {
            CaptureDeviceId = null;
        }

        return this;
    }

    public AppSettings Clone() => (AppSettings)MemberwiseClone();
}
