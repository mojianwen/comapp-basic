@echo off
rem ============================================
rem MoAdmin Dev - STOP
rem Kills processes listening on port 5219 (vite) and 3000 (API)
rem ============================================

set FOUND=0

for %%p in (5219 3000) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":%%p " ^| findstr LISTENING') do (
        if not "%%a"=="0" (
            echo [MoAdmin] Stopping PID %%a on port %%p ...
            taskkill /F /T /PID %%a >nul 2>&1
            set FOUND=1
        )
    )
)

if %FOUND%==0 (
    echo [MoAdmin] No server found on ports 5219 / 3000. Nothing to stop.
) else (
    echo [MoAdmin] Servers stopped.
)
ping -n 5 127.0.0.1 >nul
