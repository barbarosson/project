using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using WinAirPlay.App.Mvvm;
using WinAirPlay.App.Services;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Discovery;
using WinAirPlay.Core.Raop;

namespace WinAirPlay.App.ViewModels;

public sealed class MainViewModel : ObservableObject
{
    private static readonly TimeSpan ScanDuration = TimeSpan.FromSeconds(8);

    private readonly IStreamController _controller;
    private readonly ISettingsStore _settingsStore;
    private readonly IAudioDeviceEnumerator _captureDevices;
    private readonly IUiDispatcher _dispatcher;
    private readonly AppSettings _settings;
    private readonly BitrateEstimator _bitrate = new();

    private AirPlayDevice? _selectedDevice;
    private AudioDeviceInfo? _selectedCaptureDevice;
    private StreamState _state = StreamState.Idle;
    private string _statusText = "Hazır.";
    private string _positionText = "00:00";
    private string _throughputText = "-";
    private string _packetText = "-";
    private string _codecText = "-";
    private float _peakLeft;
    private float _peakRight;
    private bool _suppressSettingsWrite;

    public MainViewModel(
        IStreamController controller,
        ISettingsStore settingsStore,
        IAudioDeviceEnumerator captureDevices,
        IUiDispatcher dispatcher)
    {
        _controller = controller ?? throw new ArgumentNullException(nameof(controller));
        _settingsStore = settingsStore ?? throw new ArgumentNullException(nameof(settingsStore));
        _captureDevices = captureDevices ?? throw new ArgumentNullException(nameof(captureDevices));
        _dispatcher = dispatcher ?? throw new ArgumentNullException(nameof(dispatcher));

        _settings = _settingsStore.Load().Normalize();

        _controller.StateChanged += (_, state) => _dispatcher.Post(() => State = state);
        _controller.StatusChanged += (_, message) => _dispatcher.Post(() => StatusText = message);

        ScanCommand = new AsyncRelayCommand(ScanAsync, () => State is StreamState.Idle or StreamState.Streaming);
        ConnectCommand = new AsyncRelayCommand(ConnectAsync, () => CanConnect);
        DisconnectCommand = new AsyncRelayCommand(DisconnectAsync, () => CanDisconnect);
        ToggleConnectionCommand = new AsyncRelayCommand(ToggleConnectionAsync, () => CanConnect || CanDisconnect);
    }

    public ObservableCollection<AirPlayDevice> Devices { get; } = new();

    public ObservableCollection<AudioDeviceInfo> CaptureDevices { get; } = new();

    public AsyncRelayCommand ScanCommand { get; }

    public AsyncRelayCommand ConnectCommand { get; }

    public AsyncRelayCommand DisconnectCommand { get; }

    public AsyncRelayCommand ToggleConnectionCommand { get; }

    public AirPlayDevice? SelectedDevice
    {
        get => _selectedDevice;
        set
        {
            if (SetProperty(ref _selectedDevice, value))
            {
                RememberDevice(value);
                RaiseCommandStates();
            }
        }
    }

    public AudioDeviceInfo? SelectedCaptureDevice
    {
        get => _selectedCaptureDevice;
        set
        {
            if (!SetProperty(ref _selectedCaptureDevice, value))
            {
                return;
            }

            // A null id means "whatever Windows is playing through right now".
            _settings.CaptureDeviceId = value is null || value.IsDefault ? null : value.Id;
            PersistSettings();
        }
    }

    public StreamState State
    {
        get => _state;
        private set
        {
            if (!SetProperty(ref _state, value))
            {
                return;
            }

            if (value != StreamState.Streaming)
            {
                _bitrate.Reset();
                ResetStatistics();
            }

            OnPropertyChanged(nameof(IsStreaming));
            OnPropertyChanged(nameof(IsBusy));
            OnPropertyChanged(nameof(CanConnect));
            OnPropertyChanged(nameof(CanDisconnect));
            OnPropertyChanged(nameof(ConnectionButtonText));
            OnPropertyChanged(nameof(StateText));
            RaiseCommandStates();
        }
    }

    public bool IsStreaming => State == StreamState.Streaming;

    public bool IsBusy => State is StreamState.Scanning or StreamState.Connecting or StreamState.Stopping;

    public bool CanConnect => State is StreamState.Idle or StreamState.Faulted && SelectedDevice is not null;

    public bool HasDevices => Devices.Count > 0;

    public bool CanDisconnect => State == StreamState.Streaming;

    public string ConnectionButtonText => IsStreaming ? "Bağlantıyı Kes" : "Bağlan";

