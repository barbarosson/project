# WinAirPlay

Desktop app that captures Windows system audio (WASAPI loopback) and streams it in real time to an AirPlay receiver on the local network, such as a HomePod mini.

The UI is English-only.

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Core audio capture (WASAPI loopback → 44.1 kHz / 16-bit / stereo PCM) | Done |
| 2 | AirPlay discovery over mDNS (`_raop._tcp`, `_airplay._tcp`) | Done |
| 3 | RTSP handshake (ANNOUNCE / SETUP / RECORD) | Done |
| 4.1 | Unencrypted raw PCM (L16) RTP/UDP plus timing | Done |
| 4.2 | ALAC encoding and AES encryption | Done |
| 5 | WPF + system tray UI (MVVM) | Done |

## Project layout

```
WinAirPlay/
├── src/
│   ├── WinAirPlay.Core/     Audio engine (interface-based, UI-independent)
│   ├── WinAirPlay.Cli/      Console app for phase checks
│   └── WinAirPlay.App/      WPF desktop app (MVVM + system tray)
└── tests/
    └── WinAirPlay.Core.Tests/
```

`WinAirPlay.Core` talks only through interfaces, so later phases can swap a WAV writer for an AirPlay sender and tests can mock hardware and the network.

`Audio/` — audio engine:

- `IAudioCaptureSource` — PCM block producer (`WasapiLoopbackCaptureSource`)
- `IAudioSink` — PCM block consumer (`WaveFileAudioSink`, later `AirPlayRtpSink`)
- `AudioPipeline` — connects source to sinks, keeps counters and levels
- `IAudioDeviceEnumerator` — capturable output devices (`WasapiDeviceEnumerator`)
- `AudioOutputRouter` — switches the Windows default output to a virtual cable when one is installed, otherwise mutes the speakers

`Discovery/` — network discovery:

- `IAirPlayDiscovery` — mDNS scan (`ZeroconfAirPlayDiscovery`)
- `MdnsServiceRecord` — raw service record independent of Zeroconf
- `RaopTxtRecordParser` — TXT records → `RaopCapabilities` (codec, encryption, format)
- `AirPlayDeviceCatalog` — merges `_raop` + `_airplay` records into one `AirPlayDevice`
- `AirPlayDeviceSelector` — pick a device by index / name / IP / hardware id

`Rtsp/` — protocol transport:

- `RtspClient` — persistent TCP connection, CSeq handling, full dialog dump via the `Traced` event
- `RtspMessageParser` — status line, folded headers, `Transport` parameters

`Raop/` — AirPlay session:

- `RaopHandshake` — OPTIONS → ANNOUNCE → SETUP → RECORD
- `SdpBuilder` — ALAC description in the ANNOUNCE body
- `RaopTimingResponder` — answers the device’s NTP clock queries (SETUP requires this)
- `RaopSession` — negotiated ports, session id, volume, and TEARDOWN
- `RaopMediaFormat` — codec selection (L16 raw PCM / ALAC) and RTP payload type
- `IRaopPayloadEncoder` — turns a PCM block into an RTP payload; `PcmPassthroughEncoder` and `AlacUncompressedEncoder` implementations
- `RaopEncryptionKeys` / `RaopPacketCipher` — AES-128-CBC payload encryption and wrapping the key with Apple’s public RSA key
- `RaopRtpSender` — as an `IAudioSink`, encodes blocks, wraps them in RTP, sends over UDP, and keeps the clock aligned with periodic sync packets

## Requirements

- .NET 8 SDK (`winget install --id Microsoft.DotNet.SDK.8 -e`)
- Windows 10/11
- NuGet: `NAudio.Core` 2.2.1, `NAudio.Wasapi` 2.2.1, `Zeroconf` 3.7.16

## Usage (Phase 1)

```powershell
dotnet build

# List capturable audio output devices
dotnet run --project src\WinAirPlay.Cli -- list

# Capture system audio; press Enter to stop
dotnet run --project src\WinAirPlay.Cli -- capture

# Record for 20 seconds to a specific file
dotnet run --project src\WinAirPlay.Cli -- capture -s 20 -o test_capture.wav
```

Options:

| Option | Description |
| --- | --- |
| `-o, --out <path>` | Output file (default `test_capture.wav`, written next to the solution) |
| `-s, --seconds <n>` | Stop automatically after n seconds |
| `-d, --device <id>` | Capture a specific output device |
| `--silence` | Keep the stream alive with silence blocks when nothing is playing |

WASAPI loopback produces no data while silent; something must be playing during capture. For live streaming in phase 4, `--silence` becomes the default behavior.

## Usage (Phase 2)

```powershell
# Discover AirPlay devices on the network (default 10 seconds)
dotnet run --project src\WinAirPlay.Cli -- scan

# Scan longer and dump every TXT record
dotnet run --project src\WinAirPlay.Cli -- scan -s 15 -v
```

