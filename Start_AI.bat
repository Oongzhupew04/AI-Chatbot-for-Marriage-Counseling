@echo off
echo =========================================
echo   Starting Marriage Counseling AI Backend
echo =========================================
echo.

echo 1. Starting openGauss Database Container...
docker start opengauss

echo 2. Starting Network Bridge Container...
REM docker start ollama-bridge

echo 3. Waking up DeepSeek and Ollama...
docker exec -d opengauss /bin/bash /usr/local/bin/start_ai.sh

echo.
echo All backend systems are online! You can now start your Node gateway.
echo.
pause