
import { dbService } from './dbService';
import { offlineScanService } from './offlineScanService';
import { Shop, Meter, MeterReading, Invoice } from '../types';

export interface IDataService {
    getAllData(): Promise<{
        shops: Shop[];
        meters: Meter[];
        readings: MeterReading[];
        invoices: Invoice[];
    }>;
    saveShopWithMeter(shop: Shop, meter: Meter): Promise<boolean>;
    deleteShop(shopId: string): Promise<boolean>;
    analyzeImage(base64Image: string, knownSerials: string[]): Promise<any>;
}

class HybridDataService implements IDataService {
    private offlineMode = false;

    setOfflineMode(mode: boolean) {
        this.offlineMode = mode;
    }

    private isElectron(): boolean {
        return typeof window !== 'undefined' && !!(window as any).electronAPI;
    }

    async getAllData() {
        if (this.isElectron()) {
            return await (window as any).electronAPI.getAllData();
        } else {
            return {
                shops: await dbService.getAll<Shop>('shops'),
                meters: await dbService.getAll<Meter>('meters'),
                readings: await dbService.getAll<MeterReading>('readings'),
                invoices: await dbService.getAll<Invoice>('invoices'),
            };
        }
    }

    async saveShopWithMeter(shop: Shop, meter: Meter): Promise<boolean> {
        if (this.isElectron()) {
            return await (window as any).electronAPI.saveShopWithMeter(shop, meter);
        } else {
            await dbService.put('shops', shop);
            await dbService.put('meters', meter);
            return true;
        }
    }

    async deleteShop(shopId: string): Promise<boolean> {
        if (this.isElectron()) {
            return await (window as any).electronAPI.deleteShop(shopId);
        } else {
            const shops = await dbService.getAll<Shop>('shops');
            const shop = shops.find(s => s.id === shopId);
            if (shop?.meterId) {
                await dbService.delete('meters', shop.meterId);
            }
            await dbService.delete('shops', shopId);
            return true;
        }
    }

    async analyzeImage(base64Image: string, knownSerials: string[]): Promise<any> {
        // If explicitly offline or no internet, use local OCR
        if (this.offlineMode || !navigator.onLine) {
            console.log("Using Offline OCR Engine...");
            return await offlineScanService.scan(base64Image, knownSerials);
        }

        if (this.isElectron()) {
            try {
                return await (window as any).electronAPI.analyzeImage(base64Image, knownSerials);
            } catch (err) {
                console.warn("Electron AI failed, falling back to offline OCR:", err);
                return await offlineScanService.scan(base64Image, knownSerials);
            }
        } else {
            try {
                const response = await fetch('http://localhost:5000/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64Image, knownSerialNumbers: knownSerials })
                });
                if (!response.ok) throw new Error('AI Server Error');
                return await response.json();
            } catch (err) {
                console.warn("Web AI Server failed, falling back to offline OCR:", err);
                return await offlineScanService.scan(base64Image, knownSerials);
            }
        }
    }
}

export const hybridService = new HybridDataService();
