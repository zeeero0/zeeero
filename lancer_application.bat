
@echo off
TITLE SocialBoost Morocco - Auto Loader
color 0b

echo ====================================================
echo    WELCOME TO SOCIALBOOST MOROCCO AUTO-LOADER 🇲🇦
echo ====================================================
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js is NOT installed!
    echo Please install it from: https://nodejs.org/
    pause
    exit
)

echo [1/3] Installing dependencies (npm install)...
call npm install

echo.
echo [2/3] Starting the infrastructure...
echo [INFO] Server will run on port 3001
echo [INFO] Web App will run on port 5173
echo.

:: Start the combined dev command
echo [3/3] Launching Application...
npm run dev

pause
