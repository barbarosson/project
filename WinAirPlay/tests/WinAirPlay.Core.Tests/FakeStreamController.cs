using System.Net;
using WinAirPlay.App.Services;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Discovery;
using WinAirPlay.Core.Raop;

namespace WinAirPlay.Core.Tests;

internal sealed class FakeStreamController : IStreamController
{
    private StreamState _state = StreamState.Idle;

    public List<AirPlayDevice> ScanResult { get; } = new();

    public bool ConnectSucceeds { get; set; } = true;

    public int ScanCount { get; private set; }

    public AirPlayDevice? LastConnectedDevice { get; private set; }

    public StreamSettings? LastSettings { get; private set; }

    public List<int> LatencyUpdates { get; } = new();

    public List<double> VolumeUpdates { get; } = new();

    public StreamStatistics Statistics { get; set; } = StreamStatistics.Empty;

    public StreamState State
    {
        get => _state;
        private set
        {
            _state = value;
            StateChanged?.Invoke(this, value);
        }
    }

    public AirPlayDevice? ConnectedDevice { get; private set; }

    public event EventHandler<StreamState>? StateChanged;

    public event EventHandler<string>? StatusChanged;

    public Task<IReadOnlyList<AirPlayDevice>> ScanAsync(TimeSpan duration, CancellationToken cancellationToken = default)
    {
        ScanCount++;
        StatusChanged?.Invoke(this, $"{ScanResult.Count} cihaz bulundu.");
        return Task.FromResult<IReadOnlyList<AirPlayDevice>>(ScanResult.ToList());
    }

    public Task<bool> ConnectAsync(
        AirPlayDevice device,
        StreamSettings settings,
        CancellationToken cancellationToken = default)
    {
        LastConnectedDevice = device;
        LastSettings = settings;

        if (!ConnectSucceeds)
        {
            State = StreamState.Faulted;
            return Task.FromResult(false);
        }

        ConnectedDevice = device;
        State = StreamState.Streaming;
        return Task.FromResult(true);
    }

    public Task DisconnectAsync()
    {
        ConnectedDevice = null;
        State = StreamState.Idle;
        return Task.CompletedTask;
    }

    public Task SetVolumeAsync(double decibels)
    {
        VolumeUpdates.Add(decibels);
        return Task.CompletedTask;
    }

    public void SetLatency(int milliseconds) => LatencyUpdates.Add(milliseconds);

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

internal sealed class InMemorySettingsStore : ISettingsStore
{
    public InMemorySettingsStore(AppSettings? initial = null) => Current = initial ?? new AppSettings();

    public AppSettings Current { get; private set; }

    public int SaveCount { get; private set; }

    public AppSettings Load() => Current;

    public void Save(AppSettings settings)
    {
        Current = settings.Clone();
        SaveCount++;
    }
}

internal sealed class FakeAudioDeviceEnumerator : IAudioDeviceEnumerator
{
    public List<AudioDeviceInfo> Devices { get; } = new();

    public IReadOnlyList<AudioDeviceInfo> GetRenderDevices() => Devices;

    public AudioDeviceInfo? GetDefaultRenderDevice() => Devices.FirstOrDefault(d => d.IsDefault);
}

internal static class TestDevices
{
    public static AirPlayDevice Create(string name, string? deviceId = null, string address = "192.168.0.50") =>
        new()
        {
            Name = name,
            DeviceId = deviceId,
            Addresses = new[] { IPAddress.Parse(address) },
            RaopPort = 7000,
            Capabilities = RaopCapabilities.Unknown,
        };
}
