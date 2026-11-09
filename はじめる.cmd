@echo off
setlocal enableextensions
title Shacho AI Assistant Setup

echo ============================================
echo   Shacho AI Assistant ( Hisho ) - Setup
echo ============================================
echo.
echo Preparing. Please wait...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [1/4] Installing Node.js ...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements >nul 2>nul
) else (
  echo [1/4] Node.js : OK
)

where git >nul 2>nul
if errorlevel 1 (
  echo [2/4] Installing Git ...
  winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements >nul 2>nul
) else (
  echo [2/4] Git : OK
)

set "PATH=%PATH%;%ProgramFiles%\nodejs\;%ProgramFiles%\Git\cmd"

rem --- Claude ( the brain; uses your monthly subscription ) ---
where claude >nul 2>nul
if errorlevel 1 (
  echo.
  echo Claude Code is required but was not found.
  echo Please install Claude Code and sign in to Claude, then run this file again.
  pause
  exit /b 1
)

set "DEST=%USERPROFILE%\shacho-ai"
echo [3/4] Getting the app ...
if exist "%DEST%\.git" (
  pushd "%DEST%"
  git pull
  popd
) else (
  git clone https://github.com/kazuya-ide/shacho-ai-assistant "%DEST%"
)

if not exist "%DEST%\server.mjs" (
  echo.
  echo Failed to get the app. Check your internet and run this file again.
  pause
  exit /b 1
)

if not exist "%DEST%\persona.md" if exist "%DEST%\persona.example.md" copy "%DEST%\persona.example.md" "%DEST%\persona.md" >nul

powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Startup')+'\Hisho.lnk'); $s.TargetPath='%DEST%\start.cmd'; $s.WorkingDirectory='%DEST%'; $s.Save()" >nul 2>nul

echo [4/4] Starting ...
start "Hisho" /min /d "%DEST%" node server.mjs
timeout /t 3 >nul
start "" http://127.0.0.1:8787/

echo.
echo ============================================
echo   Done.  If the page did not open, go to:
echo       http://127.0.0.1:8787/
echo   If the assistant cannot reply, run once:  claude auth login
echo ============================================
echo.
pause
