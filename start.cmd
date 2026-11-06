@echo off
rem 秘書（社長AIアシスタント）を起動します。
rem このファイルのショートカットを「スタートアップ」に置くと、PC起動時に自動で立ち上がります。
cd /d "%~dp0"
node server.mjs
