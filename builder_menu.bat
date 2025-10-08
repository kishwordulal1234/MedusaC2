@echo off
echo ============================================================
echo MEDUSA C2 Framework - Builder Menu
echo Educational Use Only
echo ============================================================

echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.7 or higher
    pause
    exit /b 1
)

echo Installing/Updating required packages...
pip install -r requirements.txt

:menu
echo.
echo ============================================================
echo MEDUSA C2 Framework - Payload Builder
echo ============================================================
echo 1. Generate Python Client (with EXE)
echo 2. Generate Netcat Commands
echo 3. Generate PowerShell Script
echo 4. Generate Batch Dropper
echo 5. Generate VBS Dropper
echo 6. Test Builder (all functions)
echo 7. Help / Usage Guide
echo 8. Exit
echo ============================================================
echo.

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto python
if "%choice%"=="2" goto netcat
if "%choice%"=="3" goto powershell
if "%choice%"=="4" goto batch
if "%choice%"=="5" goto vbs
if "%choice%"=="6" goto test
if "%choice%"=="7" goto help
if "%choice%"=="8" goto exit

echo Invalid choice. Please try again.
goto menu

:python
echo.
echo Generating Python Client...
python builder.py --type python
echo.
pause
goto menu

:netcat
echo.
echo Generating Netcat Commands...
python builder.py --type netcat
echo.
pause
goto menu

:powershell
echo.
echo Generating PowerShell Script...
python builder.py --type powershell
echo.
pause
goto menu

:batch
echo.
echo Generating Batch Dropper...
python builder.py --type batch
echo.
pause
goto menu

:vbs
echo.
echo Generating VBS Dropper...
python builder.py --type vbs
echo.
pause
goto menu

:test
echo.
echo Testing all builder functions...
python builder.py --test
echo.
pause
goto menu

:help
echo.
echo MEDUSA C2 Framework - Builder Help
echo ====================================
echo.
echo This menu provides quick access to all payload generation functions.
echo.
echo For advanced options, run builder.py directly with command line arguments.
echo See BUILDER_GUIDE.md for detailed usage instructions.
echo.
pause
goto menu

:exit
echo.
echo Exiting MEDUSA C2 Builder...
exit /b 0
