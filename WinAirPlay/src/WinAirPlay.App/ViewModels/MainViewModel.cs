using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Input;
using WinAirPlay.App.Localization;
using WinAirPlay.App.Mvvm;
using WinAirPlay.App.Services;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Discovery;
using WinAirPlay.Core.Raop;

namespace WinAirPlay.App.ViewModels;

public sealed class MainViewModel : ObservableObject
{
    private static readonly TimeSpan ScanDuration = TimeSpan.FromSeconds(15);

    private readonly IStreamController _controller;
    private readonly ISettingsStore _settingsStore;
    private readonly IAudioDeviceEnumerator _captureDevices;
    private readonly IUiDispatcher _dispatcher;
    private readonly ILocalizationService _localization;
    private readonly AppSettings _settings;
    private readonly BitrateEstimator _bitrate = new();

    private AirPlayDevice? _selectedDevice;
    private AudioDeviceInfo? _selectedCaptureDevice;
    private StreamState _state = StreamState.Idle;
    private string _statusText;
    private string _positionText = "00:00";
    private string _throughputText = "-";
    private string _packetText = "-";
    private string _codecText = "-";
    private float _peakLeft;
    private float _peakRight;
    private bool _suppressSettingsWrite;
    private CancellationTokenSource? _settingsPersistDebounce;

    public MainViewModel(
        IStreamController controller,
        ISettingsStore settingsStore,
        IAudioDeviceEnumerator captureDevices,
        IUiDispatcher dispatcher,
        ILocalizationService localization)
    {
        _controller = controller ?? throw new ArgumentNullException(nameof(controller));
        _settingsStore = settingsStore ?? throw new ArgumentNullException(nameof(settingsStore));
        _captureDevices = captureDevices ?? throw new ArgumentNullException(nameof(captureDevices));
        _dispatcher = dispatcher ?? throw new ArgumentNullException(nameof(dispatcher));
        _localization = localization ?? throw new ArgumentNullException(nameof(localization));

        _settings = _settingsStore.Load().Normalize();
        _statusText = _localization.Get(LocKeys.Ready);

        _controller.StateChanged += (_, state) => _dispatcher.Post(() => State = state);
        _controller.StatusChanged += (_, message) => _dispatcher.Post(() => StatusText = message);

        ScanCommand = new AsyncRelayCommand(ScanAsync, () => State is StreamState.Idle or StreamState.Streaming);
        ConnectCommand = new AsyncRelayCommand(ConnectAsync, () => CanConnect);
        DisconnectCommand = new AsyncRelayCommand(DisconnectAsync, () => CanDisconnect);
        ToggleConnectionCommand = new AsyncRelayCommand(ToggleConnectionAsync, () => CanConnect || CanDisconnect);
        IncreaseLatencyCommand = new RelayCommand(
            () => LatencyMs += AppSettings.LatencyStepMs,
            () => LatencyMs < AppSettings.MaxLatencyMs);
        DecreaseLatencyCommand = new RelayCommand(
            () => LatencyMs -= AppSettings.LatencyStepMs,
            () => LatencyMs > AppSettings.MinLatencyMs);
    }

    public ObservableCollection<AirPlayDevice> Devices { get; } = new();

    public ObservableCollection<AudioDeviceInfo> CaptureDevices { get; } = new();

    public AsyncRelayCommand ScanCommand { get; }

    public AsyncRelayCommand ConnectCommand { get; }

    public AsyncRelayCommand DisconnectCommand { get; }

    public AsyncRelayCommand ToggleConnectionCommand { get; }

    public ICommand IncreaseLatencyCommand { get; }

    public ICommand DecreaseLatencyCommand { get; }

