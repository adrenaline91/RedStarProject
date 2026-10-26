@echo off
cd /d "%~dp0"
set "ELECTRON=node_modules\electron\dist\electron.exe"

if exist "%ELECTRON%" goto run

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is required for the first install: https://nodejs.org
  pause
  exit /b 1
)

echo Installing Electron (only once, about 100 MB)...
call npm install --no-fund --no-audit
if not exist "%ELECTRON%" call node node_modules\electron\install.js
if not exist "%ELECTRON%" (
  echo Electron could not be installed. Check your connection and run this file again.
  pause
  exit /b 1
)

:run
start "" "%ELECTRON%" "%~dp0."