    public string StateText => State switch
    {
        StreamState.Idle => "Bağlı değil",
        StreamState.Scanning => "Taranıyor",
        StreamState.Connecting => "Bağlanıyor",
        StreamState.Streaming => "Yayında",
        StreamState.Stopping => "Durduruluyor",
        StreamState.Faulted => "Hata",
        _ => State.ToString(),
    };

    public string StatusText
    {
        get => _statusText;
        private set => SetProperty(ref _statusText, value);
    }

    public int LatencyMs
    {
        get => _settings.LatencyMs;
        set
        {
            var clamped = Math.Clamp(value, AppSettings.MinLatencyMs, AppSettings.MaxLatencyMs);
            if (_settings.LatencyMs == clamped)
            {
                return;
            }

            _settings.LatencyMs = clamped;
            OnPropertyChanged();
            OnPropertyChanged(nameof(LatencyText));
            _controller.SetLatency(clamped);
            PersistSettings();
        }
    }

    public string LatencyText => $"{LatencyMs} ms";

    public double VolumeDb
    {
        get => _settings.VolumeDb;
        set
        {
            var clamped = Math.Clamp(value, AppSettings.MinVolumeDb, AppSettings.MaxVolumeDb);
            if (Math.Abs(_settings.VolumeDb - clamped) < 0.01)
            {
                return;
            }

            _settings.VolumeDb = clamped;
            OnPropertyChanged();
            OnPropertyChanged(nameof(VolumeText));
            _ = _controller.SetVolumeAsync(clamped);
            PersistSettings();
        }
    }

    public string VolumeText => VolumeDb <= AppSettings.MinVolumeDb
        ? "kısık"
        : $"{VolumeDb.ToString("F0", CultureInfo.InvariantCulture)} dB";

    /// <summary>
    /// ALAC is what receivers advertise; raw PCM stays available because it is the simplest thing
    /// to fall back on when a device rejects the encoder.
    /// </summary>
    public bool UseAlac
    {
        get => _settings.Codec == RaopStreamCodec.AppleLossless;
        set
        {
            var codec = value ? RaopStreamCodec.AppleLossless : RaopStreamCodec.RawPcm;
            if (_settings.Codec == codec)
            {
                return;
            }

            _settings.Codec = codec;
            OnPropertyChanged();
            OnPropertyChanged(nameof(CodecHint));
            PersistSettings();
        }
    }

    public bool AutoConnect
    {
        get => _settings.AutoConnect;
        set
        {
            if (_settings.AutoConnect == value)
            {
                return;
            }

            _settings.AutoConnect = value;
            OnPropertyChanged();
            PersistSettings();
        }
    }

    public bool StartMinimized
    {
        get => _settings.StartMinimized;
        set
        {
            if (_settings.StartMinimized == value)
            {
                return;
            }

            _settings.StartMinimized = value;
            OnPropertyChanged();
            PersistSettings();
        }
    }

    public bool MuteLocalSpeakers
    {
        get => _settings.MuteLocalSpeakers;
        set
        {
            if (_settings.MuteLocalSpeakers == value)
            {
                return;
            }

            _settings.MuteLocalSpeakers = value;
            OnPropertyChanged();
            PersistSettings();
        }
    }

    public string CodecHint => UseAlac
        ? "ALAC — cihazın ilan ettiği biçim"
        : "Ham PCM (L16) — yalnızca sorun giderme için";

    public string PositionText
    {
        get => _positionText;
        private set => SetProperty(ref _positionText, value);
    }

    public string ThroughputText
    {
        get => _throughputText;
        private set => SetProperty(ref _throughputText, value);
    }

    public string PacketText
    {
        get => _packetText;
        private set => SetProperty(ref _packetText, value);
    }

    public string CodecText
    {
        get => _codecText;
        private set => SetProperty(ref _codecText, value);
    }

    public float PeakLeft
    {
        get => _peakLeft;
        private set => SetProperty(ref _peakLeft, value);
    }

    public float PeakRight
    {
        get => _peakRight;
        private set => SetProperty(ref _peakRight, value);
    }

    public async Task InitializeAsync()
    {
        LoadCaptureDevices();
        await ScanAsync().ConfigureAwait(true);

        if (_settings.AutoConnect && SelectedDevice is not null)
        {
            await ConnectAsync().ConfigureAwait(true);
        }
    }

