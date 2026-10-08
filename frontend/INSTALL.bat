@echo off
REM Frontend Installation Script for Windows
REM Run this after installing Node.js

echo Installing Beef Quality Assessment Frontend...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed
node --version
npm --version
echo.

REM Install dependencies
echo Installing dependencies...
call npm install

if %errorlevel% equ 0 (
    echo.
    echo Dependencies installed successfully!
    echo.
    
    REM Create .env.local if it doesn't exist
    if not exist .env.local (
        echo Creating .env.local from template...
        copy .env.local.example .env.local
        echo Please edit .env.local with your Supabase credentials
    ) else (
        echo .env.local already exists
    )
    
    echo.
    echo Setup complete!
    echo.
    echo Next steps:
    echo 1. Edit .env.local with your credentials
    echo 2. Run 'npm run dev' to start the development server
    echo 3. Open http://localhost:3000 in your browser
    echo.
) else (
    echo.
    echo Installation failed
    echo Please check the error messages above
    pause
    exit /b 1
)

pause
