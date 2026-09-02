using System.Diagnostics;
using System.Text;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Discovery;
using WinAirPlay.Core.Raop;
using WinAirPlay.Core.Rtsp;

namespace WinAirPlay.Cli;

public static class Program
{
    public static async Task<int> Main(string[] args)
    {
        try
        {
            Console.OutputEncoding = Encoding.UTF8;
        }
        catch (IOException)
        {
            // Redirected output: keep the default encoding.
        }

        CliOptions options;
        try
        {
            options = CliOptions.Parse(args);
        }
        catch (ArgumentException ex)
        {
            Console.Error.WriteLine(ex.Message);
            PrintHelp();
            return 2;
        }

        return options.Command switch
        {
            CliCommand.Help => PrintHelp(),
            CliCommand.ListDevices => ListDevices(),
            CliCommand.Scan => await ScanAsync(options).ConfigureAwait(false),
            CliCommand.Connect => await ConnectAsync(options).ConfigureAwait(false),
            CliCommand.Stream => await StreamAsync(options).ConfigureAwait(false),
            _ => Capture(options),
        };
    }

    private static int PrintHelp()
    {
        Console.WriteLine("""
            WinAirPlay — stream Windows system audio to an AirPlay receiver

            Usage:
              WinAirPlay.Cli [command] [options]

            Commands:
              capture            Capture system audio to a WAV file (default)
              list               List capturable audio output devices
              scan               Discover AirPlay devices on the network via mDNS
              connect            Run the RTSP handshake with a selected AirPlay device
              stream             Live-stream system audio to a selected AirPlay device
              help               Show this help

            Options:
              -o, --out <path>   capture: output file (default: test_capture.wav)
              -s, --seconds <n>  capture/stream: stop after n seconds / scan: listen for n seconds
              -d, --device <id>  capture/stream: audio output to capture (see 'list')
                  --silence      capture: keep the pipeline alive with silence when nothing is playing
              -v, --verbose      scan: dump TXT records / connect, stream: print the RTSP dialog
              -t, --target <x>   connect, stream: target device (index, name, IP, or hardware id)
                                 omitted: prompt to choose from the list
              -c, --codec <x>    stream: alac (default) or pcm
                  --encrypt      stream: encrypt audio with AES-128-CBC
                  --keep-speakers stream: leave PC speakers unmuted (default: mute)
                  --latency <n>  stream: buffer duration in ms (default 50)
                  --little-endian / --big-endian
                                 stream: force L16 byte order (diagnostics)
            """);

        return 0;
    }

    private static int ListDevices()
    {
        var enumerator = new WasapiDeviceEnumerator();
        var devices = enumerator.GetRenderDevices();

        if (devices.Count == 0)
        {
            Console.WriteLine("No active audio output devices found.");
            return 1;
        }

        Console.WriteLine($"{devices.Count} audio output device(s) found:");
        Console.WriteLine();

        foreach (var device in devices)
        {
            Console.WriteLine($"  {(device.IsDefault ? "*" : " ")} {device.Name}");
            Console.WriteLine($"      id: {device.Id}");
        }

        Console.WriteLine();
        Console.WriteLine("* = default device");
        return 0;
    }

    private static async Task<int> ScanAsync(CliOptions options)
    {
        // HomePods often need more than one query round before they answer.
        var duration = TimeSpan.FromSeconds(options.DurationSeconds ?? 10);
        Console.WriteLine("WinAirPlay — Phase 2 / Checkpoint 2");
        Console.WriteLine(new string('-', 60));

        using var cts = CreateCancellationSource();
        var devices = await DiscoverAsync(duration, verboseTrace: true, cts.Token).ConfigureAwait(false);

        if (devices is null)
        {
            return 1;
        }

        if (devices.Count == 0)
        {
            PrintNoDevicesHelp();
            return 1;
        }

        var index = 0;
        foreach (var device in devices)
        {
            Console.WriteLine();
            PrintDevice(++index, device, options.Verbose);
        }

        Console.WriteLine();
        var streamable = devices.Count(d => d.SupportsAudioStreaming);
        Console.WriteLine($"Devices that accept audio: {streamable}");

        return streamable > 0 ? 0 : 1;
    }

