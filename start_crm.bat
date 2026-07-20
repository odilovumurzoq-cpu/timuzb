@echo off
color 0b
echo ===================================================
echo       TIM PRODUCTION CRM - Boshqaruv Tizimi
echo ===================================================
echo.
echo Tizim ishga tushirilmoqda. Iltimos, kuting...
echo.

cd /d "%~dp0"

echo [1/3] Backend (Server) tekshirilmoqda...
cd backend
IF NOT EXIST "node_modules" (
    echo node_modules topilmadi. Backend paketlari o'rnatilmoqda...
    call npm install
)
start "TimProduction - Server" cmd /c "npm start"
echo Server muvaffaqiyatli ishga tushdi!
echo.

echo [2/3] Frontend (Web Sayt) tekshirilmoqda...
cd ../frontend
IF NOT EXIST "node_modules" (
    echo node_modules topilmadi. Frontend paketlari o'rnatilmoqda...
    call npm install
)
start "TimProduction - Vebsayt" cmd /c "npm start"
echo Web sayt muvaffaqiyatli ishga tushdi!
echo.

echo [3/3] Tizim tayyor!
echo Brauzer avtomatik ravishda ochiladi: http://localhost:3000
timeout /t 5 >nul
start http://localhost:3000

echo.
echo ===================================================
echo Dastur ishlayapti. Dasturni yopish uchun shu oynani yoping.
echo ===================================================
pause
