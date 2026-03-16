@echo off
cd /d "%~dp0"
echo ========================================
echo BluePrint Engineering Consultancy
echo ========================================
echo.
echo Starting application...
echo.
echo Opening browser...
start http://localhost:3000
echo.
echo Running development server...
npm run dev
pause