    /// <summary>Driven by a dispatcher timer in the view; pulls fresh counters into the bindings.</summary>
    public void RefreshStatistics()
    {
        if (State != StreamState.Streaming)
        {
            return;
        }

        var statistics = _controller.Statistics;

        PositionText = statistics.Position.ToString(@"hh\:mm\:ss", CultureInfo.InvariantCulture);
        PacketText = $"{statistics.PacketsSent:N0} paket · {statistics.SyncPacketsSent:N0} sync";
        CodecText = statistics.IsEncrypted
            ? $"{statistics.Codec} · şifreli"
            : statistics.Codec.ToString();
        PeakLeft = statistics.Level.PeakLeft;
        PeakRight = statistics.Level.PeakRight;

        var kbps = _bitrate.Update(statistics.BytesSent, statistics.Position);
        ThroughputText = kbps <= 0 ? "-" : $"{kbps:N0} kbit/s";
    }

    public async Task ScanAsync()
    {
        var previous = SelectedDevice;
        var found = await _controller.ScanAsync(ScanDuration).ConfigureAwait(true);

        Devices.Clear();
        foreach (var device in found)
        {
            Devices.Add(device);
        }

        OnPropertyChanged(nameof(HasDevices));
        SelectedDevice = Reselect(found, previous, _settings.LastDeviceId, _settings.LastDeviceName);
    }

    /// <summary>
    /// Devices are rebuilt on every scan, so the previous selection has to be matched by identity
    /// rather than by reference.
    /// </summary>
    internal static AirPlayDevice? Reselect(
        IReadOnlyList<AirPlayDevice> devices,
        AirPlayDevice? current,
        string? rememberedId,
        string? rememberedName)
    {
        if (devices.Count == 0)
        {
            return null;
        }

        var wanted = current?.DeviceId ?? rememberedId;
        if (wanted is not null)
        {
            var byId = devices.FirstOrDefault(d =>
                string.Equals(d.DeviceId, wanted, StringComparison.OrdinalIgnoreCase));

            if (byId is not null)
            {
                return byId;
            }
        }

        var wantedName = current?.Name ?? rememberedName;
        if (wantedName is not null)
        {
            var byName = devices.FirstOrDefault(d =>
                string.Equals(d.Name, wantedName, StringComparison.OrdinalIgnoreCase));

            if (byName is not null)
            {
                return byName;
            }
        }

        return devices[0];
    }

    public async Task ConnectAsync()
    {
        if (SelectedDevice is not { } device)
        {
            return;
        }

        _bitrate.Reset();

        var settings = new StreamSettings(
            _settings.CaptureDeviceId,
            _settings.Codec,
            _settings.LatencyMs,
            _settings.VolumeDb,
            MuteLocalSpeakers: _settings.MuteLocalSpeakers);

        await _controller.ConnectAsync(device, settings).ConfigureAwait(true);
    }

    public async Task DisconnectAsync() => await _controller.DisconnectAsync().ConfigureAwait(true);

    public async Task ToggleConnectionAsync()
    {
        if (IsStreaming)
        {
            await DisconnectAsync().ConfigureAwait(true);
        }
        else
        {
            await ConnectAsync().ConfigureAwait(true);
        }
    }

    private void LoadCaptureDevices()
    {
        CaptureDevices.Clear();

        try
        {
            foreach (var device in _captureDevices.GetRenderDevices())
            {
                CaptureDevices.Add(device);
            }
        }
        catch (Exception ex)
        {
            StatusText = $"Ses cihazları listelenemedi: {ex.Message}";
            return;
        }

        _suppressSettingsWrite = true;
        SelectedCaptureDevice =
            CaptureDevices.FirstOrDefault(d => d.Id == _settings.CaptureDeviceId)
            ?? CaptureDevices.FirstOrDefault(d => d.IsDefault)
            ?? CaptureDevices.FirstOrDefault();
        _suppressSettingsWrite = false;
    }

    private void RememberDevice(AirPlayDevice? device)
    {
        if (device is null)
        {
            return;
        }

        _settings.LastDeviceId = device.DeviceId;
        _settings.LastDeviceName = device.Name;
        PersistSettings();
    }

    private void ResetStatistics()
    {
        PositionText = "00:00:00";
        ThroughputText = "-";
        PacketText = "-";
        CodecText = "-";
        PeakLeft = 0;
        PeakRight = 0;
    }

    private void PersistSettings()
    {
        if (!_suppressSettingsWrite)
        {
            _settingsStore.Save(_settings);
        }
    }

    private void RaiseCommandStates()
    {
        ScanCommand.RaiseCanExecuteChanged();
        ConnectCommand.RaiseCanExecuteChanged();
        DisconnectCommand.RaiseCanExecuteChanged();
        ToggleConnectionCommand.RaiseCanExecuteChanged();
    }
}
