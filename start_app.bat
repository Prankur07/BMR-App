@echo off
title Mandi Gate Pass - Backend & Frontend

echo ============================================
echo   Mandi Gate Pass Generator - Starting...
echo ============================================
echo.

:: Check if venv exists
if not exist "backend\venv" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
    echo.
)

:: Start Backend in new window
echo Starting Backend (FastAPI on port 8000)...
start "Mandi Gate Pass - Backend" cmd /k "cd /d D:\Github\BMR App\backend && call venv\Scripts\activate.bat && echo Backend starting on http://0.0.0.0:8000 && python main.py"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend (Production with API proxy) in new window
echo Starting Frontend (Production on port 3000 with API proxy)...
start "Mandi Gate Pass - Frontend" cmd /k "cd /d D:\Github\BMR App && python serve_production.py"

echo.
echo ============================================
echo   Both servers starting in separate windows
echo ============================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Access from phone: http://YOUR_PC_IP:3000
echo (Run 'ipconfig' to find YOUR_PC_IP)
echo.
echo Press any key to close this window...
pause >nul