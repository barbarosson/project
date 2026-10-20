@echo off
REM Build Store-oriented WPF binaries (STORE_BUILD) then package with MSBuild if available.
setlocal
cd /d "%~dp0\.."

dotnet build src\HaSetup.App\HaSetup.App.csproj -c Release -p:StoreBuild=true
if errorlevel 1 exit /b 1

where msbuild >nul 2>&1
if errorlevel 1 (
  echo MSBuild not on PATH. Open packaging\HaSetup.Package in Visual Studio and Publish - Create App Packages.
  echo WPF StoreBuild binaries are ready under src\HaSetup.App\bin\Release\
  exit /b 0
)

msbuild packaging\HaSetup.Package\HaSetup.Package.wapproj /p:Configuration=Release /p:Platform=x64 /p:StoreBuild=true /p:AppxPackageDir=%cd%\artifacts\msix\
exit /b %ERRORLEVEL%
