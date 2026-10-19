@echo off
rem ============================================
rem MoAdmin Dev - STOP
rem Stops vite (5219) and API (3000), including their
rem watcher parents (npm / tsx watch), so no orphan is left.
rem ============================================

echo [MoAdmin] Stopping dev servers ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0devctl.ps1"

ping -n 3 127.0.0.1 >nul
