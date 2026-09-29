# HaSetup — Home Assistant auto-setup (MVP)

Windows masaüstü uygulaması: **Docker Desktop** üzerinden `homeassistant/home-assistant:stable` container’ını kurar, yönetir ve `http://localhost:8123` adresini açar.

**Stack:** .NET 8 · WPF (`HaSetup.App`) · Docker CLI (`HaSetup.Core`)

---

## English — Run on Windows

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
1. Detects Docker Desktop / `docker.exe`
2. Pulls `homeassistant/home-assistant:stable`
3. Creates container `smart-home-ha` with port **8123**, volume **`smart-home-ha-config` → `/config`**
4. Start / stop / restart / remove
5. Health-checks `http://localhost:8123` and opens the browser
6. Shows Turkish next-steps for HA onboarding

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

### Gereksinimler
- Windows 10/11 (x64)
- Kaynaktan derlemek için [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) (yoksa uygulama Türkçe rehber + indirme / sessiz kurulum dener)

### Derleme ve çalıştırma
```powershell
cd HaSetup
dotnet restore
dotnet build HaSetup.sln -c Release
dotnet run --project src\HaSetup.App\HaSetup.App.csproj -c Release
```

Visual Studio 2022 ile `HaSetup.sln` açıp `HaSetup.App` başlangıç projesi olarak F5 de basabilirsiniz.

### Uygulama ne yapar?
1. Docker Desktop / `docker.exe` var mı bakar
2. `homeassistant/home-assistant:stable` imajını çeker
3. `smart-home-ha` container’ını **8123** portu ve kalıcı **`smart-home-ha-config`** volume’u ile oluşturur
4. Başlat / durdur / yeniden başlat / sil
5. `http://localhost:8123` sağlık kontrolü + tarayıcıda açma
6. HA onboarding için Türkçe sonraki adımlar paneli

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

## Repo layout

| Path | Role |
|------|------|
| `src/HaSetup.Core` | Docker probe, HA lifecycle, health check, Windows install guidance |
| `src/HaSetup.App` | WPF status UI (Turkish) |
| `tests/HaSetup.Core.Tests` | Unit tests (fake Docker CLI) |
| `docker-compose.yml` | Same container contract for CLI smoke tests |
| `scripts/smoke-ha-lifecycle.sh` | Pull/create/start/stop/restart/remove smoke script |

## Verification notes
- Unit tests run on Linux/Windows without Docker Desktop.
- Full Docker Desktop + WPF UI must be verified on a real Windows machine.
- Linux CI can smoke-test `scripts/smoke-ha-lifecycle.sh` / compose when a Docker Engine is available.
