let socket = null;

function connectWebSocket() {
    // [TODO] Change port to be an ENV variable 
    socket = new WebSocket('ws://localhost:8080');
    // [TODO] Change to better logging
    socket.onopen = () => console.log('Connected to Electron Avatar Backend');

    socket.onclose = () => {
        console.log('Disconnected. Retrying in 5 seconds...');
        setTimeout(connectWebSocket, 5000); // Auto-reconnect loop
    };

    socket.onerror = (err) => console.error('WebSocket Error:', err);
}

// Initialize connection
connectWebSocket();

// [INFO] Adjust monitoring here
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only capture when the page completes loading its URL fully
    if (changeInfo.status === 'complete' && tab.active && tab.url) {
        sendToElectron(tab.url, tab.title || '');
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab && tab.url) {
            sendToElectron(tab.url, tab.title || '');
        }
    });
});

// [INFO] Adjust data format eventually
function sendToElectron(url, title) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ url, title }));
    }
}