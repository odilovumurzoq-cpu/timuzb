@echo off
echo ==============================================
echo TimProduction CRM - Local Serverni Ishga Tushirish
echo ==============================================

set "NODE_DIR=%~dp0node_env\node-v20.11.1-win-x64"
set "PATH=%NODE_DIR%;%PATH%"

if not exist "%NODE_DIR%\node.exe" (
    echo Xatolik: Node.js o'rnatilmagan! Iltimos kutib turing...
    pause
    exit /b
)

echo.
echo [1/2] Backend Server ishga tushirilmoqda...
start "TimProduction - Backend" cmd /c "cd backend && node server.js"

echo [2/2] Frontend Server ishga tushirilmoqda...
start "TimProduction - Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo Tizim muvaffaqiyatli ishga tushirildi!
echo Bir ozdan so'ng sayt ochiladi...
timeout /t 5 >nul
start http://localhost:5173
