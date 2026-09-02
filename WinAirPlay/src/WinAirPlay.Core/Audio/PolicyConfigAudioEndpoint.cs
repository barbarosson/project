using NAudio.CoreAudioApi;

namespace WinAirPlay.Core.Audio;

public enum AudioDeviceRole
{
    Console = 0,
    Multimedia = 1,
    Communications = 2,
}

public interface IDefaultAudioEndpointPolicy
{
    string? GetDefaultRenderId(AudioDeviceRole role);

    void SetDefaultRender(string deviceId, AudioDeviceRole role);
}

/// <summary>
/// Reads the current default through MMDeviceEnumerator and writes it through the undocumented
/// PolicyConfig COM API — the same path SoundSwitch and similar tools use. There is no supported
/// public Win32 equivalent that does not require a custom audio driver.
/// </summary>
public sealed class PolicyConfigAudioEndpoint : IDefaultAudioEndpointPolicy
{
    public string? GetDefaultRenderId(AudioDeviceRole role)
    {
        using var enumerator = new MMDeviceEnumerator();
        var naudioRole = ToNAudio(role);

        if (!enumerator.HasDefaultAudioEndpoint(DataFlow.Render, naudioRole))
        {
            return null;
        }

        using var device = enumerator.GetDefaultAudioEndpoint(DataFlow.Render, naudioRole);
        return device.ID;
    }

    public void SetDefaultRender(string deviceId, AudioDeviceRole role)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deviceId);

        var client = new PolicyConfigClient();
        var nativeRole = (uint)role;

        if (client is IPolicyConfig config)
        {
            MarshalThrow(config.SetDefaultEndpoint(deviceId, nativeRole));
            return;
        }

        if (client is IPolicyConfigVista vista)
        {
            MarshalThrow(vista.SetDefaultEndpoint(deviceId, nativeRole));
            return;
        }

        throw new InvalidOperationException("Windows varsayılan ses çıkışı değiştirilemedi (PolicyConfig).");
    }

    private static Role ToNAudio(AudioDeviceRole role) => role switch
    {
        AudioDeviceRole.Console => Role.Console,
        AudioDeviceRole.Communications => Role.Communications,
        _ => Role.Multimedia,
    };

    private static void MarshalThrow(int hresult)
    {
        if (hresult < 0)
        {
            System.Runtime.InteropServices.Marshal.ThrowExceptionForHR(hresult);
        }
    }
}

[System.Runtime.InteropServices.ComImport]
[System.Runtime.InteropServices.Guid("870AF99C-171D-4F9E-AF0D-E63DF40C2BC9")]
internal class PolicyConfigClient;

[System.Runtime.InteropServices.ComImport]
[System.Runtime.InteropServices.Guid("F8679F50-850A-41CF-9C72-430F290290C8")]
[System.Runtime.InteropServices.InterfaceType(System.Runtime.InteropServices.ComInterfaceType.InterfaceIsIUnknown)]
internal interface IPolicyConfig
{
    int GetMixFormat(string pszDeviceName, nint ppFormat);
    int GetDeviceFormat(string pszDeviceName, [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)] bool bDefault, nint ppFormat);
    int ResetDeviceFormat(string pszDeviceName);
    int SetDeviceFormat(string pszDeviceName, nint pEndpointFormat, nint mixFormat);
    int GetProcessingPeriod(string pszDeviceName, [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)] bool bDefault, nint defaultPeriod, nint minimumPeriod);
    int SetProcessingPeriod(string pszDeviceName, nint period);
    int GetShareMode(string pszDeviceName, nint mode);
    int SetShareMode(string pszDeviceName, nint mode);
    int GetPropertyValue(string pszDeviceName, [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)] bool bFxStore, nint key, nint pv);
    int SetPropertyValue(string pszDeviceName, [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)] bool bFxStore, nint key, nint pv);
    [System.Runtime.InteropServices.PreserveSig]
    int SetDefaultEndpoint([System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.LPWStr)] string pszDeviceName, uint role);
    int SetEndpointVisibility(string pszDeviceName, [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)] bool bVisible);
}

[System.Runtime.InteropServices.ComImport]
[System.Runtime.InteropServices.Guid("568B9108-44BF-40B4-9006-86AFE5B4A620")]
[System.Runtime.InteropServices.InterfaceType(System.Runtime.InteropServices.ComInterfaceType.InterfaceIsIUnknown)]
internal interface IPolicyConfigVista
{
    int GetMixFormat(string pszDeviceName, nint ppFormat);
    int GetDeviceFormat(string pszDeviceName, [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)] bool bDefault, nint ppFormat);
    int ResetDeviceFormat(string pszDeviceName);
    int SetDeviceFormat(string pszDeviceName, nint pEndpointFormat, nint mixFormat);
    int GetProcessingPeriod(string pszDeviceName, [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)] bool bDefault, nint defaultPeriod, nint minimumPeriod);
    int SetProcessingPeriod(string pszDeviceName, nint period);
    int GetShareMode(string pszDeviceName, nint mode);
    int SetShareMode(string pszDeviceName, nint mode);
    int GetPropertyValue(string pszDeviceName, [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)] bool bFxStore, nint key, nint pv);
    int SetPropertyValue(string pszDeviceName, [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)] bool bFxStore, nint key, nint pv);
    [System.Runtime.InteropServices.PreserveSig]
    int SetDefaultEndpoint([System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.LPWStr)] string pszDeviceName, uint role);
    int SetEndpointVisibility(string pszDeviceName, [System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)] bool bVisible);
}
