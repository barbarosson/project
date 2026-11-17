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
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PurePerformance");
        Directory.CreateDirectory(dir);
        _path = Path.Combine(dir, "user-settings.json");
        _settings = Load();
    }

    public AppThemePreference Theme
    {
        get
        {
            lock (_gate) return _settings.Theme;
        }
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
            // Non-fatal — theme still applies for this session.
        }
    }

    private sealed class UserSettings
    {
        public AppThemePreference Theme { get; set; } = AppThemePreference.System;
    }
}
