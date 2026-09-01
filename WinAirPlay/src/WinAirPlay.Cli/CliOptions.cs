using WinAirPlay.Core.Raop;

namespace WinAirPlay.Cli;

public enum CliCommand
{
    Capture,
    ListDevices,
    Scan,
    Connect,
    Stream,
    Help,
}

public sealed class CliOptions
{
    public CliCommand Command { get; init; } = CliCommand.Capture;

    public string OutputPath { get; init; } = "test_capture.wav";

    /// <summary>
    /// For <see cref="CliCommand.Capture"/>: auto-stop after this many seconds, <c>null</c> means
    /// "run until Enter". For <see cref="CliCommand.Scan"/>: how long to listen for mDNS answers.
    /// </summary>
    public int? DurationSeconds { get; init; }

    public string? DeviceId { get; init; }

    public bool EmitSilenceWhenIdle { get; init; }

    /// <summary>Print every TXT record of discovered devices.</summary>
    public bool Verbose { get; init; }

    /// <summary>
    /// Which discovered device to connect to: list index, name, IP address or hardware id.
    /// <c>null</c> asks interactively.
    /// </summary>
    public string? Target { get; init; }

    public RaopStreamCodec Codec { get; init; } = RaopStreamCodec.AppleLossless;

    public bool Encrypt { get; init; }

    /// <summary>Stream buffer ahead of the play position. <c>null</c> uses the AirPlay default.</summary>
    public int? LatencyMs { get; init; }

    /// <summary>Diagnostic override for L16 byte order; <c>null</c> follows the codec.</summary>
    public bool? ForceBigEndianPayload { get; init; }

    /// <summary>When true, PC speakers keep playing alongside AirPlay.</summary>
    public bool KeepLocalSpeakers { get; init; }

    public static CliOptions Parse(string[] args)
    {
        var command = CliCommand.Capture;
        var output = "test_capture.wav";
        int? duration = null;
        string? deviceId = null;
        string? target = null;
        var silence = false;
        var verbose = false;
        var codec = RaopStreamCodec.AppleLossless;
        int? latencyMs = null;
        bool? bigEndian = null;
        var encrypt = false;
        var keepSpeakers = false;

        for (var i = 0; i < args.Length; i++)
        {
            var arg = args[i];
            switch (arg.ToLowerInvariant())
            {
                case "list":
                case "--list":
                case "-l":
                    command = CliCommand.ListDevices;
                    break;

                case "capture":
                    command = CliCommand.Capture;
                    break;

                case "scan":
                case "--scan":
                    command = CliCommand.Scan;
                    break;

                case "connect":
                    command = CliCommand.Connect;
                    break;

                case "stream":
                    command = CliCommand.Stream;
                    break;

                case "help":
                case "--help":
                case "-h":
                case "-?":
                    command = CliCommand.Help;
                    break;

                case "--out":
                case "-o":
                    output = RequireValue(args, ref i, arg);
                    break;

                case "--seconds":
                case "-s":
                    var raw = RequireValue(args, ref i, arg);
                    if (!int.TryParse(raw, out var seconds) || seconds <= 0)
                    {
                        throw new ArgumentException($"'{arg}' pozitif bir tam sayı bekliyor, '{raw}' geldi.");
                    }

                    duration = seconds;
                    break;

                case "--device":
                case "-d":
                    deviceId = RequireValue(args, ref i, arg);
                    break;

                case "--target":
                case "-t":
                    target = RequireValue(args, ref i, arg);
                    break;

                case "--silence":
                    silence = true;
                    break;

                case "--verbose":
                case "-v":
                    verbose = true;
                    break;

                case "--codec":
                case "-c":
                    var codecName = RequireValue(args, ref i, arg);
                    codec = codecName.ToLowerInvariant() switch
                    {
                        "pcm" or "l16" or "raw" => RaopStreamCodec.RawPcm,
                        "alac" or "lossless" => RaopStreamCodec.AppleLossless,
                        _ => throw new ArgumentException($"Bilinmeyen codec: '{codecName}'. pcm veya alac kullanın."),
                    };
                    break;

                case "--latency":
                    var latencyRaw = RequireValue(args, ref i, arg);
                    if (!int.TryParse(latencyRaw, out var latency) || latency is < 50 or > 10000)
                    {
                        throw new ArgumentException($"'{arg}' 50-10000 ms aralığında bir değer bekliyor.");
                    }

                    latencyMs = latency;
                    break;

                case "--big-endian":
                    bigEndian = true;
                    break;

                case "--little-endian":
                    bigEndian = false;
                    break;

                case "--encrypt":
                    encrypt = true;
                    break;

                case "--keep-speakers":
                    keepSpeakers = true;
                    break;

                default:
                    throw new ArgumentException($"Bilinmeyen argüman: {arg}");
            }
        }

        return new CliOptions
        {
            Command = command,
            OutputPath = output,
            DurationSeconds = duration,
            DeviceId = deviceId,
            EmitSilenceWhenIdle = silence,
            Verbose = verbose,
            Target = target,
            Codec = codec,
            Encrypt = encrypt,
            LatencyMs = latencyMs,
            ForceBigEndianPayload = bigEndian,
            KeepLocalSpeakers = keepSpeakers,
        };
    }

    private static string RequireValue(string[] args, ref int index, string argName)
    {
        if (index + 1 >= args.Length)
        {
            throw new ArgumentException($"'{argName}' bir değer bekliyor.");
        }

        return args[++index];
    }
}
