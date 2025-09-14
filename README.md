# 🐍 MEDUSA C2 Framework

<div align="center">

![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-green.svg)
![License](https://img.shields.io/badge/License-Custom-red.svg)
![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)
![Version](https://img.shields.io/badge/Version-2.1.0-purple.svg)
![Build](https://img.shields.io/badge/Build-Stable-success.svg)
![Creator](https://img.shields.io/badge/Created%20by-unknown__hart-ff79c6.svg)

**🎯 Professional Command & Control Framework for Cybersecurity Education**

*A comprehensive, feature-rich C2 framework built for educational purposes and authorized penetration testing*

**👨‍💻 Created by: [unknown_hart](https://github.com/unknown_hart)**

**⭐ Star this repository if you find it useful!**

[![GitHub stars](https://img.shields.io/github/stars/medusa-c2/medusa?style=social)](https://github.com/medusa-c2/medusa)
[![GitHub forks](https://img.shields.io/github/forks/medusa-c2/medusa?style=social)](https://github.com/medusa-c2/medusa)

**📜 License**: Use, modify, and distribute with attribution - **Cannot be sold or claimed**

</div>

---

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [📦 Installation](#-installation)
- [🎮 Usage Guide](#-usage-guide)
- [🔧 Configuration](#-configuration)
- [🛠️ Builder Tool](#️-builder-tool)
- [📁 File Structure](#-file-structure)
- [🔒 Security](#-security)
- [🐛 Troubleshooting](#-troubleshooting)
- [📚 Additional Resources](#-additional-resources)
- [🤝 Contributing](#-contributing)
- [📞 Support](#-support)
- [⚖️ Legal & Ethics](#️-legal--ethics)
- [🙏 Acknowledgments](#-acknowledgments)

---

## 🚀 Quick Start

### Windows (Recommended)
```batch
# Clone and start everything automatically
git clone <repository-url> medusa-c2
cd medusa-c2
start.bat
```

### Linux/macOS
```bash
# Clone and setup
git clone <repository-url> medusa-c2
cd medusa-c2
chmod +x start.sh
./start.sh
```

### Manual Setup
```bash
# Install dependencies
pip install flask flask-socketio cryptography pyinstaller

# Start server
python server.py

# In another terminal, start client
python client.py

# Open web interface
# http://localhost:5000
```

---

## ✨ Features

### 🎯 **Core Capabilities**

| Feature | Description | Status |
|---------|-------------|---------|
| **Multi-Client Support** | Handle unlimited simultaneous connections | ✅ |
| **Real-Time Dashboard** | Live web interface with instant updates | ✅ |
| **Cross-Platform** | Windows, Linux, macOS compatibility | ✅ |
| **File Operations** | Upload, download, edit files remotely | ✅ |
| **Remote Terminal** | Interactive command execution | ✅ |
| **Screenshot Capture** | Remote screen capture functionality | ✅ |
| **Payload Builder** | Generate custom executables | ✅ |
| **Stealth Mode** | Background execution without detection | ✅ |

### 🖥️ **Server Features**

- **🌐 Web Dashboard**: Modern UI with Dracula theme
- **⚡ Real-Time Updates**: WebSocket-powered live interface
- **📊 Client Management**: Monitor and control multiple clients
- **📂 File Explorer**: Remote file system navigation
- **💻 Interactive Terminal**: Execute commands with full output
- **🔨 Payload Builder**: Generate custom client executables
- **👂 Listener Management**: Create and manage multiple listeners
- **📝 Task Tracking**: Complete command and task history
- **🗂️ File Management**: Organized downloads and screenshots
- **🔍 Advanced Logging**: Comprehensive activity monitoring

### 🤖 **Client Features**

- **🥷 Stealth Execution**: Invisible background operation
- **🔄 Auto-Reconnection**: Persistent connection with smart retry
- **🌍 Cross-Platform**: Native support for all major platforms
- **⚙️ Command Execution**: Full system command capabilities
- **📁 File Operations**: Bidirectional file transfer
- **📷 Screenshot Capture**: Cross-platform screen capture
- **🛡️ Error Resilience**: Robust error handling and recovery
- **🎯 Directory Tracking**: Smart working directory management
- **💾 Persistence Options**: Auto-start and registry persistence

### 🔧 **Advanced Features**

- **🏗️ Payload Builder**: Generate executables with multiple stealth modes and 30-second persistence
- **🔄 Persistent Connections**: Auto-reconnecting clients with 30-second intervals for maximum reliability
- **🎯 Smart Reconnection**: Exponential backoff with jitter randomization for stealth operation
- **🥷 Stealth Modes**: Complete invisibility with no console windows or process indicators
- **🎨 Dark Theme**: Professional Dracula color scheme optimized for security operations
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **🔌 Plugin Architecture**: Extensible command system with modular payload support
- **📊 Performance Monitoring**: Real-time resource usage tracking and connection analytics
- **🔐 Secure Communication**: JSON-based message protocol with Base64 file encoding
- **⚡ Multi-Threading**: Concurrent client handling with non-blocking operations
- **🛡️ Error Resilience**: Robust error handling with graceful failure recovery
- **🌐 Cross-Platform**: Native support for Windows, Linux, and macOS environments

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   Web Browser   │◄──►│   MEDUSA Server  │◄──►│   Client Agent  │
│   (Dashboard)   │    │                  │    │   (Target PC)   │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
    WebSocket/HTTP           TCP Listener              TCP Client
     Port 5000               Port 4444              Auto-Reconnect
```

### Communication Flow
1. **Client** connects to **Server** via TCP (Port 4444)
2. **Server** manages clients and serves web interface (Port 5000)
3. **Web Dashboard** communicates with server via WebSocket
4. Commands flow: Browser → Server → Client → Server → Browser

### Technology Stack
- **Backend**: Python 3.7+, Flask, Flask-SocketIO
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Communication**: TCP Sockets, WebSocket, JSON Protocol
- **Encryption**: Base64 encoding for file transfers
- **UI Theme**: Custom Dracula implementation

---

## 📦 Installation

### Prerequisites
- **Python 3.7+** (Python 3.8+ recommended)
- **pip** package manager
- **Administrative privileges** (for some features)

### Method 1: Automatic Installation (Recommended)
```bash
# Windows
start.bat

# Linux/macOS
chmod +x start.sh
./start.sh
```

### Method 2: Manual Installation
```bash
# Install Python dependencies
pip install flask flask-socketio cryptography

# Optional: For payload building
pip install pyinstaller

# Clone repository
git clone <repository-url> medusa-c2
cd medusa-c2

# Start server
python server.py

# In another terminal, start client
python client.py
```

### Method 3: Virtual Environment (Recommended for Development)
```bash
# Create virtual environment
python -m venv medusa-env

# Activate virtual environment
# Windows:
medusa-env\Scripts\activate
# Linux/macOS:
source medusa-env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run MEDUSA
python server.py
```

---

## 🎮 Usage Guide

### 🚀 Getting Started

#### Step 1: Start the Server
```bash
python server.py

# Expected output:
# ============================================================
# MEDUSA C2 Framework Server - Starting
# Educational Use Only
# ============================================================
# [INFO] Listener 'Default' started on 0.0.0.0:4444
# [INFO] Starting web interface on 0.0.0.0:5000
# * Running on http://127.0.0.1:5000
```

#### Step 2: Deploy Client
```bash
# Basic client deployment
python client.py

# Advanced deployment (generated executable)
# See Builder Tool section for creating custom executables
```

#### Step 3: Access Web Interface
1. Open browser and navigate to **http://localhost:5000**
2. You should see the MEDUSA dashboard with Dracula theme
3. Connected clients will appear in the "Clients" section

### 🖥️ Web Dashboard Guide

#### 🏠 Dashboard Overview
- **Clients Tab**: View and manage connected clients
- **Listeners Tab**: Create and manage TCP listeners
- **Terminal Tab**: Interactive command execution
- **File Explorer Tab**: Remote file system navigation
- **Builder Tab**: Generate custom payloads

#### 💻 Interactive Terminal
1. **Select Client**: Choose target from dropdown
2. **Execute Commands**: Type commands and press Enter
3. **View Output**: Real-time command results
4. **Directory Navigation**: Use `cd`, `pwd`, `dir`/`ls`

**Supported Commands**:
```bash
# System information
whoami                    # Current user
hostname                  # Computer name
systeminfo               # Detailed system info

# File operations
dir / ls                 # List directory contents
cd <path>                # Change directory
pwd                      # Show current directory
type <file> / cat <file> # Display file contents

# Network information
ipconfig / ifconfig      # Network configuration
netstat -an              # Network connections
arp -a                   # ARP table

# Process management
tasklist / ps            # Running processes
taskill /PID <id>        # Kill process

# Special commands
screenshot               # Capture screen
download <filepath>      # Download file
```

#### 📂 File Explorer
1. **Select Client**: Choose target client
2. **Navigate**: Click folders to browse
3. **Select Files**: Click files to select (highlighted in pink)
4. **Operations**:
   - **Download**: Select file and click Download button
   - **Upload**: Click Upload button and select local file
   - **Edit**: Select text file and click Edit button
   - **Delete**: Select file/folder and click Delete button
   - **New Folder**: Click New Folder button

**Visual Indicators**:
- **Green border**: Files (clickable for operations)
- **Purple border**: Directories (clickable to navigate)
- **Pink glow**: Currently selected item

#### 🔨 Payload Builder
1. **Select Type**: Python Executable, Netcat, or PowerShell
2. **Configure Settings**:
   - **Server IP**: Your MEDUSA server IP
   - **Server Port**: Listener port (default: 4444)
   - **Payload Mode**: Silent, Stealth, or Basic
   - **Persistence**: Enable auto-start (optional)
3. **Generate**: Click "Generate Payload" button
4. **Deploy**: Copy generated files to target systems

**Payload Modes**:
- **Silent**: Completely hidden operation (recommended)
- **Stealth**: Enhanced hiding with process management
- **Basic**: Standard executable with visible console

#### 👂 Listener Management
1. **View Listeners**: See all active/inactive listeners
2. **Create Listener**: Click "Create Listener" button
3. **Configure**: Set name, host, and port
4. **Start/Stop**: Control listener status
5. **Monitor**: View connection count and status

### 📈 Advanced Usage

#### CLI Mode
```bash
# Start server in CLI-only mode
python server.py --cli-only

# Available commands:
medusa> clients              # List connected clients
medusa> tasks               # View recent tasks
medusa> listeners           # List active listeners
medusa> exec <id> <command> # Execute command on client
medusa> screenshot <id>     # Capture screenshot
medusa> help                # Show help
medusa> exit                # Exit server
```

#### Custom Configuration
```bash
# Custom server configuration
python server.py --host 0.0.0.0 --port 8080 --listener-port 9999

# Help and options
python server.py --help
```

---

## 🔧 Configuration

### Server Configuration

#### Command Line Options
```bash
python server.py [OPTIONS]

Options:
  --host HOST              Host for web interface (default: 0.0.0.0)
  --port PORT              Port for web interface (default: 5000)
  --listener-port PORT     Port for C2 listener (default: 4444)
  --cli-only               Start in CLI-only mode (no web interface)
  --no-web                 Disable web interface
  --debug                  Enable debug mode
  --help                   Show help message
```

#### Configuration Examples
```bash
# Custom web interface port
python server.py --port 8080

# Custom listener port
python server.py --listener-port 9999

# External access (bind to all interfaces)
python server.py --host 0.0.0.0

# CLI only mode
python server.py --cli-only

# Custom configuration
python server.py --host 192.168.1.100 --port 8080 --listener-port 4445
```

### Client Configuration

#### Basic Configuration
Edit the configuration section in `client.py`:

```python
# Configuration
SERVER_HOST = "127.0.0.1"     # C2 server IP address
SERVER_PORT = 4444            # C2 server port
CLIENT_ID = str(uuid.uuid4()) # Unique client identifier
CHECKIN_INTERVAL = 30         # Heartbeat interval (seconds)
JITTER = 0.2                  # Timing randomization (0.0-1.0)
MAX_RECONNECT_ATTEMPTS = -1   # Infinite reconnection attempts
RECONNECT_DELAY = 30          # Base reconnection delay (seconds)
```

#### Advanced Client Configuration
```python
# Network Configuration
SERVER_HOST = "192.168.1.100"  # Your MEDUSA server IP
SERVER_PORT = 4444             # Match server listener port

# Timing Configuration
CHECKIN_INTERVAL = 60          # Less frequent heartbeats
JITTER = 0.3                   # More randomization
RECONNECT_DELAY = 60           # Longer reconnection delay

# Security Configuration
CLIENT_ID = "custom-id-here"   # Custom client identifier
```

#### Environment Variables
Alternatively, use environment variables:

```bash
# Windows
set MEDUSA_HOST=192.168.1.100
set MEDUSA_PORT=4444
python client.py

# Linux/macOS
export MEDUSA_HOST=192.168.1.100
export MEDUSA_PORT=4444
python client.py
```

### Network Configuration

#### Firewall Rules
```bash
# Windows Firewall
netsh advfirewall firewall add rule name="MEDUSA C2" dir=in action=allow protocol=TCP localport=4444,5000

# Linux iptables
sudo iptables -A INPUT -p tcp --dport 4444 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT

# UFW (Ubuntu)
sudo ufw allow 4444/tcp
sudo ufw allow 5000/tcp
```

#### Router Configuration
For external access, configure port forwarding:
- **Port 4444**: TCP listener for client connections
- **Port 5000**: Web interface access

---

## 🛠️ Builder Tool

### Overview
The MEDUSA Builder generates custom payloads and executables for deployment.

### Web Interface Builder

#### Payload Types
1. **Python Executable**: Full-featured client with EXE compilation
2. **Netcat Reverse Shell**: Lightweight shell commands
3. **PowerShell Script**: Windows PowerShell-based payload

#### Payload Modes (Python Executable)

| Mode | Description | Use Case |
|------|-------------|----------|
| **Silent** | ✅ Completely hidden operation<br>✅ No console window<br>✅ Background execution | Red team exercises, stealth testing |
| **Stealth** | ✅ Enhanced hiding features<br>✅ Process priority management<br>✅ Advanced evasion | Advanced penetration testing |
| **Basic** | ✅ Standard executable<br>✅ Visible console (debugging)<br>✅ Simple deployment | Development, debugging |

#### Generation Process
1. **Access Builder**: Navigate to Builder tab in web interface
2. **Select Type**: Choose payload type (Python recommended)
3. **Configure Options**:
   ```
   Server IP: 192.168.1.100
   Server Port: 4444
   Payload Mode: Silent Stealth
   Output Name: client
   Persistence: [x] Enable
   ```
4. **Generate**: Click "Generate Payload" button
5. **Download**: Files saved to `nova/payloads/` directory

### Command Line Builder

#### Installation
```bash
# Install PyInstaller for EXE building
pip install pyinstaller

# Optional: Install UPX for compression
# Download from https://upx.github.io/
```

#### Usage Examples
```bash
# Generate Python client with EXE
python builder.py --type python --ip 192.168.1.100 --port 4444 --output myclient --build-exe --hide-console

# Generate with persistence
python builder.py --type python --ip 192.168.1.100 --port 4444 --output myclient --build-exe --hide-console --persistence

# Generate PowerShell payload
python builder.py --type powershell --ip 192.168.1.100 --port 4444 --output psrevshell

# Generate encoded PowerShell
python builder.py --type powershell --ip 192.168.1.100 --port 4444 --output psrevshell --encode

# Generate Netcat commands
python builder.py --type netcat --ip 192.168.1.100 --port 4444
```

#### Command Line Options
```bash
Required Arguments:
  --type {python,netcat,powershell,batch,vbs}  Payload type
  --ip IP_ADDRESS                              Server IP address
  --port PORT                                  Server port number

Optional Arguments:
  --output NAME                                Output filename (default: client)
  --build-exe                                  Build executable with PyInstaller
  --hide-console                               Hide console window
  --persistence                                Add persistence mechanisms
  --encode                                     Base64 encode payload (PowerShell)
  --icon ICON_FILE                            Icon file for executable
```

### Generated Files

#### File Structure
```
nova/payloads/
├── client.py              # Python source code
├── client.exe             # Compiled executable
├── psrevshell.ps1         # PowerShell script
├── dropper.bat            # Batch dropper
├── dropper.vbs            # VBS dropper
└── payload_info_*.json    # Generation metadata
```

#### Deployment Methods
1. **Direct Execution**: Copy and run executable
2. **Email Attachment**: Social engineering vector
3. **USB Drop**: Physical deployment
4. **Web Download**: Host on compromised website
5. **Script Execution**: PowerShell/batch scripts

### Builder Menu (Windows)
```batch
# Quick launcher for Windows
builder_menu.bat

# Interactive menu options:
# 1. Generate Python Client (with EXE)
# 2. Generate Netcat Commands
# 3. Generate PowerShell Script
# 4. Generate Batch Dropper
# 5. Generate VBS Dropper
# 6. Test Builder (all functions)
# 7. Help / Usage Guide
```

---

## 📁 File Structure

```
medusa-c2/
├── 🐍 server.py                    # Main C2 server
├── 🕹️ client.py                    # C2 client agent
├── 🔨 builder.py                   # Payload builder tool
├── 📝 builder_menu.bat              # Windows builder launcher
├── 🚀 start.bat                     # Windows startup script
├── 🚀 start.sh                      # Linux/macOS startup script
├── 📚 README.md                    # This documentation
├── 📋 BUILDER_GUIDE.md             # Detailed builder guide
├── 📄 requirements.txt              # Python dependencies
│
├── 🌐 webui/                       # Web interface assets
│   ├── dashboard.html               # Main dashboard
│   ├── css/
│   │   └── dashboard.css            # Dracula theme styles
│   └── js/
│       └── dashboard.js             # Dashboard functionality
│
├── 📁 payloads/                    # Generated payloads
│   ├── client.py                   # Generated Python client
│   ├── client.exe                  # Compiled executable
│   └── payload_info_*.json         # Generation metadata
│
├── 📎 downloads/                   # Downloaded files
│   └── <client_id>_<filename>       # Client downloads
│
├── 📷 screenshots/                 # Captured screenshots
│   └── <client_id>_<timestamp>.png  # Screenshot files
│
└── 📂 templates/                   # Template storage
    └── payload_templates/           # Payload templates
```

### Core Files

| File | Description | Purpose |
|------|-------------|---------|
| `server.py` | Main server application | TCP listener, web interface, client management |
| `client.py` | Client agent | Command execution, file operations, screenshots |
| `builder.py` | Payload generator | Create custom executables and scripts |
| `webui/dashboard.html` | Web interface | Modern dashboard with dark theme |
| `webui/js/dashboard.js` | Frontend logic | Real-time updates, file explorer, terminal |
| `webui/css/dashboard.css` | Styling | Dracula theme implementation |

### Generated Directories
These directories are created automatically:
- **`payloads/`**: Generated client executables and scripts
- **`downloads/`**: Files downloaded from client systems
- **`screenshots/`**: Screen captures from clients
- **`build/`**: PyInstaller build artifacts (temporary)

---

## 🔒 Security

### ⚠️ Educational Use Only

**MEDUSA C2 is designed exclusively for:**
- 🏫 **Educational purposes** and cybersecurity learning
- 🏆 **Authorized penetration testing** with proper permissions
- 🔍 **Security research** in controlled environments
- 🛡️ **Red team exercises** with organizational approval

### 🔐 Security Features

#### Communication Security
- **JSON Protocol**: Structured message format
- **Base64 Encoding**: File transfer encoding
- **Client Authentication**: Unique client identification
- **Error Resilience**: Graceful failure handling

#### Operational Security
- **Stealth Modes**: Hidden execution options
- **Anti-Detection**: No visible console windows
- **Smart Reconnection**: Exponential backoff
- **Process Management**: Background operation

### 🛡️ Defensive Considerations

#### Detection Methods
1. **Network Monitoring**: Monitor for unusual TCP connections
2. **Process Analysis**: Look for suspicious background processes
3. **File Monitoring**: Watch for unexpected file operations
4. **Registry Changes**: Monitor persistence mechanisms

#### Mitigation Strategies
1. **Endpoint Protection**: Deploy EDR/antivirus solutions
2. **Network Segmentation**: Isolate critical systems
3. **User Training**: Educate about social engineering
4. **Access Controls**: Implement least privilege principles

### 📝 Logging and Monitoring

#### Server Logs
```bash
# Log files location
logs/medusa_server.log     # Detailed server activity
logs/client_activity.log   # Client connection logs
logs/command_history.log   # Executed commands
```

#### Security Events Logged
- Client connections and disconnections
- Command executions and responses
- File upload/download operations
- Screenshot captures
- Listener start/stop events
- Error conditions and failures

---

## 🐛 Troubleshooting

### 🔴 Common Issues

#### Connection Problems

**Issue**: Client cannot connect to server
```bash
# Check server status
netstat -an | grep 4444

# Test connectivity
telnet <server_ip> 4444

# Check firewall
# Windows:
netsh advfirewall show currentprofile
# Linux:
sudo iptables -L
```

**Solutions**:
1. Verify server is running and listening on port 4444
2. Check firewall rules and exceptions
3. Confirm client configuration matches server IP/port
4. Test network connectivity between client and server

#### Web Interface Issues

**Issue**: Cannot access web dashboard
```bash
# Check if server is running
ps aux | grep server.py

# Check port binding
netstat -an | grep 5000

# Test local access
curl http://localhost:5000
```

**Solutions**:
1. Ensure server started successfully
2. Check if port 5000 is available
3. Try different port: `python server.py --port 8080`
4. Check browser console for JavaScript errors

#### Client Not Appearing

**Issue**: Client connects but doesn't appear in dashboard
```python
# Add debug logging to client.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Solutions**:
1. Check server logs for connection messages
2. Verify client handshake completion
3. Refresh web interface (F5)
4. Check WebSocket connection in browser console

#### File Operations Failing

**Issue**: Downloads/uploads not working
```bash
# Check file permissions
ls -la downloads/
ls -la screenshots/

# Create directories if missing
mkdir downloads screenshots
```

**Solutions**:
1. Ensure download/screenshot directories exist
2. Check file permissions and disk space
3. Verify file paths are correct
4. Check for antivirus interference

### 📊 Performance Issues

#### High Resource Usage
```bash
# Monitor server resources
top -p $(pgrep -f server.py)

# Check memory usage
ps -o pid,ppid,cmd,%mem,%cpu -p $(pgrep -f server.py)
```

**Optimization**:
1. Limit concurrent clients
2. Adjust heartbeat intervals
3. Clean old logs and files
4. Use CLI mode for better performance

#### Slow Response Times
```python
# Adjust client configuration
CHECKIN_INTERVAL = 60      # Reduce frequency
JITTER = 0.1               # Less randomization
```

### 📝 Debug Mode

#### Enable Debug Logging
```bash
# Server debug mode
python server.py --debug

# Client debug mode
# Edit client.py and add:
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### Browser Console
```javascript
// Open browser console (F12) for frontend debugging
console.log('WebSocket status:', socket.connected);
console.log('Selected client:', selectedClientId);
console.log('Current path:', currentPath);
```

### 🌐 Network Troubleshooting

#### Connectivity Tests
```bash
# Test TCP connectivity
nc -zv <server_ip> 4444

# Test HTTP connectivity  
curl -I http://<server_ip>:5000

# Check routing
traceroute <server_ip>
```

#### Firewall Configuration
```bash
# Windows Firewall
netsh advfirewall firewall show rule name="MEDUSA C2"

# Linux iptables
sudo iptables -L -n | grep -E "4444|5000"

# Check SELinux (if applicable)
sestatus
```

---

---

## 📚 Additional Resources

### 📖 Documentation
- **[Builder Guide](BUILDER_GUIDE.md)**: Comprehensive payload generation guide
- **[API Documentation](docs/API.md)**: REST API and WebSocket reference
- **[Developer Guide](docs/DEVELOPER.md)**: Extending MEDUSA functionality
- **[Security Best Practices](docs/SECURITY.md)**: Operational security guidelines

### 🎓 Educational Materials
- **[Tutorial Videos](https://youtube.com/medusa-c2)**: Step-by-step guides
- **[Use Cases](docs/USE_CASES.md)**: Real-world penetration testing scenarios
- **[CTF Challenges](docs/CTF.md)**: Practice environments and challenges
- **[Red Team Playbook](docs/REDTEAM.md)**: Advanced techniques and methodologies

### 🔗 External Resources
- **[MITRE ATT&CK Framework](https://attack.mitre.org/)**: Adversary tactics and techniques
- **[OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)**: Web application security testing
- **[NIST Cybersecurity Framework](https://www.nist.gov/cybersecurity)**: Security framework guidelines

---

## 🤝 Contributing

We welcome contributions from the cybersecurity community! 🎉

### 🌟 How to Contribute

1. **🍴 Fork the Repository**
   ```bash
   git clone https://github.com/your-username/medusa-c2.git
   cd medusa-c2
   ```

2. **🌿 Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **💻 Make Your Changes**
   - Add new features or fix bugs
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation

4. **✅ Test Your Changes**
   ```bash
   python -m pytest tests/
   python server.py --test
   ```

5. **📝 Commit and Push**
   ```bash
   git commit -m "Add amazing feature"
   git push origin feature/amazing-feature
   ```

6. **🔀 Create Pull Request**
   - Describe your changes in detail
   - Reference any related issues
   - Ensure all tests pass

### 🎯 Contribution Areas

| Area | Description | Difficulty |
|------|-------------|------------|
| **🐛 Bug Fixes** | Fix existing issues and bugs | ⭐ Beginner |
| **✨ New Features** | Add new C2 capabilities | ⭐⭐ Intermediate |
| **🎨 UI/UX** | Improve web interface design | ⭐⭐ Intermediate |
| **🔒 Security** | Enhance security features | ⭐⭐⭐ Advanced |
| **📚 Documentation** | Improve guides and tutorials | ⭐ Beginner |
| **🧪 Testing** | Add unit and integration tests | ⭐⭐ Intermediate |
| **🚀 Performance** | Optimize server and client | ⭐⭐⭐ Advanced |

### 📋 Development Guidelines

- **Code Style**: Follow PEP 8 for Python code
- **Documentation**: Update README and inline comments
- **Testing**: Add tests for new features
- **Security**: Consider security implications
- **Compatibility**: Maintain cross-platform support

---

## 📞 Support

### 🆘 Getting Help

- **📖 Documentation**: Check this README and docs folder
- **🐛 Issues**: [GitHub Issues](https://github.com/medusa-c2/medusa/issues) for bug reports
- **💡 Discussions**: [GitHub Discussions](https://github.com/medusa-c2/medusa/discussions) for questions
- **💬 Discord**: [Join our Discord server](https://discord.gg/medusa-c2) for real-time chat

### 🐛 Reporting Bugs

When reporting bugs, please include:

```markdown
**Environment**
- OS: Windows 11 / Ubuntu 20.04 / macOS 12
- Python Version: 3.9.7
- MEDUSA Version: 2.1.0

**Bug Description**
Clear description of the issue...

**Steps to Reproduce**
1. Start server with `python server.py`
2. Connect client...
3. Error occurs when...

**Expected Behavior**
What you expected to happen...

**Actual Behavior** 
What actually happened...

**Logs/Screenshots**
(Attach relevant logs or screenshots)
```

### 💡 Feature Requests

Suggest new features by:
1. Checking existing [feature requests](https://github.com/medusa-c2/medusa/labels/enhancement)
2. Creating a new issue with the "enhancement" label
3. Describing the use case and benefits
4. Proposing implementation approach (optional)

---

## ⚖️ Legal & Ethics

### 🔒 Responsible Use Policy

**MEDUSA C2 Framework** is designed exclusively for:

✅ **Authorized Activities**
- Educational cybersecurity learning
- Authorized penetration testing with written permission
- Security research in controlled environments
- Red team exercises with organizational approval
- CTF competitions and security training

❌ **Prohibited Activities**
- Unauthorized access to computer systems
- Malicious attacks on third-party systems
- Data theft or privacy violations
- Any illegal or unethical activities

### ⚖️ Legal Compliance

**Users must ensure compliance with:**
- Local, state, and federal laws
- Organizational policies and procedures
- Industry regulations and standards
- International cybersecurity laws

**Before using MEDUSA:**
1. 📋 Obtain proper written authorization
2. 🎯 Define clear scope and objectives
3. 🛡️ Implement appropriate safeguards
4. 📝 Document all activities thoroughly
5. 🗑️ Securely dispose of sensitive data

### 📜 License

```
MEDUSA C2 Framework License

Copyright (c) 2024 unknown_hart

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to use,
copy, modify, and distribute the Software, subject to the following conditions:

RESTRICTIONS:
1. The Software may NOT be sold, licensed for commercial use, or used for
   monetary gain without explicit written permission from the original author.

2. Any distribution, modification, or derivative work MUST include proper
   attribution to the original author (unknown_hart) and this license notice.

3. You may NOT claim ownership, authorship, or copyright of the original
   Software or present it as your own work.

4. Any public distribution or sharing MUST clearly credit "unknown_hart" as
   the original creator and link to the original repository.

PERMISSIONS:
✅ Use for educational and research purposes
✅ Modify and adapt for personal/educational use
✅ Distribute with proper attribution
✅ Create derivative works with attribution

PROHIBITED:
❌ Commercial sale or licensing
❌ Claiming ownership or authorship
❌ Removing attribution or license notices
❌ Redistribution without proper credit

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

CREDIT REQUIREMENT:
When using, modifying, or distributing this software, you must include:
"MEDUSA C2 Framework - Created by unknown_hart"
```

### ⚠️ Disclaimer

**IMPORTANT**: This software is provided for educational purposes only. The author (unknown_hart):

- 🚫 **Does not condone** illegal or unethical use of this software
- 🛡️ **Is not responsible** for any misuse or damages caused
- 📚 **Encourages responsible** disclosure and ethical hacking practices
- 🎓 **Supports educational** advancement in cybersecurity

**Users assume full responsibility** for ensuring their use complies with all applicable laws and regulations.

**ATTRIBUTION REQUIRED**: Any use, modification, or distribution must credit "unknown_hart" as the original creator.

---

## 🙏 Acknowledgments

### 👨‍💻 Original Creator
**Created by: unknown_hart**  
*MEDUSA C2 Framework - Professional Command & Control for Educational Excellence*

### 🤝 Contributors

Special thanks to all contributors who have helped make MEDUSA better:

- **🎨 UI/UX Design**: Dark theme and responsive interface
- **🔧 Core Development**: Server architecture and client functionality 
- **🛠️ Tools**: Payload builder and automation scripts
- **📚 Documentation**: Comprehensive guides and tutorials
- **🧪 Testing**: Quality assurance and bug reporting
- **🌍 Community**: Feedback, suggestions, and support

### 🏆 Special Recognition

- **Cybersecurity Community**: For valuable feedback and suggestions
- **Educational Institutions**: For promoting responsible security education
- **Open Source Projects**: Flask, Socket.IO, and other dependencies
- **Security Researchers**: For inspiring defensive and offensive techniques

### 🌟 Hall of Fame

*Recognizing significant contributions to the project:*

| Contributor | Contribution | Impact |
|-------------|--------------|--------|
| **unknown_hart** | Original creator and lead developer | 🚀 Creator |
| **Community** | Bug reports and feature requests | 🐛 High |
| **Educators** | Educational use cases and feedback | 🎓 High |
| **Developers** | Code contributions and improvements | 💻 High |
| **Testers** | Quality assurance and validation | 🧪 Medium |

---

### 🚀 Project Stats

<div align="center">

![GitHub repo size](https://img.shields.io/github/repo-size/medusa-c2/medusa)
![GitHub code size](https://img.shields.io/github/languages/code-size/medusa-c2/medusa)
![Lines of code](https://img.shields.io/tokei/lines/github/medusa-c2/medusa)
![GitHub last commit](https://img.shields.io/github/last-commit/medusa-c2/medusa)

**⭐ If you find MEDUSA useful, please give it a star!**

---

**🐍 MEDUSA C2 Framework** - *Professional C2 for Educational Excellence*

**👨‍💻 Original Creator**: [**unknown_hart**](https://github.com/unknown_hart)

*"Empowering the next generation of cybersecurity professionals"*

---

### 📝 Attribution Requirements

**When using this software, you MUST include:**

```
MEDUSA C2 Framework - Created by unknown_hart
Original Repository: [Your Repository URL]
License: Custom - Use/Modify with Attribution, No Commercial Sale
```

**⚠️ Important**: 
- ✅ **Allowed**: Use, modify, distribute with proper attribution
- ❌ **Prohibited**: Commercial sale, claiming ownership, removing credits
- 📝 **Required**: Credit "unknown_hart" in all distributions

</div>