    private static CancellationTokenSource CreateCancellationSource()
    {
        var cts = new CancellationTokenSource();
        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            cts.Cancel();
        };

        return cts;
    }

    /// <summary>Returns <c>null</c> when the scan was cancelled or failed; the caller already saw why.</summary>
    private static async Task<IReadOnlyList<AirPlayDevice>?> DiscoverAsync(
        TimeSpan duration,
        bool verboseTrace,
        CancellationToken cancellationToken)
    {
        var discovery = new ZeroconfAirPlayDiscovery();

        if (verboseTrace)
        {
            discovery.ServiceObserved += (_, record) => Console.WriteLine(
                $"    · {record.Kind,-7} {record.InstanceName}  →  {record.PrimaryAddress}:{record.Port}");
        }

        Console.WriteLine($"Services scanned: {string.Join(", ", AirPlayServiceTypes.All)}");
        Console.WriteLine($"Duration         : {duration.TotalSeconds:F0} seconds");
        Console.WriteLine(new string('-', 60));
        Console.WriteLine("Listening on the network...");
        Console.WriteLine();

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var devices = await discovery.ScanAsync(duration, cancellationToken).ConfigureAwait(false);
            stopwatch.Stop();

            Console.WriteLine();
            Console.WriteLine(new string('-', 60));
            Console.WriteLine($"{devices.Count} device(s) found ({stopwatch.Elapsed.TotalSeconds:F1} s).");

            return devices;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine();
            Console.WriteLine("Scan cancelled.");
            return null;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine();
            Console.Error.WriteLine($"Scan failed: {ex.Message}");
            Console.Error.WriteLine("Make sure Windows Firewall allows UDP 5353 (mDNS).");
            return null;
        }
    }

    private static void PrintNoDevicesHelp()
    {
        Console.WriteLine();
        Console.WriteLine("Checklist:");
        Console.WriteLine("  - Is the HomePod on the same Wi-Fi network as this PC?");
        Console.WriteLine("  - Is the network profile set to Private instead of Public?");
        Console.WriteLine("  - Does the firewall allow UDP 5353?");
        Console.WriteLine("  - Try a longer scan: scan -s 20");
    }

    private static void PrintDevice(int index, AirPlayDevice device, bool verbose)
    {
        var caps = device.Capabilities;

        Console.WriteLine($"[{index}] {device.Name}{(device.IsHomePod ? "  (HomePod)" : string.Empty)}");
        Console.WriteLine($"     IP address   : {device.Address?.ToString() ?? "-"}");
        Console.WriteLine($"     RTSP port    : {device.RaopPort?.ToString() ?? "none"}");
        Console.WriteLine($"     AirPlay port : {device.AirPlayPort?.ToString() ?? "none"}");
        Console.WriteLine($"     Device ID    : {device.DeviceId ?? "-"}");
        Console.WriteLine($"     Model       : {device.Model ?? "-"}");
        Console.WriteLine($"     Firmware     : {device.FirmwareVersion ?? "-"}");
        Console.WriteLine($"     Audio format : {caps.SampleRate} Hz / {caps.SampleSize}-bit / {caps.Channels}ch");
        Console.WriteLine($"     Codecs       : {Describe(caps.Codecs)}{(caps.SupportsAlac ? "  [ALAC]" : string.Empty)}");
        Console.WriteLine($"     Encryption   : {Describe(caps.EncryptionTypes)}  (required: {(caps.RequiresEncryption ? "yes" : "no")})");
        Console.WriteLine($"     Password     : {(caps.RequiresPassword ? "required" : "not required")}");

        if (device.Addresses.Count > 1)
        {
            Console.WriteLine($"     All addresses: {string.Join(", ", device.Addresses)}");
        }

        if (!verbose)
        {
            return;
        }

        PrintTxt("_raop._tcp", device.RaopTxt);
        PrintTxt("_airplay._tcp", device.AirPlayTxt);
    }

    private static void PrintTxt(string label, IReadOnlyDictionary<string, string> txt)
    {
        if (txt.Count == 0)
        {
            return;
        }

        Console.WriteLine($"     {label} TXT:");
        foreach (var (key, value) in txt.OrderBy(p => p.Key, StringComparer.Ordinal))
        {
            Console.WriteLine($"       {key} = {value}");
        }
    }

    private static string Describe<T>(IReadOnlyList<T> values) =>
        values.Count == 0 ? "-" : string.Join(", ", values);

    private static async Task<int> ConnectAsync(CliOptions options)
    {
        var duration = TimeSpan.FromSeconds(options.DurationSeconds ?? 10);

        Console.WriteLine("WinAirPlay — Phase 3 / Checkpoint 3");
        Console.WriteLine(new string('-', 60));

        using var cts = CreateCancellationSource();
        var devices = await DiscoverAsync(duration, verboseTrace: false, cts.Token).ConfigureAwait(false);

        if (devices is null)
        {
            return 1;
        }

        var streamable = devices.Where(d => d.SupportsAudioStreaming).ToList();
        if (streamable.Count == 0)
        {
            Console.WriteLine("No audio receivers found.");
            PrintNoDevicesHelp();
            return 1;
        }

        var target = ChooseDevice(streamable, options.Target);
        if (target is null)
        {
            return 1;
        }

        Console.WriteLine();
        Console.WriteLine(new string('-', 60));
        Console.WriteLine($"Target: {target.Name}  →  {target.RtspEndPoint}");
        Console.WriteLine(new string('-', 60));
        Console.WriteLine();

        var handshake = new RaopHandshake();
        handshake.Traced += (_, trace) => PrintTrace(trace);

        // The receiver keeps polling the clock for the whole session; only the ones that gate the
        // handshake are worth printing, the rest would bury the summary.
        var handshakeFinished = false;
        handshake.TimingRequestAnswered += (_, from) =>
        {
            if (Volatile.Read(ref handshakeFinished))
            {
                return;
            }

            var previous = Console.ForegroundColor;
            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.WriteLine($"  ~~ Timing (NTP) request answered: {from}");
            Console.ForegroundColor = previous;
            Console.WriteLine();
        };

        try
        {
            await using var session = await handshake.ConnectAsync(target, cts.Token).ConfigureAwait(false);
            Volatile.Write(ref handshakeFinished, true);

            PrintSessionSummary(session);
            Console.WriteLine("Connection is open. Press Enter to close.");
            Console.ReadLine();
            Console.WriteLine("Sending TEARDOWN...");

            return 0;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Connection cancelled.");
            return 1;
        }
        catch (RtspException ex)
        {
            Console.Error.WriteLine();
            Console.Error.WriteLine($"Handshake failed: {ex.Message}");

            if (ex.Response is { } response)
            {
                Console.Error.WriteLine();
                Console.Error.WriteLine("Last response from the device:");
                Console.Error.WriteLine(response.ToString());
            }

            return 1;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine();
            Console.Error.WriteLine($"Unexpected error: {ex.Message}");
            return 1;
        }
    }

    private static AirPlayDevice? ChooseDevice(IReadOnlyList<AirPlayDevice> devices, string? target)
    {
        Console.WriteLine();
        Console.WriteLine("Devices that accept audio:");

        for (var i = 0; i < devices.Count; i++)
        {
            var device = devices[i];
            Console.WriteLine(
                $"  [{i + 1}] {device.Name,-22} {device.Address}:{device.RaopPort,-6} " +
                $"{device.Model ?? "-"}{(device.IsHomePod ? "  (HomePod)" : string.Empty)}");
        }

        if (target is not null)
        {
            var chosen = AirPlayDeviceSelector.Find(devices, target);

            if (chosen is null)
            {
                Console.Error.WriteLine();
                Console.Error.WriteLine($"'{target}' did not match any device.");
                Console.Error.WriteLine("Use a list index, exact name, IP address, or hardware id.");
            }

            return chosen;
        }

        if (devices.Count == 1)
        {
            Console.WriteLine();
            Console.WriteLine("Only one suitable device; selected automatically.");
            return devices[0];
        }

        while (true)
        {
            Console.WriteLine();
            Console.Write($"Connect to which device? [1-{devices.Count}, leave blank to cancel]: ");

            var answer = Console.ReadLine();
            if (string.IsNullOrWhiteSpace(answer))
            {
                Console.WriteLine("Cancelled.");
                return null;
            }

            var chosen = AirPlayDeviceSelector.Find(devices, answer);
            if (chosen is not null)
            {
                return chosen;
            }

            Console.WriteLine("Invalid selection. Enter an index, name, or IP address.");
        }
    }

    private static void PrintTrace(RtspTrace trace)
    {
        var sent = trace.Direction == RtspTraceDirection.Sent;
        var prefix = sent ? ">>" : "<<";
        var previous = Console.ForegroundColor;

        Console.ForegroundColor = sent ? ConsoleColor.Cyan : ConsoleColor.Yellow;

        foreach (var line in trace.Text.Replace("\r\n", "\n").TrimEnd('\n').Split('\n'))
        {
            Console.WriteLine($"  {prefix} {line}");
        }

        Console.ForegroundColor = previous;

        if (!sent)
        {
            Console.WriteLine($"     ({trace.Elapsed.TotalMilliseconds:F0} ms)");
        }

        Console.WriteLine();
    }

    private static async Task<int> StreamAsync(CliOptions options)
    {
        Console.WriteLine("WinAirPlay — Phase 4 / Checkpoint 4");
        Console.WriteLine(new string('-', 60));

        using var cts = CreateCancellationSource();
        var devices = await DiscoverAsync(TimeSpan.FromSeconds(10), verboseTrace: false, cts.Token)
            .ConfigureAwait(false);

        if (devices is null)
        {
            return 1;
        }

        var streamable = devices.Where(d => d.SupportsAudioStreaming).ToList();
        if (streamable.Count == 0)
        {
            Console.WriteLine("No audio receivers found.");
            PrintNoDevicesHelp();
            return 1;
        }

        var target = ChooseDevice(streamable, options.Target);
        if (target is null)
        {
            return 1;
        }

        var handshake = new RaopHandshake(new RaopHandshakeOptions
        {
            Codec = options.Codec,
            UseEncryption = options.Encrypt,
        });

        if (options.Verbose)
        {
            handshake.Traced += (_, trace) => PrintTrace(trace);
        }

        Console.WriteLine();
        Console.WriteLine(new string('-', 60));
        Console.WriteLine($"Target: {target.Name}  →  {target.RtspEndPoint}");
        Console.WriteLine($"Codec: {options.Codec}{(options.Encrypt ? " + AES" : string.Empty)}");
        Console.WriteLine(new string('-', 60));
        Console.WriteLine("Running handshake...");

        try
        {
            await using var session = await handshake.ConnectAsync(target, cts.Token).ConfigureAwait(false);

            var streamOptions = new RaopStreamOptions
            {
                ForceBigEndianPayload = options.ForceBigEndianPayload,
            };

            if (options.LatencyMs is { } latencyMs)
            {
                streamOptions.LatencySamples = latencyMs * session.Audio.SampleRate / 1000;
            }

            using var router = new AudioOutputRouter();
            var plan = router.CreatePlan(new AudioRoutingRequest(
                AudioRoutingMode.Auto,
                options.DeviceId,
                PreferredVirtualDeviceId: null,
                MuteLocalSpeakers: !options.KeepLocalSpeakers,
                FollowWindowsVolume: true));

            if (plan.Kind == AudioRoutingKind.Redirect && !router.Apply(plan))
            {
                Console.WriteLine("Could not switch the default output to the virtual cable; falling back to compatibility mode.");
                plan = options.KeepLocalSpeakers
                    ? AudioOutputPlan.Passthrough(options.DeviceId, followWindowsVolume: true)
                    : AudioOutputPlan.Mute(options.DeviceId, followWindowsVolume: true);
            }

            var captureOptions = new LoopbackCaptureOptions
            {
                DeviceId = plan.CaptureDeviceId,
                TargetFormat = AudioFormat.AirPlay,
                SampleFramesPerBlock = session.Audio.FramesPerPacket,
                // A live stream must never stall, so gaps are filled with silence.
                EmitSilenceWhenIdle = true,
                IndependentOfEndpointVolume = plan.IndependentOfEndpointVolume,
                ApplyEndpointVolume = plan.ApplyEndpointVolume,
                IgnoreEndpointMute = plan.MuteLocalSpeakers,
            };

            using var source = new WasapiLoopbackCaptureSource(captureOptions);
            using var silencer = new WasapiLocalOutputSilencer();
            using var sender = new RaopRtpSender(session, source.Format, streamOptions);
            using var keepAlive = new RaopSessionKeepAlive(session);
            using var pipeline = new AudioPipeline(source, ownsSource: false);
            pipeline.AddSink(sender);

            Exception? failure = null;
            sender.SendFailed += (_, ex) => failure ??= ex;
            keepAlive.KeepAliveFailed += (_, ex) => failure ??= ex;
            pipeline.Stopped += (_, e) => failure ??= e.Exception;

            sender.Start();
            keepAlive.Start();
            pipeline.Start();

            if (plan.Kind == AudioRoutingKind.Redirect)
            {
                Console.WriteLine($"Default output is {plan.VirtualDeviceName}; speakers stay on, Windows volume goes to HomePod.");
            }
            else if (plan.MuteLocalSpeakers)
            {
                if (source.CapturesBeforeDeviceVolume)
                {
                    silencer.Silence(plan.CaptureDeviceId);
                    Console.WriteLine("Speakers muted (compatibility mode); Windows volume is applied to HomePod.");
                }
                else
                {
                    Console.WriteLine("Speakers not muted: Windows could not capture before device mute.");
                }
            }

            Console.WriteLine();
            PrintStreamHeader(session, sender, source);

            using var finished = new ManualResetEventSlim(false);
            if (options.DurationSeconds is null)
            {
                _ = Task.Run(() =>
                {
                    Console.ReadLine();
                    finished.Set();
                });
            }

            var deadline = options.DurationSeconds is { } seconds
                ? Stopwatch.GetTimestamp() + (long)(seconds * Stopwatch.Frequency)
                : long.MaxValue;

            while (!finished.IsSet && !cts.IsCancellationRequested &&
                   Stopwatch.GetTimestamp() < deadline && failure is null)
            {
                DrawStreamStatus(pipeline, sender, session);
                finished.Wait(100);
            }

            DrawStreamStatus(pipeline, sender, session);
            Console.WriteLine();
            Console.WriteLine();

            pipeline.Stop();
            silencer.Restore();
            router.Restore();

            if (failure is not null)
            {
                Console.Error.WriteLine($"Stream ended with an error: {failure.Message}");
                return 1;
            }

            Console.WriteLine($"Packets sent    : {sender.PacketsSent:N0}");
            Console.WriteLine($"Bytes sent      : {sender.BytesSent / 1024.0:N0} KB");
            Console.WriteLine($"Sync packets    : {sender.SyncPacketsSent:N0}");
            Console.WriteLine($"Timing requests : {session.TimingResponder.RequestCount:N0}");
            Console.WriteLine();
            Console.WriteLine("Stream stopped, sending TEARDOWN...");

            return 0;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Stream cancelled.");
            return 1;
        }
        catch (RtspException ex)
        {
            Console.Error.WriteLine();
            Console.Error.WriteLine($"Handshake failed: {ex.Message}");

            if (ex.Response is { } response)
            {
                Console.Error.WriteLine();
                Console.Error.WriteLine(response.ToString());
            }

            return 1;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine();
            Console.Error.WriteLine($"Unexpected error: {ex.Message}");
            return 1;
        }
    }

    private static void PrintStreamHeader(
        RaopSession session,
        RaopRtpSender sender,
        WasapiLoopbackCaptureSource source)
    {
        Console.WriteLine(new string('-', 60));
        Console.WriteLine($"Capture device  : {source.DeviceName}");
        Console.WriteLine($"Target          : {session.AudioEndPoint} (audio), " +
                          $"{session.RemoteControlEndPoint} (control)");
        Console.WriteLine($"Codec           : {sender.Codec}" +
                          $"{(sender.IsEncrypted ? ", AES-128-CBC" : ", unencrypted")}");
        Console.WriteLine($"Packet size     : {sender.PayloadLength} bytes PCM " +
                          $"({session.Audio.FramesPerPacket} sample frames)");
        Console.WriteLine($"Buffer          : {sender.TargetLatency.TotalMilliseconds:F0} ms");
        Console.WriteLine($"Device latency  : {session.AudioLatency?.ToString() ?? "-"} samples");
        Console.WriteLine(new string('-', 60));
        Console.WriteLine("Streaming. Play something on this PC; you should hear it on the HomePod.");
        Console.WriteLine("Press Enter to stop.");
        Console.WriteLine();
    }

    private static void DrawStreamStatus(AudioPipeline pipeline, RaopRtpSender sender, RaopSession session)
    {
        var level = pipeline.CurrentLevel;

        Console.Write(
            $"\r  {sender.StreamPosition:mm\\:ss\\.f}  L {Bar(level.PeakLeft)} R {Bar(level.PeakRight)}  " +
            $"{sender.PacketsSent,7:N0} pkts  {sender.SyncPacketsSent,4:N0} sync  " +
            $"{session.TimingResponder.RequestCount,3:N0} ntp  {sender.BytesSent / 1024,7:N0} KB ");
    }

    private static void PrintSessionSummary(RaopSession session)
    {
        Console.WriteLine(new string('-', 60));
        Console.WriteLine("Handshake complete — the device is waiting for audio.");
        Console.WriteLine();
        Console.WriteLine($"  Session ID       : {session.SessionId}");
        Console.WriteLine($"  Audio port       : {session.Transport.AudioPort}  (RTP is sent here)");
        Console.WriteLine($"  Control port     : {session.Transport.ControlPort}");
        Console.WriteLine($"  Timing port      : {session.Transport.TimingPort}");
        Console.WriteLine($"  Local control    : {session.LocalControlPort}");
        Console.WriteLine($"  Local timing     : {session.LocalTimingPort}");
        Console.WriteLine($"  Device latency   : {session.AudioLatency?.ToString() ?? "-"} samples");
        Console.WriteLine($"  Timing requests  : {session.TimingResponder.RequestCount} answered");
        Console.WriteLine($"  Initial seq      : {session.InitialSequence}");
        Console.WriteLine($"  Initial rtptime  : {session.InitialRtpTimestamp}");
        Console.WriteLine();
    }

    private static int Capture(CliOptions options)
    {
        var outputPath = ResolveOutputPath(options.OutputPath);

        var captureOptions = new LoopbackCaptureOptions
        {
            DeviceId = options.DeviceId,
            TargetFormat = AudioFormat.AirPlay,
            EmitSilenceWhenIdle = options.EmitSilenceWhenIdle,
        };

        using var source = new WasapiLoopbackCaptureSource(captureOptions);
        using var sink = new WaveFileAudioSink(outputPath, source.Format);
        using var pipeline = new AudioPipeline(source, ownsSource: false);
        pipeline.AddSink(sink);

        Exception? captureFailure = null;
        using var finished = new ManualResetEventSlim(false);

        pipeline.Stopped += (_, e) =>
        {
            captureFailure = e.Exception;
            finished.Set();
        };

        pipeline.SinkFailed += (_, ex) => captureFailure ??= ex;

        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            finished.Set();
        };

        Console.WriteLine("WinAirPlay — Phase 1 / Checkpoint 1");
        Console.WriteLine(new string('-', 60));

        try
        {
            pipeline.Start();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Could not start capture: {ex.Message}");
            return 1;
        }

        Console.WriteLine($"Device       : {source.DeviceName}");
        Console.WriteLine($"Device format: {DescribeDeviceFormat(source)}");
        Console.WriteLine($"Target format: {source.Format}");
        Console.WriteLine($"Block size   : {source.BlockSizeInBytes} bytes " +
                          $"({captureOptions.SampleFramesPerBlock} sample frames)");
        Console.WriteLine($"Output       : {outputPath}");
        Console.WriteLine(new string('-', 60));
        Console.WriteLine(options.DurationSeconds is { } d
            ? $"Recording for {d} seconds... (Ctrl+C to stop early)"
            : "Recording... Press Enter to stop.");
        Console.WriteLine("Play music or video now; the level meter should move.");
        Console.WriteLine();

        if (options.DurationSeconds is null)
        {
            _ = Task.Run(() =>
            {
                Console.ReadLine();
                finished.Set();
            });
        }

        var deadline = options.DurationSeconds is { } seconds
            ? Stopwatch.GetTimestamp() + (long)(seconds * Stopwatch.Frequency)
            : long.MaxValue;

        while (!finished.IsSet && Stopwatch.GetTimestamp() < deadline)
        {
            DrawStatus(pipeline);
            finished.Wait(100);
        }

        DrawStatus(pipeline);
        Console.WriteLine();
        Console.WriteLine();

        pipeline.Stop();
        sink.Dispose();

        if (captureFailure is not null)
        {
            Console.Error.WriteLine($"Capture ended with an error: {captureFailure.Message}");
            return 1;
        }

        Console.WriteLine($"Recording finished: {sink.FilePath}");
        Console.WriteLine($"Duration        : {sink.Duration:mm\\:ss\\.fff}");
        Console.WriteLine($"Size            : {sink.BytesWritten:N0} bytes");
        Console.WriteLine($"Dropped blocks  : {pipeline.DroppedBlocks}");
        Console.WriteLine();

        if (sink.BytesWritten == 0)
        {
            Console.WriteLine("WARNING: No audio was captured. Something must be playing on this PC");
            Console.WriteLine("during recording — WASAPI loopback produces no data while silent.");
            return 1;
        }

        Console.WriteLine("Listen to the file to confirm; then move on to phase 2.");
        return 0;
    }

    private static void DrawStatus(AudioPipeline pipeline)
    {
        var level = pipeline.CurrentLevel;
        var elapsed = pipeline.ProcessedDuration;

        Console.Write(
            $"\r  {elapsed:mm\\:ss\\.f}  L {Bar(level.PeakLeft)} R {Bar(level.PeakRight)}  " +
            $"{PcmLevel.ToDecibels(level.Peak),6:F1} dBFS  {pipeline.TotalBytesProcessed / 1024,8:N0} KB ");
    }

    private static string Bar(float level)
    {
        const int width = 20;
        var filled = (int)Math.Round(Math.Clamp(level, 0f, 1f) * width);
        return string.Concat(new string('#', filled), new string('.', width - filled));
    }

    private static string DescribeDeviceFormat(WasapiLoopbackCaptureSource source)
    {
        var format = source.DeviceFormat;
        return format is null
            ? "unknown"
            : $"{format.SampleRate} Hz / {format.BitsPerSample}-bit {format.Encoding} / {format.Channels}ch";
    }

    /// <summary>
    /// Keeps relative output paths next to the solution instead of buried in bin/Debug, so
    /// <c>dotnet run</c> drops test_capture.wav somewhere the user can find it.
    /// </summary>
    private static string ResolveOutputPath(string path)
    {
        if (Path.IsPathRooted(path))
        {
            return Path.GetFullPath(path);
        }

        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            if (directory.GetFiles("WinAirPlay.sln").Length > 0)
            {
                return Path.GetFullPath(Path.Combine(directory.FullName, path));
            }

            directory = directory.Parent;
        }

        return Path.GetFullPath(path);
    }
}
