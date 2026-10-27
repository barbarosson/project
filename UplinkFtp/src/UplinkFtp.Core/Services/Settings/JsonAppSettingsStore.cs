using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ai;

namespace UplinkFtp.Services.Settings;

/// <summary>JSON file store for <see cref="AppSettings"/> (no secrets).</summary>
public sealed class JsonAppSettingsStore : IAppSettingsStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    private readonly string _filePath;
    private readonly SemaphoreSlim _gate = new(1, 1);

    public JsonAppSettingsStore(string filePath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(filePath);
        _filePath = filePath;
    }

    public string FilePath => _filePath;

    public async Task LoadIntoAsync(AppSettings target, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(target);
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (!File.Exists(_filePath))
            {
                return;
            }

            await using var stream = File.OpenRead(_filePath);
            var dto = await JsonSerializer.DeserializeAsync<AppSettingsDto>(stream, JsonOptions, cancellationToken)
                .ConfigureAwait(false);
            if (dto is null)
            {
                return;
            }

            ApplyDto(dto, target);
        }
        catch (JsonException)
        {
            // Corrupt file — keep in-memory defaults; next Save rewrites.
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task SaveAsync(AppSettings source, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source);
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var dir = Path.GetDirectoryName(_filePath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }

            var dto = ToDto(source);
            await using var stream = File.Create(_filePath);
            await JsonSerializer.SerializeAsync(stream, dto, JsonOptions, cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _gate.Release();
        }
    }

    private static AppSettingsDto ToDto(AppSettings s) => new()
    {
        ConnectTimeoutSeconds = s.ConnectTimeout.TotalSeconds,
        ReadTimeoutSeconds = s.ReadTimeout.TotalSeconds,
        RetryCount = s.RetryCount,
        RetryDelaySeconds = s.RetryDelay.TotalSeconds,
        Theme = s.Theme,
        DefaultProtocol = s.DefaultProtocol,
        TelemetryOptIn = s.TelemetryOptIn,
        AcceptAnyCertificate = s.AcceptAnyCertificate,
        UsePassive = s.UsePassive,
        AiProvider = s.AiProvider,
        AiModel = s.AiModel,
        AiEndpoint = s.AiEndpoint,
        SynchronizedBrowsing = s.SynchronizedBrowsing,
        DefaultConflictAction = s.DefaultConflictAction,
        ConflictAskDefault = s.ConflictAskDefault
    };

    private static void ApplyDto(AppSettingsDto dto, AppSettings target)
    {
        if (dto.ConnectTimeoutSeconds is > 0)
        {
            target.ConnectTimeout = TimeSpan.FromSeconds(Math.Clamp(dto.ConnectTimeoutSeconds.Value, 1, 600));
        }

        if (dto.ReadTimeoutSeconds is > 0)
        {
            target.ReadTimeout = TimeSpan.FromSeconds(Math.Clamp(dto.ReadTimeoutSeconds.Value, 1, 3600));
        }

        if (dto.RetryCount is >= 0)
        {
            target.RetryCount = Math.Clamp(dto.RetryCount.Value, 0, 20);
        }

        if (dto.RetryDelaySeconds is >= 0)
        {
            target.RetryDelay = TimeSpan.FromSeconds(Math.Clamp(dto.RetryDelaySeconds.Value, 0, 120));
        }

        if (!string.IsNullOrWhiteSpace(dto.Theme))
        {
            target.Theme = dto.Theme.Trim();
        }

        if (dto.DefaultProtocol is { } protocol)
        {
            target.DefaultProtocol = protocol;
        }

        if (dto.TelemetryOptIn is { } telemetry)
        {
            target.TelemetryOptIn = telemetry;
        }

        if (dto.AcceptAnyCertificate is { } accept)
        {
            target.AcceptAnyCertificate = accept;
        }

        if (dto.UsePassive is { } passive)
        {
            target.UsePassive = passive;
        }

        if (dto.AiProvider is { } ai)
        {
            target.AiProvider = ai;
        }

        if (dto.AiModel is not null)
        {
            target.AiModel = dto.AiModel;
        }

        if (dto.AiEndpoint is not null)
        {
            target.AiEndpoint = dto.AiEndpoint;
        }

        if (dto.SynchronizedBrowsing is { } sync)
        {
            target.SynchronizedBrowsing = sync;
        }

        if (dto.DefaultConflictAction is { } conflict)
        {
            target.DefaultConflictAction = conflict;
        }

        if (dto.ConflictAskDefault is { } askDefault)
        {
            target.ConflictAskDefault = askDefault;
        }
    }

    private sealed class AppSettingsDto
    {
        public double? ConnectTimeoutSeconds { get; set; }
        public double? ReadTimeoutSeconds { get; set; }
        public int? RetryCount { get; set; }
        public double? RetryDelaySeconds { get; set; }
        public string? Theme { get; set; }
        public RemoteProtocol? DefaultProtocol { get; set; }
        public bool? TelemetryOptIn { get; set; }
        public bool? AcceptAnyCertificate { get; set; }
        public bool? UsePassive { get; set; }
        public AiProviderKind? AiProvider { get; set; }
        public string? AiModel { get; set; }
        public string? AiEndpoint { get; set; }
        public bool? SynchronizedBrowsing { get; set; }
        public TransferConflictAction? DefaultConflictAction { get; set; }
        public TransferConflictAction? ConflictAskDefault { get; set; }
    }
}
