@echo off
chcp 65001 >nul
setlocal enableextensions
title 社長AIアシスタント「秘書」 はじめの準備

echo ============================================
echo   社長AIアシスタント「秘書」 はじめの準備
echo ============================================
echo.
echo 必要なものを自動で用意します。少しお待ちください。
echo.

rem --- Node.js（土台）---
where node >nul 2>nul
if errorlevel 1 (
  echo [1/4] Node.js を入れています...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements >nul 2>nul
) else (
  echo [1/4] Node.js はすでにあります。
)

rem --- Git（取り込み用）---
where git >nul 2>nul
if errorlevel 1 (
  echo [2/4] Git を入れています...
  winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements >nul 2>nul
) else (
  echo [2/4] Git はすでにあります。
)

rem 入れた直後でも使えるよう、よくある場所を PATH に足す
set "PATH=%PATH%;%ProgramFiles%\nodejs\;%ProgramFiles%\Git\cmd"

set "DEST=%USERPROFILE%\shacho-ai"
echo [3/4] アプリを取り込みます...
if exist "%DEST%\.git" (
  pushd "%DEST%"
  git pull
  popd
) else (
  git clone https://github.com/kazuya-ide/shacho-ai-assistant "%DEST%"
)

if not exist "%DEST%\server.mjs" (
  echo.
  echo 取り込みに失敗しました。ネットにつながっているか確認し、もう一度このファイルを実行してください。
  pause
  exit /b 1
)

rem 人格ファイルを初回だけ用意
if not exist "%DEST%\persona.md" if exist "%DEST%\persona.example.md" copy "%DEST%\persona.example.md" "%DEST%\persona.md" >nul

rem PC起動時に自動で立ち上がるよう登録
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Startup')+'\秘書.lnk'); $s.TargetPath='%DEST%\start.cmd'; $s.WorkingDirectory='%DEST%'; $s.Save()" >nul 2>nul

echo [4/4] 秘書を起動します...
start "" /min cmd /c "cd /d ""%DEST%"" ^&^& node server.mjs"
timeout /t 3 >nul
start "" http://127.0.0.1:8787/

echo.
echo ============================================
echo   準備ができました！
echo   画面が開かないときは、ブラウザで
echo       http://127.0.0.1:8787/
echo   を開いてください。
echo.
echo   ※「クロードにログインしてください」と出たら、
echo     画面の案内どおり 1回だけ ログインしてください。
echo ============================================
echo.
pause
