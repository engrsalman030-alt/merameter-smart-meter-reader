import { app, BrowserWindow, ipcMain } from 'electron';
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import { initDatabase } from './database';
import { setupIpcHandlers } from './ipcHandlers';

function createWindow() {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path.join(__dirname, '../../public/vite.svg'),
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
}

app.whenReady().then(() => {
    initDatabase();
    setupIpcHandlers();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
