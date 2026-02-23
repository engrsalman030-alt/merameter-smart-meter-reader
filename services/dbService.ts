
import { openDB, IDBPDatabase } from 'idb';
import { Shop, Meter, MeterReading, Invoice } from '../types';

const DB_NAME = 'merameter_db';
const DB_VERSION = 2; // Incremented version for schema change

class DBService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('shops')) db.createObjectStore('shops', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meters')) db.createObjectStore('meters', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('readings')) db.createObjectStore('readings', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('invoices')) db.createObjectStore('invoices', { keyPath: 'id' });
      },
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.dbPromise;
    return db.getAll(storeName);
  }

  async put(storeName: string, data: any) {
    const db = await this.dbPromise;
    return db.put(storeName, data);
  }

  async delete(storeName: string, id: string) {
    const db = await this.dbPromise;
    return db.delete(storeName, id);
  }


  async restoreData(data: { shops: string; meters: string; readings: string; invoices: string }) {
    const db = await this.dbPromise;
    const tx = db.transaction(['shops', 'meters', 'readings', 'invoices'], 'readwrite');

    // Parse data (they come as JSON strings from localStorage in the export)
    const shops = JSON.parse(data.shops || '[]');
    const meters = JSON.parse(data.meters || '[]');
    const readings = JSON.parse(data.readings || '[]');
    const invoices = JSON.parse(data.invoices || '[]');

    // Clear and restore
    await tx.objectStore('shops').clear();
    await tx.objectStore('meters').clear();
    await tx.objectStore('readings').clear();
    await tx.objectStore('invoices').clear();

    for (const s of shops) await tx.objectStore('shops').put(s);
    for (const m of meters) await tx.objectStore('meters').put(m);
    for (const r of readings) await tx.objectStore('readings').put(r);
    for (const i of invoices) await tx.objectStore('invoices').put(i);

    // Also update localStorage keys to match current app expects
    localStorage.setItem('shops', data.shops);
    localStorage.setItem('meters', data.meters);
    localStorage.setItem('readings', data.readings);
    localStorage.setItem('invoices', data.invoices);

    await tx.done;
    window.location.reload();
  }
}

export const dbService = new DBService();
