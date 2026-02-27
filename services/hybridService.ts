import { dbService } from './dbService';
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
        }

        return {
            shops: await dbService.getAll<Shop>('shops'),
            meters: await dbService.getAll<Meter>('meters'),
            readings: await dbService.getAll<MeterReading>('readings'),
            invoices: await dbService.getAll<Invoice>('invoices'),
        };
    }

    async saveShopWithMeter(shop: Shop, meter: Meter): Promise<boolean> {
        if (this.isElectron()) {
            return await (window as any).electronAPI.saveShopWithMeter(shop, meter);
        }

        await dbService.put('shops', shop);
        await dbService.put('meters', meter);
        return true;
    }

    async deleteShop(shopId: string): Promise<boolean> {
        if (this.isElectron()) {
            return await (window as any).electronAPI.deleteShop(shopId);
        }

        const shops = await dbService.getAll<Shop>('shops');
        const shop = shops.find(s => s.id === shopId);

        if (shop?.meterId) {
            await dbService.delete('meters', shop.meterId);
        }

        await dbService.delete('shops', shopId);
        return true;
    }

    async saveMeterReading(reading: MeterReading): Promise<boolean> {
        if (this.isElectron()) {
            return await (window as any).electronAPI.saveMeterReading(reading);
        }

        await dbService.put('readings', reading);
        return true;
    }

    async saveInvoice(invoice: Invoice): Promise<boolean> {
        if (this.isElectron()) {
            return await (window as any).electronAPI.saveInvoice(invoice);
        }

        await dbService.put('invoices', invoice);
        return true;
    }

    async updateMeterLastReading(meterId: string, lastReading: number): Promise<boolean> {
        if (this.isElectron()) {
            return await (window as any).electronAPI.updateMeterLastReading(meterId, lastReading);
        }

        const meters = await dbService.getAll<Meter>('meters');
        const meter = meters.find(m => m.id === meterId);
        
        if (meter) {
            meter.lastReading = lastReading;
            await dbService.put('meters', meter);
        }
        return true;
    }

    async analyzeImage(base64Image: string, knownSerials: string[]): Promise<any> {
        if (!navigator.onLine) {
            throw new Error("Internet connection is required to scan meters.");
        }

        const response = await fetch('http://localhost:5000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                base64Image,
                knownSerialNumbers: knownSerials
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || "AI analysis failed");
        }

        return data;
    }
}

export const hybridService = new HybridDataService();