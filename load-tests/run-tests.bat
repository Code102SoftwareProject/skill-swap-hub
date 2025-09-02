@echo off
echo 🚀 Artillery Load Testing for Skill-Swap-Hub
echo ============================================

REM Check if Artillery is installed
where artillery >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Artillery is not installed. Please install it first:
    echo npm install -g artillery
    pause
    exit /b 1
)

REM Check if Next.js server is running
powershell -Command "try { Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -ErrorAction Stop } catch { exit 1 }" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Next.js server is not running on localhost:3000
    echo Please start your server first: npm run dev
    pause
    exit /b 1
)

echo ✅ Server is running, starting load tests...
echo.

echo Select which test to run:
echo 1^) Basic Load Test ^(recommended for first run^)
echo 2^) Authentication Load Test
echo 3^) Stress Test ^(find breaking point^)
echo 4^) Run All Tests ^(this will take ~20 minutes^)
echo.

set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" goto basic
if "%choice%"=="2" goto auth
if "%choice%"=="3" goto stress
if "%choice%"=="4" goto all
goto invalid

:basic
echo 📊 Running Basic Load Test...
echo Started at: %date% %time%
echo ----------------------------------------
artillery run load-tests\basic-load-test.yml
echo ----------------------------------------
echo ✅ Basic Load Test completed at: %date% %time%
goto end

:auth
echo 📊 Running Authentication Load Test...
echo Started at: %date% %time%
echo ----------------------------------------
artillery run load-tests\auth-load-test.yml
echo ----------------------------------------
echo ✅ Authentication Load Test completed at: %date% %time%
goto end

:stress
echo 📊 Running Stress Test...
echo Started at: %date% %time%
echo ----------------------------------------
artillery run load-tests\stress-test.yml
echo ----------------------------------------
echo ✅ Stress Test completed at: %date% %time%
goto end

:all
echo 🔥 Running all tests - this will take approximately 20 minutes...
echo 📊 Running Basic Load Test...
artillery run load-tests\basic-load-test.yml
timeout /t 10 /nobreak >nul
echo 📊 Running Authentication Load Test...
artillery run load-tests\auth-load-test.yml
timeout /t 10 /nobreak >nul
echo 📊 Running Stress Test...
artillery run load-tests\stress-test.yml
echo 🎉 All tests completed!
goto end

:invalid
echo ❌ Invalid choice. Exiting...
pause
exit /b 1

:end
echo.
echo 📈 Load testing completed!
echo Check the results above for:
echo - Response times ^(min, max, median, p95, p99^)
echo - Request rates ^(req/sec^)
echo - Error rates
echo - Concurrent user handling capacity
pause
