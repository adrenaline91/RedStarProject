@echo off
cd /d "%~dp0"
set "ELECTRON=node_modules\electron\dist\electron.exe"

if exist "%ELECTRON%" goto run

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js est necessaire pour la premiere installation : https://nodejs.org
  pause
  exit /b 1
)

echo Installation d'Electron (une seule fois, environ 100 Mo)...
call npm install --no-fund --no-audit
if not exist "%ELECTRON%" call node node_modules\electron\install.js
if not exist "%ELECTRON%" (
  echo L'installation d'Electron a echoue. Verifie ta connexion puis relance ce fichier.
  pause
  exit /b 1
)

:run
start "" "%ELECTRON%" "%~dp0."
