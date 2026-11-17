using System.Text.Json;
using System.Text.Json.Serialization;
using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Simple LocalAppData JSON settings — works for unpackaged Debug and MSIX.
/// </summary>
public sealed class UserSettingsStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly string _path;
    private readonly object _gate = new();
    private UserSettings _settings;

    public UserSettingsStore()
    {
        DataDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PurePerformance");
        Directory.CreateDirectory(DataDirectory);
        _path = Path.Combine(DataDirectory, "user-settings.json");
        _settings = Load();
        EnsureDefaults();
    }

    public string DataDirectory { get; }

    public string ReportsDirectory => Path.Combine(DataDirectory, "reports");

    public AppThemePreference Theme
    {
        get { lock (_gate) return _settings.Theme; }
        set
        {
            lock (_gate)
            {
                if (_settings.Theme == value) return;
                _settings.Theme = value;
                SaveUnlocked();
            }
        }
    }

    public AccentPack Accent
    {
        get { lock (_gate) return _settings.Accent; }
        set
        {
            lock (_gate)
            {
                if (_settings.Accent == value) return;
                _settings.Accent = value;
                SaveUnlocked();
            }
        }
    }

    public ScanScheduleSettings ScanSchedule
    {
        get
        {
            lock (_gate) return CloneSchedule(_settings.ScanSchedule);
        }
        set
        {
            lock (_gate)
            {
                _settings.ScanSchedule = CloneSchedule(value);
                SaveUnlocked();
            }
        }
    }

    public AlertSettings Alerts
    {
        get
        {
            lock (_gate) return CloneAlerts(_settings.Alerts);
        }
        set
        {
            lock (_gate)
            {
                _settings.Alerts = CloneAlerts(value);
                SaveUnlocked();
            }
        }
    }

    public string ActiveProfileId
    {
        get { lock (_gate) return _settings.ActiveProfileId; }
        set
        {
            lock (_gate)
            {
                _settings.ActiveProfileId = value;
                SaveUnlocked();
            }
        }
    }

    /// <summary>OpenAI-compatible base URL (no secrets). Default targets the public OpenAI v1 root.</summary>
    public string AiBaseUrl
    {
        get { lock (_gate) return _settings.AiBaseUrl; }
        set
        {
            lock (_gate)
            {
                _settings.AiBaseUrl = string.IsNullOrWhiteSpace(value)
                    ? "https://api.openai.com/v1"
                    : value.Trim();
                SaveUnlocked();
            }
        }
    }

    public string AiModel
    {
        get { lock (_gate) return _settings.AiModel; }
        set
        {
            lock (_gate)
            {
                _settings.AiModel = string.IsNullOrWhiteSpace(value) ? "gpt-4o-mini" : value.Trim();
                SaveUnlocked();
            }
        }
    }

    public IReadOnlyList<WhitelistRule> GetWhitelist()
    {
        lock (_gate) return _settings.Whitelist.Select(CloneRule).ToList();
    }

    public void SaveWhitelist(IEnumerable<WhitelistRule> rules)
    {
        lock (_gate)
        {
            _settings.Whitelist = rules.Select(CloneRule).ToList();
            SaveUnlocked();
        }
    }

    public IReadOnlyList<AutoOptimizationRule> GetAutoRules()
    {
        lock (_gate) return _settings.AutoRules.Select(CloneAuto).ToList();
    }

    public void SaveAutoRules(IEnumerable<AutoOptimizationRule> rules)
    {
        lock (_gate)
        {
            _settings.AutoRules = rules.Select(CloneAuto).ToList();
            SaveUnlocked();
        }
    }

    public IReadOnlyList<PcProfile> GetProfiles()
    {
        lock (_gate) return _settings.Profiles.Select(CloneProfile).ToList();
    }

    public void SaveProfiles(IEnumerable<PcProfile> profiles)
    {
        lock (_gate)
        {
            _settings.Profiles = profiles.Select(CloneProfile).ToList();
            SaveUnlocked();
        }
    }

    public IReadOnlyList<AlertHistoryEntry> GetAlertHistory()
    {
        lock (_gate) return _settings.AlertHistory.Select(CloneAlert).ToList();
    }

    public void AppendAlert(AlertHistoryEntry entry, int maxKeep = 200)
    {
        lock (_gate)
        {
            _settings.AlertHistory.Add(CloneAlert(entry));
            if (_settings.AlertHistory.Count > maxKeep)
            {
                _settings.AlertHistory = _settings.AlertHistory
                    .OrderByDescending(a => a.Timestamp)
                    .Take(maxKeep)
                    .ToList();
            }

            SaveUnlocked();
        }
    }

    public void ClearAlertHistory()
    {
        lock (_gate)
        {
            _settings.AlertHistory.Clear();
            SaveUnlocked();
        }
    }

    private void EnsureDefaults()
    {
        lock (_gate)
        {
            var dirty = false;
            if (_settings.Profiles.Count == 0)
            {
                var local = new PcProfile
                {
                    DisplayName = "This PC",
                    MachineName = Environment.MachineName,
                    IsLocal = true,
                    UpdatedUtc = DateTimeOffset.UtcNow
                };
                _settings.Profiles.Add(local);
                _settings.ActiveProfileId = local.Id;
                dirty = true;
            }
            else if (string.IsNullOrWhiteSpace(_settings.ActiveProfileId))
            {
                _settings.ActiveProfileId = _settings.Profiles[0].Id;
                dirty = true;
            }

            if (dirty)
            {
                SaveUnlocked();
            }
        }
    }

    private UserSettings Load()
    {
        try
        {
            if (!File.Exists(_path))
            {
                return new UserSettings();
            }

            var json = File.ReadAllText(_path);
            return JsonSerializer.Deserialize<UserSettings>(json, JsonOptions) ?? new UserSettings();
        }
        catch
        {
            return new UserSettings();
        }
    }

    private void SaveUnlocked()
    {
        try
        {
            var json = JsonSerializer.Serialize(_settings, JsonOptions);
            File.WriteAllText(_path, json);
        }
        catch
        {
            // Non-fatal — in-memory settings still apply for this session.
        }
    }

    private static ScanScheduleSettings CloneSchedule(ScanScheduleSettings s) => new()
    {
        IsEnabled = s.IsEnabled,
        Cadence = s.Cadence,
        PreferredHourLocal = s.PreferredHourLocal,
        LastRunUtc = s.LastRunUtc,
        LastReportUtc = s.LastReportUtc,
        LastReportPath = s.LastReportPath,
        EmailStubEnabled = s.EmailStubEnabled,
        EmailStubAddress = s.EmailStubAddress
    };

    private static AlertSettings CloneAlerts(AlertSettings a) => new()
    {
        IsEnabled = a.IsEnabled,
        CpuSpikePercent = a.CpuSpikePercent,
        DiskSpikePercent = a.DiskSpikePercent,
        CooldownSeconds = a.CooldownSeconds
    };

    private static WhitelistRule CloneRule(WhitelistRule r) => new()
    {
        Id = r.Id,
        Pattern = r.Pattern,
        Scope = r.Scope,
        Notes = r.Notes,
        IsEnabled = r.IsEnabled
    };

    private static AutoOptimizationRule CloneAuto(AutoOptimizationRule r) => new()
    {
        Id = r.Id,
        Name = r.Name,
        Condition = r.Condition,
        Threshold = r.Threshold,
        Action = r.Action,
        IsEnabled = r.IsEnabled,
        AutoApply = r.AutoApply,
        LastResult = r.LastResult
    };

    private static PcProfile CloneProfile(PcProfile p) => new()
    {
        Id = p.Id,
        DisplayName = p.DisplayName,
        MachineName = p.MachineName,
        UpdatedUtc = p.UpdatedUtc,
        IsLocal = p.IsLocal
    };

    private static AlertHistoryEntry CloneAlert(AlertHistoryEntry a) => new()
    {
        Timestamp = a.Timestamp,
        Kind = a.Kind,
        Message = a.Message,
        Value = a.Value
    };

    private sealed class UserSettings
    {
        public AppThemePreference Theme { get; set; } = AppThemePreference.System;

        public AccentPack Accent { get; set; } = AccentPack.System;

        public ScanScheduleSettings ScanSchedule { get; set; } = new();

        public AlertSettings Alerts { get; set; } = new();

        public List<WhitelistRule> Whitelist { get; set; } = new();

        public List<AutoOptimizationRule> AutoRules { get; set; } = new();

        public List<PcProfile> Profiles { get; set; } = new();

        public string ActiveProfileId { get; set; } = string.Empty;

        public List<AlertHistoryEntry> AlertHistory { get; set; } = new();

        public string AiBaseUrl { get; set; } = "https://api.openai.com/v1";

        public string AiModel { get; set; } = "gpt-4o-mini";
    }
}
