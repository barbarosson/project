using System.Diagnostics.Eventing.Reader;
using System.Runtime.CompilerServices;
using PurePerformance.Helpers;
using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Reads Application + System Event Viewer logs asynchronously and maps relevant
/// Errors/Warnings into plain-English <see cref="CrashEvent"/> findings.
/// </summary>
public sealed class EventLogService : IEventLogService
{
    private static readonly string[] TargetLogs = ["Application", "System"];

    public async IAsyncEnumerable<CrashEvent> AnalyzeAsync(
        CrashLookback lookback,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var since = DateTime.Now - TimeSpan.FromHours((int)lookback);

        // Offload Event Log I/O so the WinUI dispatcher never blocks.
        var channel = System.Threading.Channels.Channel.CreateUnbounded<CrashEvent>(
            new System.Threading.Channels.UnboundedChannelOptions
            {
                SingleReader = true,
                SingleWriter = true
            });

        var producer = Task.Run(
            () => ProduceEvents(since, channel.Writer, cancellationToken),
            cancellationToken);

        await foreach (var item in channel.Reader.ReadAllAsync(cancellationToken).ConfigureAwait(false))
        {
            yield return item;
        }

        await producer.ConfigureAwait(false);
    }

    private static void ProduceEvents(
        DateTime since,
        System.Threading.Channels.ChannelWriter<CrashEvent> writer,
        CancellationToken cancellationToken)
    {
        try
        {
            foreach (var logName in TargetLogs)
            {
                cancellationToken.ThrowIfCancellationRequested();

                foreach (var crash in ReadLog(logName, since, cancellationToken))
                {
                    if (!writer.TryWrite(crash))
                    {
                        break;
                    }
                }
            }

            writer.TryComplete();
        }
        catch (OperationCanceledException)
        {
            writer.TryComplete();
        }
        catch (Exception ex)
        {
            writer.TryComplete(ex);
        }
    }