    public string TargetDeviceCaption => _localization.Get(LocKeys.TargetDevice);
    public string AudioSourceCaption => _localization.Get(LocKeys.AudioSource);
    public string BufferLatencyCaption => _localization.Get(LocKeys.BufferLatency);
    public string VolumeCaption => _localization.Get(LocKeys.Volume);
    public string StreamingCaption => _localization.Get(LocKeys.Streaming);
    public string DurationCaption => _localization.Get(LocKeys.Duration);
    public string ThroughputCaption => _localization.Get(LocKeys.Throughput);
    public string PacketsCaption => _localization.Get(LocKeys.Packets);
    public string EncodingCaption => _localization.Get(LocKeys.Encoding);
    public string ScanButtonText => _localization.Get(LocKeys.Scan);
    public string LatencyHint => _localization.Get(LocKeys.LatencyHint);
    public string AlacEncodingText => _localization.Get(LocKeys.AlacEncoding);
    public string MuteSpeakersText => _localization.Get(LocKeys.MuteSpeakers);
    public string MuteSpeakersHint => _localization.Get(LocKeys.MuteSpeakersHint);
    public string RoutingCaption => _localization.Get(LocKeys.RoutingCaption);
    public string FollowWindowsVolumeText => _localization.Get(LocKeys.FollowWindowsVolume);
    public string FollowWindowsVolumeHint => _localization.Get(LocKeys.FollowWindowsVolumeHint);
    public string VolumeHint => _localization.Get(LocKeys.VolumeHint);
    public string AutoConnectText => _localization.Get(LocKeys.AutoConnect);
    public string StartMinimizedText => _localization.Get(LocKeys.StartMinimized);
    public string NoDevicesText => _localization.Get(LocKeys.NoDevices);

    public System.Windows.Media.ImageSource AppLogo => Branding.AppBranding.GetLogo(48);

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
            if (value is not null && VirtualAudioDeviceCatalog.IsVirtualRenderDevice(value.Name))
            {
                _settings.PreferredVirtualDeviceId = value.Id;
            }

