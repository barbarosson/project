# Container Manager for HA (HaSetup MVP)

**Container Manager for HA** — Windows masaüstü uygulaması: **Docker Desktop** üzerinden `homeassistant/home-assistant:stable` container’ını kurar, yönetir ve `http://localhost:8123` adresini açar.

**Stack:** .NET 8 · WPF (`HaSetup.App`) · Docker CLI (`HaSetup.Core`) · repo folder `HaSetup/`

---

## English — Run on Windows

App display name (window title): **Container Manager for HA**.

### Prerequisites
- Windows 10/11 (x64)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (to build from source)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) (the app detects this and can open the download / try a quiet install)

### Build & run
```powershell
cd HaSetup
dotnet restore
dotnet build HaSetup.sln -c Release
dotnet run --project src\HaSetup.App\HaSetup.App.csproj -c Release
```

Or open `HaSetup.sln` in Visual Studio 2022 and press F5 (set `HaSetup.App` as startup project).

### What the app does
1. Detects Docker Desktop / `docker.exe` (and preflights WSL + Docker daemon before Install/Start)
2. Pulls `homeassistant/home-assistant:stable`
3. Creates container `smart-home-ha` with port **8123**, volume **`smart-home-ha-config` → `/config`**
4. Start / stop / restart / remove
5. Health-checks `http://localhost:8123` and opens the browser
6. Shows English next-steps for local hub onboarding
7. **Network & discovery** tab: why auto-discovery fails on Docker/WSL2, manual IP guide, **Free** firewall rules (UAC)
8. **Premium** (Store IAP placeholder / dev simulate): config volume zip backup/restore; experimental mDNS helper (default off)

### Freemium quick try (dev)
```powershell
# Option A: env before launch
$env:HASETTUP_SIMULATE_PREMIUM = "1"
dotnet run --project src\HaSetup.App\HaSetup.App.csproj -c Release

# Option B: in UI → Network & discovery → "Simulate premium (dev)"
```
- Free: **Add firewall rules (UAC)** (8123/TCP, 5353/UDP, 1900/UDP)
- Premium: Backup / Restore config volume; Enable mDNS helper (Experimental)

### Compose alternative (no UI)
```powershell
cd HaSetup
docker compose up -d
# open http://localhost:8123
docker compose down   # keeps named volume
```

### Out of scope (MVP)
Zigbee/USB passthrough, Supervisor add-ons, Proxmox, cloud tunnels.

---

## Türkçe — Windows’ta çalıştırma

Uygulama adı (pencere başlığı): **Container Manager for HA**.

### Gereksinimler
- Windows 10/11 (x64)
- Kaynaktan derlemek için [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) (yoksa uygulama İngilizce rehber + indirme / sessiz kurulum dener)

### Derleme ve çalıştırma
```powershell
cd HaSetup
dotnet restore
dotnet build HaSetup.sln -c Release
dotnet run --project src\HaSetup.App\HaSetup.App.csproj -c Release
```

Visual Studio 2022 ile `HaSetup.sln` açıp `HaSetup.App` başlangıç projesi olarak F5 de basabilirsiniz.

### Uygulama ne yapar?
1. Docker Desktop / `docker.exe` var mı bakar (Install/Start öncesi WSL + Docker daemon preflight)
2. `homeassistant/home-assistant:stable` imajını çeker
3. `smart-home-ha` container’ını **8123** portu ve kalıcı **`smart-home-ha-config`** volume’u ile oluşturur
4. Başlat / durdur / yeniden başlat / sil
5. `http://localhost:8123` sağlık kontrolü + tarayıcıda açma
6. Yerel hub onboarding için İngilizce sonraki adımlar paneli
7. **Network & discovery** sekmesi: WSL2/Docker NAT keşif sorunları, manuel IP, **Free** firewall (UAC)
8. **Premium**: config volume zip yedek/geri yükleme; deneysel mDNS yardımcısı (varsayılan kapalı; dev’de Simulate premium)

### Compose (arayüzsüz)
```powershell
cd HaSetup
docker compose up -d
# http://localhost:8123
docker compose down
```

### MVP dışı
Zigbee/USB, add-on mağazası, Proxmox, bulut tüneli.

---

## Microsoft Store vs dev builds

| | Dev / sideload | Store (`-p:StoreBuild=true`) |
|--|----------------|------------------------------|
| Display name | Container Manager for HA | Container Manager for HA |
| Silent / winget Docker install | Allowed (best-effort) | **Disabled** |
| Docker missing | Download + optional silent | Store deep-link + English steps only |
| HA lifecycle (Docker ready) | Yes | Yes (`runFullTrust` MSIX) |
| Elevation / Docker install from package | N/A (dev EXE) | **No** |
| License | `DevLicenseService` (Simulate premium / `HASETTUP_SIMULATE_PREMIUM`) | `StoreLicenseService` (`PREMIUM_UNLOCK_ID_PLACEHOLDER`) |
| Firewall rules (UAC) | Free | Free |
| Backup / mDNS helper | Premium (simulated) | Premium (IAP when Partner Center id set) |

```powershell
# Store-oriented binaries (defines STORE_BUILD)
dotnet build src\HaSetup.App\HaSetup.App.csproj -c Release -p:StoreBuild=true
```

### Produce `.msix` (Windows + Visual Studio)

See **[`packaging/README.md`](packaging/README.md)** and `scripts/build-msix-store.cmd`.

```powershell
cd HaSetup
.\scripts\build-msix-store.cmd
# or: Publish → Create App Packages on packaging\HaSetup.Package\HaSetup.Package.wapproj
```

Package identity display name: **Container Manager for HA**. Capability: `runFullTrust` only (no elevation).

## Repo layout

| Path | Role |
|------|------|
| `src/HaSetup.Core` | Docker, HA lifecycle, preflight, network/firewall, licensing, backup, mDNS skeleton |
| `src/HaSetup.App` | WPF UI: Setup + Network & discovery tabs |
| `packaging/HaSetup.Package` | MSIX / Windows Application Packaging Project |
| `tests/HaSetup.Core.Tests` | Unit tests (fake Docker CLI, license, firewall) |
| `docker-compose.yml` | Same container contract for CLI smoke tests |
| `scripts/smoke-ha-lifecycle.sh` | Pull/create/start/stop/restart/remove smoke script |
| `scripts/mdns-udp-forward.ps1` | Experimental mDNS forwarder skeleton |
| `scripts/build-msix-store.cmd` | StoreBuild + MSBuild package helper |

## Verification notes
- Unit tests run on Linux/Windows without Docker Desktop.
- Full Docker Desktop + WPF UI must be verified on a real Windows machine.
- MSIX packaging requires Windows + VS packaging tools.
- Linux CI can smoke-test `scripts/smoke-ha-lifecycle.sh` / compose when a Docker Engine is available.