If no device is found: the PC and HomePod must be on the same Wi-Fi network, the network profile should be Private, and the firewall must allow UDP 5353 (mDNS).

## Usage (Phase 3)

```powershell
# Scan, pick from the list, run the RTSP handshake
dotnet run --project src\WinAirPlay.Cli -- connect

# Target directly: index, name, IP, or hardware id
dotnet run --project src\WinAirPlay.Cli -- connect -t 192.168.0.121
```

All RTSP traffic is printed: outgoing requests `>>`, incoming responses `<<`. After a successful handshake the device’s audio / control / timing ports are listed; phase 4 sends RTP to those ports.

## Usage (Phase 4)

```powershell
# Live-stream system audio to the selected device (default: ALAC, unencrypted, 50 ms buffer)
dotnet run --project src\WinAirPlay.Cli -- stream

# Give a target, stream for 30 seconds, and show the RTSP dialog
dotnet run --project src\WinAirPlay.Cli -- stream -t 192.168.0.121 -s 30 -v

# Fall back to raw PCM (phase 4.1 path)
dotnet run --project src\WinAirPlay.Cli -- stream --codec pcm

# Increase the buffer if the stream cuts out
dotnet run --project src\WinAirPlay.Cli -- stream --latency 500

# Leave PC speakers unmuted (default: mute unless a virtual cable is used)
dotnet run --project src\WinAirPlay.Cli -- stream --keep-speakers
```

When a virtual audio cable (VB-Audio Cable or VoiceMeeter) is installed, the Windows default output is switched to that cable for the session so speakers stay on and Windows volume keys control the HomePod. Without a cable, compatibility mode mutes the PC speakers so sound only comes from the AirPlay device. Disconnect restores the previous default output and unmute.

WASAPI device-loopback would go silent with mute, so capture uses the process-loopback API (Windows 10 2004+) and happens *before* the speakers.

### Encoding

ALAC frames are produced in the format’s “uncompressed” mode: the bitstream and magic cookie match what a receiver expects, but samples are stored as-is instead of going through the predictor and Rice encoder. That buys compatibility, not bandwidth — the frame is 3 bytes larger than the PCM it carries, so the payload is still ~1.4 Mbit/s. Real compression is a later step.

### Encryption

`--encrypt` turns on classic RAOP encryption: a random AES-128 key is wrapped with Apple’s public RSA key and placed in the SDP; each payload is encrypted with CBC (the leftover partial block stays in the clear, the IV is reset every packet).

Modern AirPlay 2 devices reject that legacy flow: a HomePod returns `406 Not Acceptable` on this ANNOUNCE because it expects pairing-based encryption. Unencrypted streaming already works on those devices, so encryption is off by default. The option remains for older AirPort Express and Apple TV models.

## Usage (Phase 5 — desktop app)

```powershell
dotnet run --project src\WinAirPlay.App
```

The window scans the network as soon as it opens, selects the last used device, and waits. The close button does not quit the app; it hides to the notification area and streaming continues in the background. The tray icon shows state by color (gray: not connected, yellow: working, green: streaming, red: error). Right-click to show the window or disconnect. Use **Exit** in the tray menu to quit.

The buffer slider works while streaming: the next sync packet carries the new value, and you may hear a short glitch while the receiver realigns its clock. The volume slider changes the device’s own volume via RTSP `SET_PARAMETER`, not Windows volume.

**Audio routing** defaults to Auto: use a virtual cable when Windows has one, otherwise mute the speakers. **Apply Windows volume to HomePod** is on by default so system volume keys and the mixer carry through.

Settings live in `%APPDATA%\WinAirPlay\settings.json`. Unexpected errors write a full stack trace to `error.log` in the same folder.

`WinAirPlay.App` layers:

- `Services/StreamController` — discovery, handshake, capture, and send in one state machine; that is all the UI knows about
- `ViewModels/MainViewModel` — bindable state; talks through `IStreamController`, `ISettingsStore`, and `IUiDispatcher` so it can be tested without a window
- `Tray/TrayIconHost` — notification-area icon and menu; the icon is drawn at runtime by `TrayIconFactory`, there is no icon file in the project

## Tests

```powershell
dotnet test
```

## Microsoft Store (MSIX)

See `src/WinAirPlay.Package/` and `docs/STORE_PUBLISHING.md`.

The Store package is English-only, `win-x64`, and self-contained (no separate .NET 8 Desktop Runtime on the PC).

```powershell
# Logo PNGs (including 300×300 listing icon) and MSIX
.\scripts\build-msix.ps1
```

Minimum Windows version: **10.0.19041** (2004). Privacy policy: `docs/PRIVACY_POLICY.md`. Host that file on HTTPS and paste the URL in Partner Center before submission.
