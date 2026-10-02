@echo off
cd /d "%~dp0"
title NihonSpeak - Luyen Noi Giao Tiep Tieng Nhat AI

echo =======================================================
echo    DANG KHOI DONG NIHONSPEAK (BACKEND + FRONTEND)
echo =======================================================
echo.
echo 1. Backend chay tai:  http://localhost:5001
echo 2. Frontend chay tai: http://localhost:5174
echo.
echo Dang mo trinh duyet...

start "" "http://localhost:5174"

echo.
echo Dang chay may chu (Vui long khong tat cua so nay khi hoc)...
echo.

call npm run dev

pause
