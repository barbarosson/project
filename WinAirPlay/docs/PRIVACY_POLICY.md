# WinAirPlay Privacy Policy

**Last updated:** September 2026

WinAirPlay (“the app”) streams audio from your Windows PC to AirPlay-compatible devices on your local network.

## Data we collect

**We do not collect, transmit, or sell personal data.** The app:

- Does not connect to analytics or advertising services
- Does not require an account
- Does not upload audio or settings to the cloud

## Data stored on your device

The app stores preferences locally at:

`%APPDATA%\WinAirPlay\settings.json`

This may include:

- Last selected receiver name and identifier
- Capture device, routing mode, latency, volume, and codec preferences
- Startup options (reconnect on launch, start minimized)

If the app crashes, a diagnostic log may be appended to:

`%APPDATA%\WinAirPlay\error.log`

These files remain on your computer. You can delete the `WinAirPlay` folder under `%APPDATA%` at any time.

## Audio routing on this PC

While streaming, the app may:

- Temporarily switch the Windows default playback device to a virtual cable (if one is installed), or
- Mute the PC speakers in compatibility mode

The previous default device and mute state are restored when you disconnect, quit, or if the app crashes. The app does not keep a copy of your audio after the stream ends.

## Network use

The app uses your **local network only** to:

- Discover AirPlay receivers (mDNS)
- Establish RTSP sessions and stream audio (UDP/TCP)

No internet connection is required for core functionality.

## Third-party services

The app is **not affiliated with Apple Inc.** AirPlay is a trademark of Apple Inc. WinAirPlay is an independent product that communicates with compatible receivers on your network.

## Children

The app does not knowingly collect information from children.

## Changes

We may update this policy. The “Last updated” date will change when we do.

## Contact

Use the support email you register with the Microsoft Store listing.

Publisher repository: [https://github.com/barbarosson/project](https://github.com/barbarosson/project)
