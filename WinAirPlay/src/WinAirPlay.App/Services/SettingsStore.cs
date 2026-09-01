using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WinAirPlay.App.Services;

public interface ISettingsStore
{
    AppSettings Load();

    void Save(AppSettings settings);
}

/// <summary>
/// Stores settings as JSON under <c>%APPDATA%\WinAirPlay</c>. A corrupt or unreadable file is
/// never fatal: the app falls back to defaults rather than refusing to start.
/// </summary>
public sealed class JsonSettingsStore : ISettingsStore
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly string _path;

    public JsonSettingsStore() : this(DefaultPath())
    {
    }

    public JsonSettingsStore(string path) => _path = path;

    public static string DefaultPath() => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "WinAirPlay",
        "settings.json");

    public AppSettings Load()
    {
        try
        {
            if (!File.Exists(_path))
            {
                return new AppSettings();
            }

            var json = File.ReadAllText(_path);
            return JsonSerializer.Deserialize<AppSettings>(json, SerializerOptions)?.Normalize()
                   ?? new AppSettings();
        }
        catch (Exception)
        {
            return new AppSettings();
        }
    }

    public void Save(AppSettings settings)
    {
        ArgumentNullException.ThrowIfNull(settings);

        try
        {
            var directory = Path.GetDirectoryName(_path);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            File.WriteAllText(_path, JsonSerializer.Serialize(settings.Normalize(), SerializerOptions));
        }
        catch (Exception)
        {
            // Losing preferences is not worth interrupting playback for.
        }
    }
}
