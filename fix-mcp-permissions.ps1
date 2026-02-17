# c:\mcp.json EPERM hatasini duzelt - Yonetici olarak calistirin
# Sag tik PowerShell -> "Yonetici olarak calistir"
# cd "C:\Users\barba\.cursor\worktrees\project\rdc"
# .\fix-mcp-permissions.ps1

$source = "C:\Users\barba\.cursor\mcp.json"
$target = "c:\mcp.json"

if (Test-Path $target) {
    Write-Host "c:\mcp.json zaten var. Siliniyor..." -ForegroundColor Yellow
    Remove-Item $target -Force
}

# Symlink: c:\mcp.json -> gercek dosya (Cursor c:\ yazmaya calisinca aslinda .cursor'dakine yazar)
try {
    cmd /c mklink "c:\mcp.json" "C:\Users\barba\.cursor\mcp.json"
    Write-Host "Basarili: Symlink olusturuldu. Apply worktree artik calismali." -ForegroundColor Green
} catch {
    # Symlink basarisizsa dosyayi dogrudan olustur
    Copy-Item $source $target -Force
    icacls $target /grant "${env:USERNAME}:F" 2>$null
    Write-Host "Symlink yapilamadi, dosya kopyalandi." -ForegroundColor Yellow
}
