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
            WinAirPlay — Windows sistem sesini AirPlay cihazına aktarır

            Kullanım:
              WinAirPlay.Cli [komut] [seçenekler]

            Komutlar:
              capture            Sistem sesini yakalar ve WAV dosyasına yazar (varsayılan)
              list               Yakalanabilir ses çıkış cihazlarını listeler
              scan               Ağdaki AirPlay cihazlarını mDNS ile arar
              connect            Seçilen AirPlay cihazıyla RTSP el sıkışması yapar
              stream             Sistem sesini seçilen AirPlay cihazına canlı aktarır
              help               Bu yardımı gösterir

            Seçenekler:
              -o, --out <yol>    capture: çıktı dosyası (varsayılan: test_capture.wav)
              -s, --seconds <n>  capture/stream: n saniye sonra dur / scan: n saniye tara
              -d, --device <id>  capture/stream: yakalanacak ses çıkışı ('list' ile öğrenilir)
                  --silence      capture: hiçbir şey çalmazken sessizlik bloklarıyla akışı sürdür
              -v, --verbose      scan: TXT kayıtlarını / connect, stream: RTSP diyaloğunu yazdırır
              -t, --target <x>   connect, stream: hedef cihaz (sıra no, isim, IP veya kimlik)
                                 verilmezse listeden seçim istenir
              -c, --codec <x>    stream: alac (varsayılan) veya pcm
                  --encrypt      stream: sesi AES-128-CBC ile şifreler
                  --keep-speakers stream: hoparlörü açık bırakır (varsayılan: kapatır)
                  --latency <n>  stream: tampon süresi, ms (varsayılan 50)
                  --little-endian / --big-endian
                                 stream: L16 bayt sırasını elle zorlar (tanılama içindir)
            """);

        return 0;
    }

    private static int ListDevices()
    {
        var enumerator = new WasapiDeviceEnumerator();
        var devices = enumerator.GetRenderDevices();

        if (devices.Count == 0)
        {
            Console.WriteLine("Aktif ses çıkış cihazı bulunamadı.");
            return 1;
        }

        Console.WriteLine($"{devices.Count} ses çıkış cihazı bulundu:");
        Console.WriteLine();

        foreach (var device in devices)
        {
            Console.WriteLine($"  {(device.IsDefault ? "*" : " ")} {device.Name}");
            Console.WriteLine($"      id: {device.Id}");
        }

        Console.WriteLine();
        Console.WriteLine("* = varsayılan cihaz");
        return 0;
    }

    private static async Task<int> ScanAsync(CliOptions options)
    {
        // HomePods often need more than one query round before they answer.
        var duration = TimeSpan.FromSeconds(options.DurationSeconds ?? 10);
        Console.WriteLine("WinAirPlay — FAZ 2 / Checkpoint 2");
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
        Console.WriteLine($"Ses akışı kabul eden cihaz sayısı: {streamable}");

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

        Console.WriteLine($"Taranan servisler: {string.Join(", ", AirPlayServiceTypes.All)}");
        Console.WriteLine($"Süre             : {duration.TotalSeconds:F0} saniye");
        Console.WriteLine(new string('-', 60));
        Console.WriteLine("Ağ dinleniyor...");
        Console.WriteLine();

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var devices = await discovery.ScanAsync(duration, cancellationToken).ConfigureAwait(false);
            stopwatch.Stop();

            Console.WriteLine();
            Console.WriteLine(new string('-', 60));
            Console.WriteLine($"{devices.Count} cihaz bulundu ({stopwatch.Elapsed.TotalSeconds:F1} sn).");

            return devices;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine();
            Console.WriteLine("Tarama iptal edildi.");
            return null;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine();
            Console.Error.WriteLine($"Tarama başarısız: {ex.Message}");
            Console.Error.WriteLine("Windows Güvenlik Duvarı'nın UDP 5353 (mDNS) trafiğine izin verdiğinden emin olun.");
            return null;
        }
    }

    private static void PrintNoDevicesHelp()
    {
        Console.WriteLine();
        Console.WriteLine("Kontrol listesi:");
        Console.WriteLine("  - HomePod ile bilgisayar aynı Wi-Fi ağında mı?");
        Console.WriteLine("  - Ağ profili 'Genel' yerine 'Özel' olarak ayarlı mı?");
        Console.WriteLine("  - Güvenlik duvarı UDP 5353'e izin veriyor mu?");
        Console.WriteLine("  - Daha uzun tarayın: scan -s 20");
    }

    private static void PrintDevice(int index, AirPlayDevice device, bool verbose)
    {
        var caps = device.Capabilities;

        Console.WriteLine($"[{index}] {device.Name}{(device.IsHomePod ? "  (HomePod)" : string.Empty)}");
        Console.WriteLine($"     IP adresi   : {device.Address?.ToString() ?? "-"}");
        Console.WriteLine($"     RTSP portu  : {device.RaopPort?.ToString() ?? "yok"}");
        Console.WriteLine($"     AirPlay port: {device.AirPlayPort?.ToString() ?? "yok"}");
        Console.WriteLine($"     Cihaz ID    : {device.DeviceId ?? "-"}");
        Console.WriteLine($"     Model       : {device.Model ?? "-"}");
        Console.WriteLine($"     Yazılım     : {device.FirmwareVersion ?? "-"}");
        Console.WriteLine($"     Ses formatı : {caps.SampleRate} Hz / {caps.SampleSize}-bit / {caps.Channels}ch");
        Console.WriteLine($"     Kodekler    : {Describe(caps.Codecs)}{(caps.SupportsAlac ? "  [ALAC var]" : string.Empty)}");
        Console.WriteLine($"     Şifreleme   : {Describe(caps.EncryptionTypes)}  (zorunlu: {(caps.RequiresEncryption ? "evet" : "hayır")})");
        Console.WriteLine($"     Parola      : {(caps.RequiresPassword ? "gerekli" : "gerekmiyor")}");

        if (device.Addresses.Count > 1)
        {
            Console.WriteLine($"     Tüm adresler: {string.Join(", ", device.Addresses)}");
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

        Console.WriteLine("WinAirPlay — FAZ 3 / Checkpoint 3");
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
            Console.WriteLine("Ses akışı kabul eden cihaz bulunamadı.");
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
        Console.WriteLine($"Hedef: {target.Name}  →  {target.RtspEndPoint}");
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
            Console.WriteLine($"  ~~ Zamanlama (NTP) isteği yanıtlandı: {from}");
            Console.ForegroundColor = previous;
            Console.WriteLine();
        };

        try
        {
            await using var session = await handshake.ConnectAsync(target, cts.Token).ConfigureAwait(false);
            Volatile.Write(ref handshakeFinished, true);

            PrintSessionSummary(session);
            Console.WriteLine("Bağlantı açık. Kapatmak için Enter'a basın.");
            Console.ReadLine();
            Console.WriteLine("TEARDOWN gönderiliyor...");

            return 0;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Bağlantı iptal edildi.");
            return 1;
        }
        catch (RtspException ex)
        {
            Console.Error.WriteLine();
            Console.Error.WriteLine($"El sıkışması başarısız: {ex.Message}");

            if (ex.Response is { } response)
            {
                Console.Error.WriteLine();
                Console.Error.WriteLine("Cihazdan gelen son yanıt:");
                Console.Error.WriteLine(response.ToString());
            }

            return 1;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine();
            Console.Error.WriteLine($"Beklenmeyen hata: {ex.Message}");
            return 1;
        }
    }

    private static AirPlayDevice? ChooseDevice(IReadOnlyList<AirPlayDevice> devices, string? target)
    {
        Console.WriteLine();
        Console.WriteLine("Ses akışı kabul eden cihazlar:");

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
                Console.Error.WriteLine($"'{target}' hiçbir cihazla eşleşmedi.");
                Console.Error.WriteLine("Sıra numarası, tam isim, IP adresi veya donanım kimliği kullanın.");
            }

            return chosen;
        }

        if (devices.Count == 1)
        {
            Console.WriteLine();
            Console.WriteLine("Tek uygun cihaz var, otomatik seçildi.");
            return devices[0];
        }

        while (true)
        {
            Console.WriteLine();
            Console.Write($"Hangi cihaza bağlanılsın? [1-{devices.Count}, iptal için boş bırakın]: ");

            var answer = Console.ReadLine();
            if (string.IsNullOrWhiteSpace(answer))
            {
                Console.WriteLine("İptal edildi.");
                return null;
            }

            var chosen = AirPlayDeviceSelector.Find(devices, answer);
            if (chosen is not null)
            {
                return chosen;
            }

            Console.WriteLine("Geçersiz seçim. Sıra numarası, isim veya IP adresi yazabilirsiniz.");
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
        Console.WriteLine("WinAirPlay — FAZ 4 / Checkpoint 4");
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
            Console.WriteLine("Ses akışı kabul eden cihaz bulunamadı.");
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
        Console.WriteLine($"Hedef: {target.Name}  →  {target.RtspEndPoint}");
        Console.WriteLine($"Codec: {options.Codec}{(options.Encrypt ? " + AES" : string.Empty)}");
        Console.WriteLine(new string('-', 60));
        Console.WriteLine("El sıkışması yapılıyor...");

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
                Console.WriteLine("Varsayılan çıkış sanal kabloya alınamadı; uyumlu moda geçildi.");
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
                Console.WriteLine($"Varsayılan çıkış {plan.VirtualDeviceName}; hoparlör açık, Windows sesi HomePod'a gider.");
            }
            else if (plan.MuteLocalSpeakers)
            {
                if (source.CapturesBeforeDeviceVolume)
                {
                    silencer.Silence(plan.CaptureDeviceId);
                    Console.WriteLine("Hoparlör susturuldu (uyumlu mod); Windows sesi HomePod'a uygulanır.");
                }
                else
                {
                    Console.WriteLine("Hoparlör kapatılmadı: Windows sesi cihaz mute'undan önce yakalayamadı.");
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
                Console.Error.WriteLine($"Yayın hatayla sonlandı: {failure.Message}");
                return 1;
            }

            Console.WriteLine($"Gönderilen paket : {sender.PacketsSent:N0}");
            Console.WriteLine($"Gönderilen veri  : {sender.BytesSent / 1024.0:N0} KB");
            Console.WriteLine($"Sync paketi      : {sender.SyncPacketsSent:N0}");
            Console.WriteLine($"Zamanlama isteği : {session.TimingResponder.RequestCount:N0}");
            Console.WriteLine();
            Console.WriteLine("Yayın durduruldu, TEARDOWN gönderiliyor...");

            return 0;
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("Yayın iptal edildi.");
            return 1;
        }
        catch (RtspException ex)
        {
            Console.Error.WriteLine();
            Console.Error.WriteLine($"El sıkışması başarısız: {ex.Message}");

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
            Console.Error.WriteLine($"Beklenmeyen hata: {ex.Message}");
            return 1;
        }
    }

    private static void PrintStreamHeader(
        RaopSession session,
        RaopRtpSender sender,
        WasapiLoopbackCaptureSource source)
    {
        Console.WriteLine(new string('-', 60));
        Console.WriteLine($"Yakalanan cihaz : {source.DeviceName}");
        Console.WriteLine($"Hedef           : {session.AudioEndPoint} (ses), " +
                          $"{session.RemoteControlEndPoint} (kontrol)");
        Console.WriteLine($"Kodlama         : {sender.Codec}" +
                          $"{(sender.IsEncrypted ? ", AES-128-CBC" : ", şifresiz")}");
        Console.WriteLine($"Paket boyutu    : {sender.PayloadLength} bayt PCM " +
                          $"({session.Audio.FramesPerPacket} örnek çerçevesi)");
        Console.WriteLine($"Tampon          : {sender.TargetLatency.TotalMilliseconds:F0} ms");
        Console.WriteLine($"Cihaz gecikmesi : {session.AudioLatency?.ToString() ?? "-"} örnek");
        Console.WriteLine(new string('-', 60));
        Console.WriteLine("Yayın başladı. Bilgisayarda bir şey çalın, sesi HomePod'dan duymalısınız.");
        Console.WriteLine("Durdurmak için Enter'a basın.");
        Console.WriteLine();
    }

    private static void DrawStreamStatus(AudioPipeline pipeline, RaopRtpSender sender, RaopSession session)
    {
        var level = pipeline.CurrentLevel;

        Console.Write(
            $"\r  {sender.StreamPosition:mm\\:ss\\.f}  L {Bar(level.PeakLeft)} R {Bar(level.PeakRight)}  " +
            $"{sender.PacketsSent,7:N0} paket  {sender.SyncPacketsSent,4:N0} sync  " +
            $"{session.TimingResponder.RequestCount,3:N0} ntp  {sender.BytesSent / 1024,7:N0} KB ");
    }

    private static void PrintSessionSummary(RaopSession session)
    {
        Console.WriteLine(new string('-', 60));
        Console.WriteLine("El sıkışması tamamlandı — cihaz ses akışı bekliyor.");
        Console.WriteLine();
        Console.WriteLine($"  Session ID       : {session.SessionId}");
        Console.WriteLine($"  Ses portu        : {session.Transport.AudioPort}  (FAZ 4'te RTP buraya gidecek)");
        Console.WriteLine($"  Kontrol portu    : {session.Transport.ControlPort}");
        Console.WriteLine($"  Zamanlama portu  : {session.Transport.TimingPort}");
        Console.WriteLine($"  Yerel kontrol    : {session.LocalControlPort}");
        Console.WriteLine($"  Yerel zamanlama  : {session.LocalTimingPort}");
        Console.WriteLine($"  Cihaz gecikmesi  : {session.AudioLatency?.ToString() ?? "-"} örnek");
        Console.WriteLine($"  Zamanlama isteği : {session.TimingResponder.RequestCount} adet yanıtlandı");
        Console.WriteLine($"  Başlangıç seq    : {session.InitialSequence}");
        Console.WriteLine($"  Başlangıç rtptime: {session.InitialRtpTimestamp}");
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

        Console.WriteLine("WinAirPlay — FAZ 1 / Checkpoint 1");
        Console.WriteLine(new string('-', 60));

        try
        {
            pipeline.Start();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Yakalama başlatılamadı: {ex.Message}");
            return 1;
        }

        Console.WriteLine($"Cihaz        : {source.DeviceName}");
        Console.WriteLine($"Cihaz formatı: {DescribeDeviceFormat(source)}");
        Console.WriteLine($"Hedef format : {source.Format}");
        Console.WriteLine($"Blok boyutu  : {source.BlockSizeInBytes} bayt " +
                          $"({captureOptions.SampleFramesPerBlock} örnek çerçevesi)");
        Console.WriteLine($"Çıktı        : {outputPath}");
        Console.WriteLine(new string('-', 60));
        Console.WriteLine(options.DurationSeconds is { } d
            ? $"{d} saniye boyunca kayıt alınıyor... (Ctrl+C ile erken durdurabilirsiniz)"
            : "Kayıt alınıyor... Durdurmak için Enter'a basın.");
        Console.WriteLine("Şimdi bir müzik/video çalın, seviye göstergesi hareket etmeli.");
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
            Console.Error.WriteLine($"Yakalama hatayla sonlandı: {captureFailure.Message}");
            return 1;
        }

        Console.WriteLine($"Kayıt tamamlandı: {sink.FilePath}");
        Console.WriteLine($"Süre            : {sink.Duration:mm\\:ss\\.fff}");
        Console.WriteLine($"Boyut           : {sink.BytesWritten:N0} bayt");
        Console.WriteLine($"Düşen blok      : {pipeline.DroppedBlocks}");
        Console.WriteLine();

        if (sink.BytesWritten == 0)
        {
            Console.WriteLine("UYARI: Hiç ses verisi yakalanmadı. Kayıt sırasında bilgisayarda ses");
            Console.WriteLine("çalıyor olmalı — WASAPI loopback sessizlikte veri üretmez.");
            return 1;
        }

        Console.WriteLine("Dosyayı dinleyip onaylayın; ardından FAZ 2'ye geçebiliriz.");
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
            ? "bilinmiyor"
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
