@echo off
rem ============================================
rem MoAdmin Dev - START
rem 1) API server (Express, port 3000) in a new window
rem 2) Vite dev server (port 5219, foreground)
rem
rem Idempotent: ports already open -> skipped.
rem Stale watchers (npm/tsx/vite without a listening child) are
rem cleaned first, otherwise every retry adds a duplicate.
rem ============================================

rem Move to repo root (parent of scripts folder)
cd /d %~dp0..

echo [MoAdmin] Checking for stale watcher processes ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0devctl.ps1" -StaleOnly

rem Start API server if not running on port 3000
netstat -ano | findstr /c:":3000 " | findstr LISTENING >nul 2>&1
if %errorlevel%==0 (
    echo [MoAdmin] API server is ALREADY running on http://localhost:3000
) else (
    echo [MoAdmin] Starting API server in a new window: http://localhost:3000
    start "MoAdmin API" cmd /c "npm run dev --workspace @mo/server && pause"
)

rem Skip if dev server already running on port 5219
netstat -ano | findstr /c:":5219 " | findstr LISTENING >nul 2>&1
if %errorlevel%==0 (
    echo [MoAdmin] Dev server is ALREADY running on http://localhost:5219
    echo [MoAdmin] Nothing to do. Use stop.bat first if you want a restart.
    ping -n 6 127.0.0.1 >nul
    exit /b 0
)

echo [MoAdmin] Starting dev server: http://localhost:5219
echo [MoAdmin] Keep this window open. To stop: close this window or run stop.bat
echo.
call npm run dev --workspace @mo/web

echo.
echo [MoAdmin] Server exited.
ping -n 4 127.0.0.1 >nul
