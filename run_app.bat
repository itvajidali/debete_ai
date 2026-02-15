@echo off
cd /d "%~dp0"

echo ==========================================
echo      AI Debate App - Startup Script
echo ==========================================

if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b %ERRORLEVEL%
    )
)

echo [INFO] Starting development server...
echo [INFO] Open http://localhost:3000 in your browser once ready.
echo.

call npm run dev

pause
