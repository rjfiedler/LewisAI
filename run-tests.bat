@echo off
echo ========================================
echo   SMS AI Assistant Test Suite
echo ========================================
echo.

echo [1/3] Testing Database Connection...
echo ----------------------------------------
node scripts\test-supabase.js
echo.
echo Press any key to continue to Twilio test...
pause >nul

echo [2/3] Testing Twilio Configuration...
echo ----------------------------------------
node scripts\test-twilio.js
echo.
echo Press any key to run the server...
pause >nul

echo [3/3] Starting Server...
echo ----------------------------------------
node src\app.js
