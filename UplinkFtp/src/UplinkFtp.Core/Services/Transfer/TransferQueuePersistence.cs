using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;

namespace UplinkFtp.Services.Transfer;

/// <summary>Persists Queued / Failed / Paused jobs across app restarts (JSON under LocalAppData).</summary>
public interface ITransferQueuePersistence
{
    string FilePath { get; }

    Task SaveAsync(IEnumerable<TransferJob> jobs, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TransferJob>> LoadAsync(CancellationToken cancellationToken = default);
}

public sealed class JsonTransferQueuePersistence : ITransferQueuePersistence
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    private readonly string _filePath;
    private readonly SemaphoreSlim _gate = new(1, 1);

    public JsonTransferQueuePersistence(string filePath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(filePath);
        _filePath = filePath;
    }

    public string FilePath => _filePath;

    public async Task SaveAsync(IEnumerable<TransferJob> jobs, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(jobs);
        var persistable = jobs
            .Where(j => j.State is TransferJobState.Queued or TransferJobState.Failed or TransferJobState.Paused)
            .Select(ToDto)
            .ToList();

        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var dir = Path.GetDirectoryName(_filePath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }

            await using var stream = File.Create(_filePath);
            await JsonSerializer.SerializeAsync(
                stream,
                new QueueDocument { Jobs = persistable },
                JsonOptions,
                cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<IReadOnlyList<TransferJob>> LoadAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (!File.Exists(_filePath))
            {
                return [];
            }

            await using var stream = File.OpenRead(_filePath);
            var doc = await JsonSerializer.DeserializeAsync<QueueDocument>(stream, JsonOptions, cancellationToken)
                .ConfigureAwait(false);
            if (doc?.Jobs is null || doc.Jobs.Count == 0)
            {
                return [];
            }

            return doc.Jobs.Select(FromDto).ToList();
        }
        catch (JsonException)
        {
            return [];
        }
        finally
        {
            _gate.Release();
        }
    }

    private static PersistedJob ToDto(TransferJob j) => new()
    {
        Id = j.Id,
        Direction = j.Direction,
        Source = j.Source,
        Destination = j.Destination,
        IsDirectory = j.IsDirectory,
        ConflictAction = j.ConflictPolicy.Action,
        PromptPerFile = j.ConflictPolicy.PromptPerFile,
        DisplayName = j.DisplayName,
        EnqueuedAt = j.EnqueuedAt,
        State = j.State is TransferJobState.Running ? TransferJobState.Queued : j.State,
        ProgressPercent = j.ProgressPercent,
        BytesTransferred = j.BytesTransferred,
        TotalBytes = j.TotalBytes,
        ResumeOffsetBytes = j.ResumeOffsetBytes,
        SupportsResume = j.SupportsResume,
        CompletedRelativePaths = j.CompletedRelativePaths.ToList(),
        Detail = j.Detail,
        Error = j.Error
    };

    private static TransferJob FromDto(PersistedJob d) => new()
    {
        Id = d.Id == Guid.Empty ? Guid.NewGuid() : d.Id,
        Direction = d.Direction,
        Source = d.Source ?? string.Empty,
        Destination = d.Destination ?? string.Empty,
        IsDirectory = d.IsDirectory,
        ConflictPolicy = new TransferConflictPolicy
        {
            Action = d.ConflictAction,
            PromptPerFile = d.PromptPerFile
        },
        DisplayName = d.DisplayName ?? Path.GetFileName(d.Source ?? string.Empty),
        EnqueuedAt = d.EnqueuedAt == default ? DateTimeOffset.Now : d.EnqueuedAt,
        State = d.State is TransferJobState.Running or TransferJobState.Successful
            ? TransferJobState.Queued
            : d.State,
        ProgressPercent = d.ProgressPercent,
        BytesTransferred = d.BytesTransferred,
        TotalBytes = d.TotalBytes,
        ResumeOffsetBytes = d.ResumeOffsetBytes,
        SupportsResume = d.SupportsResume,
        CompletedRelativePaths = new HashSet<string>(
            d.CompletedRelativePaths ?? [],
            StringComparer.OrdinalIgnoreCase),
        Detail = d.Detail,
        Error = d.Error
    };

    private sealed class QueueDocument
    {
        public List<PersistedJob> Jobs { get; set; } = [];
    }

    private sealed class PersistedJob
    {
        public Guid Id { get; set; }
        public TransferDirection Direction { get; set; }
        public string? Source { get; set; }
        public string? Destination { get; set; }
        public bool IsDirectory { get; set; }
        public TransferConflictAction ConflictAction { get; set; }
        public bool PromptPerFile { get; set; }
        public string? DisplayName { get; set; }
        public DateTimeOffset EnqueuedAt { get; set; }
        public TransferJobState State { get; set; }
        public double ProgressPercent { get; set; }
        public long BytesTransferred { get; set; }
        public long? TotalBytes { get; set; }
        public long ResumeOffsetBytes { get; set; }
        public bool SupportsResume { get; set; }
        public List<string>? CompletedRelativePaths { get; set; }
        public string? Detail { get; set; }
        public string? Error { get; set; }
    }
}
