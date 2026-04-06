@echo off
setlocal
title Orion-X: One-Click Runner

echo ==========================================
echo       🚀 Orion-X PROJECT LAUNCHER
echo ==========================================
echo.

:: 1. Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. 
    echo Please install Python 3.12 from https://www.python.org/
    pause
    exit /b
)

:: 2. Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. 
    echo Please install Node from https://nodejs.org/ (LTS version)
    pause
    exit /b
)

:: 3. Setup Backend
echo [1/3] Setting up Backend dependencies...
pushd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing background requirements...
pip install -r requirements.txt --quiet

:: Check for .env 
if not exist .env (
    if exist .env.example (
        echo [WARNING] .env file is missing. Creating pre-filled version...
        copy .env.example .env
        echo NOTE: Make sure your API keys are correct in backend/.env
    )
)
popd

echo.
:: 4. Setup Frontend
echo [2/3] Setting up Frontend dependencies...
pushd frontend
if not exist node_modules (
    echo Installing node modules (this may take a minute)...
    call npm install --quiet
)
popd

echo.
:: 5. Start everything
echo [3/3] Launching Orion-X...
echo.
echo ------------------------------------------
echo Backend will run on: http://localhost:8000
echo Frontend will run on: http://localhost:5173
echo ------------------------------------------
echo.

:: Start Backend in a new window
echo Launching Backend server...
start "Orion-X Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload"

:: Start Frontend in a new window
echo Launching Frontend server...
start "Orion-X Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo SUCCESS! Your project is opening now.
echo Just wait a few seconds and then go to http://localhost:5173 in your browser.
echo.
pause
