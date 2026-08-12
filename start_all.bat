@echo off
title Public Infrastructure System - Service Launcher
cls
echo =========================================================================
echo       Public Infrastructure Reporting ^& Tracking System Launcher
echo =========================================================================
echo.
echo Starting system services...
echo.

set REPO_DIR=%~dp0

:: Check root node_modules
if not exist "%REPO_DIR%node_modules\" (
    echo [WARNING] Root node_modules not found.
    echo Installing frontend dependencies...
    cd /d "%REPO_DIR%"
    call npm install
    echo.
)

:: Check server node_modules
if not exist "%REPO_DIR%server\node_modules\" (
    echo [WARNING] Server node_modules not found.
    echo Installing backend dependencies...
    cd /d "%REPO_DIR%server"
    call npm install
    echo.
)

:: Check root .env
if not exist "%REPO_DIR%.env" (
    echo [NOTICE] Root .env not found. Copying from .env.example...
    copy "%REPO_DIR%.env.example" "%REPO_DIR%.env" >nul
)

:: Check server .env
if not exist "%REPO_DIR%server\.env" (
    echo [NOTICE] Server .env not found. Copying from server\.env.example...
    copy "%REPO_DIR%server\.env.example" "%REPO_DIR%server\.env" >nul
)

echo [1/2] Launching Express AI Service (Port 5000)...
start "Express AI Service" cmd /k "cd /d %REPO_DIR%server && npm start"

echo [2/2] Launching Vite Frontend (Port 5173)...
start "Vite Frontend" cmd /k "cd /d %REPO_DIR% && npm run dev"

echo.
echo =========================================================================
echo   SUCCESS: All servers launched in dedicated terminal windows!
echo =========================================================================
echo.
echo   - Vite Frontend App : http://localhost:5173
echo   - Express AI Server : http://localhost:5000
echo   - AI Health Check   : http://localhost:5000/health
echo.
echo   Keep the newly opened terminal windows open while developing.
echo   Press any key to close this launcher script...
echo =========================================================================
pause >nul
