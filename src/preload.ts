import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // [TODO] Change data format eventually
    onBrowserActivity: (callback: (data: { url: string; title: string }) => void) => {
        ipcRenderer.on('browser-activity', (_event, data) => callback(data));
    },
    setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => {
        ipcRenderer.send('set-ignore-mouse-events', ignore, options);
    },
    dragWindow: (dx: number, dy: number) => {
        ipcRenderer.send('drag-window', dx, dy);
    },
    setDragging: (dragging: boolean) => {
        ipcRenderer.send('set-dragging', dragging);
    }
});
