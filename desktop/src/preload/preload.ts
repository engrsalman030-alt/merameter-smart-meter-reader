import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // Shops
    getShops: () => ipcRenderer.invoke('get-shops'),
    saveShop: (shop: any) => ipcRenderer.invoke('save-shop', shop),
    deleteShop: (id: string) => ipcRenderer.invoke('delete-shop', id),
    saveShopWithMeter: (shop: any, meter: any) => ipcRenderer.invoke('save-shop-with-meter', shop, meter),

    // Meters
    getMeters: () => ipcRenderer.invoke('get-meters'),
    saveMeter: (meter: any) => ipcRenderer.invoke('save-meter', meter),

    // Data Aggregation
    getAllData: () => ipcRenderer.invoke('get-all-data'),

    // Readings & Invoices
    getReadings: () => ipcRenderer.invoke('get-readings'),
    getLatestReading: (shopId: string) => ipcRenderer.invoke('get-latest-reading', shopId),
    addReadingAndInvoice: (data: any) => ipcRenderer.invoke('add-reading-and-invoice', data),
    getInvoices: () => ipcRenderer.invoke('get-invoices'),
    updateInvoicePaidStatus: (id: string, paidStatus: boolean) =>
        ipcRenderer.invoke('update-invoice-status', { id, paidStatus }),

    // AI Scan
    scanImage: (data: any) => ipcRenderer.invoke('scan-image', data),

    // System
    backupDB: () => ipcRenderer.invoke('backup-db'),
    restoreDB: () => ipcRenderer.invoke('restore-db'),
});
