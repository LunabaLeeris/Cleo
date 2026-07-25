import { BrowserWindow } from 'electron';
import { WebSocketServer, WebSocket } from 'ws';

const startWebSocketServer = (mainWindow: BrowserWindow) => {
    // [TODO] Change port to an ENV variable
    const wss = new WebSocketServer({ port: 8080 });

    // [TODO] Forward Logs to avatar 
    console.log('WebSocket Server running on ws://localhost:8080');

    wss.on('connection', (ws: WebSocket) => {
        console.log('Chrome Extension connected.');

        ws.on('message', (message: string) => {
            try {
                const data = JSON.parse(message);
                console.log('Received from browser:', data);

                // Forward the tab data directly to the Frontend Avatar
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('browser-activity', data);
                }

                // [TODO] somewhere right here we call a model back to the backend
                // [TODO] somewhere right here we send a signal back to the extension to 
                // perform actions in the front end (not on the avatar)
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
            }
        });

        ws.on('close', () => console.log('Chrome Extension disconnected.'));
    });
};

export { startWebSocketServer }