            PersistSettings();
            NotifyRoutingState();
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
            OnPropertyChanged(nameof(IsMuteSpeakersEnabled));
            OnPropertyChanged(nameof(IsFollowWindowsVolumeEnabled));
            RaiseCommandStates();
        }
    }

    public bool IsStreaming => State == StreamState.Streaming;

    public bool IsBusy => State is StreamState.Scanning or StreamState.Connecting or StreamState.Stopping;

    public bool CanConnect => State is StreamState.Idle or StreamState.Faulted && SelectedDevice is not null;

    public bool HasDevices => Devices.Count > 0;

    public bool CanDisconnect => State == StreamState.Streaming;

    public string ConnectionButtonText =>
        IsStreaming ? _localization.Get(LocKeys.Disconnect) : _localization.Get(LocKeys.Connect);

    public string StateText => State switch
    {
        StreamState.Idle => _localization.Get(LocKeys.StateIdle),
        StreamState.Scanning => _localization.Get(LocKeys.StateScanning),
        StreamState.Connecting => _localization.Get(LocKeys.StateConnecting),
        StreamState.Streaming => _localization.Get(LocKeys.StateStreaming),
        StreamState.Stopping => _localization.Get(LocKeys.StateStopping),
        StreamState.Faulted => _localization.Get(LocKeys.StateFaulted),
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
            RaiseLatencyCommandStates();
            PersistSettingsDebounced();
        }
    }

    public string LatencyText => _localization.Format(LocKeys.LatencyMs, LatencyMs);

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
            OnPropertyChanged(nameof(VolumePercent));
            OnPropertyChanged(nameof(VolumeText));
            _ = _controller.SetVolumeAsync(clamped);
            PersistSettingsDebounced();
        }
    }

    public double VolumePercent
    {
        get => AppSettings.DbToPercent(_settings.VolumeDb);
        set => VolumeDb = AppSettings.PercentToDb(value);
    }

    public string VolumeText =>
        $"{VolumePercent.ToString("F0", CultureInfo.InvariantCulture)}%";

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

    public AudioRoutingMode RoutingMode
    {
        get => _settings.RoutingMode;
        set
        {
            if (_settings.RoutingMode == value)
            {
                return;
            }

            _settings.RoutingMode = value;
            OnPropertyChanged();
            NotifyRoutingState();
            PersistSettings();
        }
    }

    public bool FollowWindowsVolume
    {
        get => _settings.FollowWindowsVolume;
        set
        {
            if (_settings.FollowWindowsVolume == value)
            {
                return;
            }

            _settings.FollowWindowsVolume = value;
            OnPropertyChanged();
            PersistSettings();
        }
    }

    public IReadOnlyList<RoutingModeOption> RoutingOptions =>
    [
        new(AudioRoutingMode.Auto, _localization.Get(LocKeys.RoutingAuto)),
        new(AudioRoutingMode.VirtualCable, _localization.Get(LocKeys.RoutingVirtual)),
        new(AudioRoutingMode.MuteSpeakers, _localization.Get(LocKeys.RoutingMute)),
    ];

    public AudioDeviceInfo? DetectedVirtualDevice =>
        VirtualAudioDeviceCatalog.Pick(CaptureDevices, _settings.PreferredVirtualDeviceId);

    public bool HasVirtualAudioDevice => DetectedVirtualDevice is not null;

    public bool IsMuteSpeakersEnabled =>
        !IsStreaming && (RoutingMode == AudioRoutingMode.MuteSpeakers || !HasVirtualAudioDevice);

    /// <summary>
    /// Redirected virtual-cable capture already includes endpoint volume; the checkbox is inherent.
    /// </summary>
    public bool IsFollowWindowsVolumeEnabled =>
        !IsStreaming && (RoutingMode == AudioRoutingMode.MuteSpeakers || !HasVirtualAudioDevice);

    public string RoutingHint
    {
        get
        {
            var virtualDevice = DetectedVirtualDevice;
            if (virtualDevice is not null && RoutingMode is AudioRoutingMode.Auto or AudioRoutingMode.VirtualCable)
            {
                return _localization.Format(LocKeys.RoutingHintRedirect, virtualDevice.Name);
            }

            if (RoutingMode == AudioRoutingMode.VirtualCable && virtualDevice is null)
            {
                return _localization.Get(LocKeys.RoutingHintNoCable);
            }

            return _localization.Get(LocKeys.RoutingHintMute);
        }
    }

    public string CodecHint => UseAlac
        ? _localization.Get(LocKeys.CodecAlacHint)
        : _localization.Get(LocKeys.CodecPcmHint);

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
        PacketText = _localization.Format(
            LocKeys.PacketsSync,
            statistics.PacketsSent.ToString("N0", CultureInfo.InvariantCulture),
            statistics.SyncPacketsSent.ToString("N0", CultureInfo.InvariantCulture));
        CodecText = statistics.IsEncrypted
            ? _localization.Format(LocKeys.CodecEncrypted, statistics.Codec)
            : statistics.Codec.ToString();
        PeakLeft = statistics.Level.PeakLeft;
        PeakRight = statistics.Level.PeakRight;

        var kbps = _bitrate.Update(statistics.BytesSent, statistics.Position);
        ThroughputText = kbps <= 0
            ? "-"
            : _localization.Format(LocKeys.ThroughputKbps, kbps.ToString("N0", CultureInfo.InvariantCulture));
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
            MuteLocalSpeakers: _settings.MuteLocalSpeakers,
            RoutingMode: _settings.RoutingMode,
            FollowWindowsVolume: _settings.FollowWindowsVolume,
            PreferredVirtualDeviceId: _settings.PreferredVirtualDeviceId);

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
            StatusText = _localization.Format(LocKeys.CaptureDevicesFailed, ex.Message);
            return;
        }

        _suppressSettingsWrite = true;
        SelectedCaptureDevice =
            CaptureDevices.FirstOrDefault(d => d.Id == _settings.CaptureDeviceId)
            ?? CaptureDevices.FirstOrDefault(d => d.IsDefault)
            ?? CaptureDevices.FirstOrDefault();
        _suppressSettingsWrite = false;
        NotifyRoutingState();
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

    /// <summary>Slider drags can fire dozens of times a second; debounce disk writes.</summary>
    private void PersistSettingsDebounced()
    {
        if (_suppressSettingsWrite)
        {
            return;
        }

        _settingsPersistDebounce?.Cancel();
        _settingsPersistDebounce = new CancellationTokenSource();
        var token = _settingsPersistDebounce.Token;

        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(400, token).ConfigureAwait(false);
                _settingsStore.Save(_settings);
            }
            catch (OperationCanceledException)
            {
                // Superseded by a newer value.
            }
        }, token);
    }

    private void RaiseLatencyCommandStates()
    {
        ((RelayCommand)IncreaseLatencyCommand).RaiseCanExecuteChanged();
        ((RelayCommand)DecreaseLatencyCommand).RaiseCanExecuteChanged();
    }

    private void RaiseCommandStates()
    {
        ScanCommand.RaiseCanExecuteChanged();
        ConnectCommand.RaiseCanExecuteChanged();
        DisconnectCommand.RaiseCanExecuteChanged();
        ToggleConnectionCommand.RaiseCanExecuteChanged();
    }

    private void NotifyRoutingState()
    {
        OnPropertyChanged(nameof(DetectedVirtualDevice));
        OnPropertyChanged(nameof(HasVirtualAudioDevice));
        OnPropertyChanged(nameof(IsMuteSpeakersEnabled));
        OnPropertyChanged(nameof(IsFollowWindowsVolumeEnabled));
        OnPropertyChanged(nameof(RoutingHint));
    }
}
