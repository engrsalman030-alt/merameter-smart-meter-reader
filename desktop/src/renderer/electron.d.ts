export interface ElectronAPI {
    // Shops
    getShops: () => Promise<any[]>;
    saveShop: (shop: any) => Promise<any>;
    deleteShop: (id: string) => Promise<any>;
    saveShopWithMeter: (shop: any, meter: any) => Promise<boolean>;

    // Meters
    getMeters: () => Promise<any[]>;
    saveMeter: (meter: any) => Promise<any>;

    // Data Aggregation
    getAllData: () => Promise<{
        shops: any[];
        meters: any[];
        readings: any[];
        invoices: any[];
    }>;

    // Readings & Invoices
    getReadings: () => Promise<any[]>;
    getLatestReading: (shopId: string) => Promise<any>;
    addReadingAndInvoice: (data: any) => Promise<any>;
    getInvoices: () => Promise<any[]>;
    updateInvoicePaidStatus: (id: string, paidStatus: boolean) => Promise<any>;

    // AI Scan
    scanImage: (data: any) => Promise<any>;

    // System
    backupDB: () => Promise<boolean>;
    restoreDB: () => Promise<boolean>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