    /// <summary>
    /// Collects findings then returns them. Avoids yield inside try/catch (CS1626 / CS1631).
    /// </summary>
    private static IEnumerable<CrashEvent> ReadLog(
        string logName,
        DateTime since,
        CancellationToken cancellationToken)
    {
        var results = new List<CrashEvent>();

        // XPath: Errors (Level=2) and Warnings (Level=3) after the lookback window.
        var queryText =
            $"*[System[(Level=2 or Level=3) and TimeCreated[@SystemTime>='{since.ToUniversalTime():yyyy-MM-ddTHH:mm:ss.fffZ}']]]";

        EventLogReader? reader = null;
        CrashEvent? openError = null;
        var notFound = false;

        try
        {
            var query = new EventLogQuery(logName, PathType.LogName, queryText)
            {
                ReverseDirection = true
            };
            reader = new EventLogReader(query);
        }
        catch (EventLogNotFoundException)
        {
            notFound = true;
        }
        catch (UnauthorizedAccessException)
        {
            openError = new CrashEvent
            {
                Timestamp = DateTimeOffset.Now,
                LogName = logName,
                ProviderName = "PurePerformance",
                EventId = 0,
                Severity = CrashSeverity.Warning,
                Category = CrashCategory.Other,
                Title = $"Access denied reading the {logName} log",
                Explanation =
                    "Windows blocked reading this Event Viewer log. " +
                    "This can happen under restricted accounts or when a security policy denies log access.",
                RecommendedFix =
                    "1) Sign in with an account that can open Event Viewer. " +
                    "2) If your organization manages this PC, ask IT for Event Log read permission. " +
                    "3) Re-run Crash Analyzer after permissions are fixed. " +
                    "Elevation is usually not required for standard Application/System log reads.",
                RawMessage = null
            };
        }
        catch (EventLogException ex)
        {
            openError = new CrashEvent
            {
                Timestamp = DateTimeOffset.Now,
                LogName = logName,
                ProviderName = "PurePerformance",
                EventId = 0,
                Severity = CrashSeverity.Warning,
                Category = CrashCategory.Other,
                Title = $"Could not open the {logName} log",
                Explanation = $"Event Viewer returned an error while opening this log: {ex.Message}",
                RecommendedFix =
                    "Open Event Viewer manually (eventvwr.msc) and confirm the log exists. " +
                    "If the log is corrupted, clear or rebuild it from Event Viewer after backing up.",
                RawMessage = ex.ToString()
            };
        }

        if (notFound)
        {
            return results;
        }

        if (openError is not null)
        {
            results.Add(openError);
            return results;
        }

        if (reader is null)
        {
            return results;
        }

        using (reader)
        {
            for (;;)
            {
                cancellationToken.ThrowIfCancellationRequested();

                EventRecord? record = null;
                var readFailed = false;

                try
                {
                    record = reader.ReadEvent();
                }
                catch (EventLogException)
                {
                    readFailed = true;
                }

                if (readFailed)
                {
                    break;
                }

                if (record is null)
                {
                    break;
                }

                using (record)
                {
                    if (!IsRelevant(record, out var rawMessage))
                    {
                        continue;
                    }

                    var provider = record.ProviderName ?? "Unknown";
                    var eventId = record.Id;
                    var (category, title, explanation, fix) =
                        CrashExplanationCatalog.Describe(provider, eventId, rawMessage);

                    var severity = record.Level switch
                    {
                        1 or 2 => CrashSeverity.Error,
                        3 => CrashSeverity.Warning,
                        _ => CrashSeverity.Warning
                    };

                    if (record.Level == 1)
                    {
                        severity = CrashSeverity.Critical;
                    }

                    results.Add(new CrashEvent
                    {
                        Timestamp = record.TimeCreated.HasValue
                            ? new DateTimeOffset(DateTime.SpecifyKind(record.TimeCreated.Value, DateTimeKind.Local))
                            : DateTimeOffset.Now,
                        LogName = logName,
                        ProviderName = provider,
                        EventId = eventId,
                        Severity = severity,
                        Category = category,
                        Title = title,
                        Explanation = explanation,
                        RecommendedFix = fix,
                        RawMessage = Truncate(rawMessage, 800)
                    });
                }
            }
        }

        return results;
    }

    /// <summary>
    /// Keeps kernel-power, hangs, disk errors, BSODs, and closely related stability signals.
    /// </summary>
    private static bool IsRelevant(EventRecord record, out string? message)
    {
        message = null;
        try
        {
            message = record.FormatDescription();
        }
        catch
        {
            message = null;
        }

        var provider = record.ProviderName ?? string.Empty;
        var id = record.Id;
        var text = message ?? string.Empty;

        if (provider.Contains("Kernel-Power", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (provider.Contains("BugCheck", StringComparison.OrdinalIgnoreCase)
            || provider.Contains("WER-SystemErrorReporting", StringComparison.OrdinalIgnoreCase)
            || (id == 1001 && provider.Contains("Windows Error Reporting", StringComparison.OrdinalIgnoreCase)
                && (text.Contains("bugcheck", StringComparison.OrdinalIgnoreCase)
                    || text.Contains("blue screen", StringComparison.OrdinalIgnoreCase))))
        {
            return true;
        }

        if (id == 1002
            || provider.Contains("Application Hang", StringComparison.OrdinalIgnoreCase)
            || (provider.Contains("Application Error", StringComparison.OrdinalIgnoreCase) && id == 1000))
        {
            return true;
        }

        if (provider.Equals("disk", StringComparison.OrdinalIgnoreCase)
            || provider.Contains("Ntfs", StringComparison.OrdinalIgnoreCase)
            || provider.Contains("storahci", StringComparison.OrdinalIgnoreCase)
            || provider.Contains("stornvme", StringComparison.OrdinalIgnoreCase)
            || provider.Contains("Disk", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (text.Contains("unexpected shutdown", StringComparison.OrdinalIgnoreCase)
            || text.Contains("was restarted without first shutting down", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static string? Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value) || value.Length <= max)
        {
            return value;
        }

        return value[..max] + "…";
    }
}
