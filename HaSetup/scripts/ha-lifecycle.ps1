# Companion helpers for Windows PowerShell (optional; UI is preferred).

$ErrorActionPreference = "Stop"
$Image = "homeassistant/home-assistant:stable"
$Name = "smart-home-ha"
$Volume = "smart-home-ha-config"

function Test-DockerReady {
    try {
        docker version --format "{{.Server.Version}}" | Out-Null
        return $true
    } catch {
        Write-Host "Docker hazır değil. Docker Desktop kurun/başlatın: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
        return $false
    }
}

function Start-HomeAssistant {
    if (-not (Test-DockerReady)) { return }
    docker volume create $Volume | Out-Null
    docker pull $Image
    $exists = docker ps -a --filter "name=^/${Name}$" --format "{{.ID}}"
    if (-not $exists) {
        docker create --name $Name --restart unless-stopped `
            -e TZ=Europe/Istanbul `
            -v "${Volume}:/config" `
            -p "8123:8123" `
            $Image | Out-Null
    }
    docker start $Name
    Start-Process "http://localhost:8123"
}

function Stop-HomeAssistant {
    if (-not (Test-DockerReady)) { return }
    docker stop $Name
}

function Restart-HomeAssistant {
    if (-not (Test-DockerReady)) { return }
    docker restart $Name
}

function Remove-HomeAssistant {
    if (-not (Test-DockerReady)) { return }
    docker rm -f $Name
}

# Usage examples:
#   . .\scripts\ha-lifecycle.ps1
#   Start-HomeAssistant
