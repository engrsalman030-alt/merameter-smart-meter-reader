// File: services/dbService.ts

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { Shop, Meter, MeterReading, Invoice } from '../types';

const DB_NAME = 'merameter_db.sqlite3';

class DBService {
  private db: any = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();
  }

  private async init() {
    try {
      const sqlite3 = await sqlite3InitModule({
        print: console.log,
        error: console.error,
        locateFile: (file: string) => file.endsWith('.wasm') ? `/sqlite-wasm/${file}` : file,
      });

      if ('opfs' in sqlite3) {
        this.db = new sqlite3.oo1.OpfsDb(`/${DB_NAME}`);
        console.log('✅ SQLite VFS: Using OPFS (High Capacity Storage)');
      } else {
        this.db = new sqlite3.oo1.JsStorageDb('local');
        console.log('⚠️ SQLite VFS: Using LocalStorage (Quota Restricted)');
      }

      // Optimize Journal Mode to avoid QuotaExceededError in localStorage
      this.db.exec(`PRAGMA journal_mode = MEMORY;`);

      // Initialize schema
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS shops (
          id TEXT PRIMARY KEY,
          name TEXT,
          ownerName TEXT,
          cnic TEXT,
          phone TEXT,
          address TEXT,
          meterId TEXT,
          shopNumber TEXT,
          customerImage TEXT,
          registrationDate TEXT
        );

        CREATE TABLE IF NOT EXISTS meters (
          id TEXT PRIMARY KEY,
          serialNumber TEXT,
          shopId TEXT,
          installDate TEXT,
          lastReading REAL,
          meterImage TEXT,
          initialReadingBefore REAL,
          initialReadingAfter REAL
        );

        CREATE TABLE IF NOT EXISTS readings (
          id TEXT PRIMARY KEY,
          meterId TEXT,
          shopId TEXT,
          readingValue REAL,
          previousReadingValue REAL,
          photoUrl TEXT,
          readingDate TEXT,
          timestamp TEXT,
          status TEXT,
          syncStatus TEXT,
          readerName TEXT,
          ocrConfidence REAL,
          confidence REAL,
          manualOverride INTEGER,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          readingId TEXT,
          shopId TEXT,
          billingPeriod TEXT,
          units REAL,
          ratePerUnit REAL,
          totalAmount REAL,
          issuedDate TEXT,
          status TEXT,
          paidStatus INTEGER
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS security_questions (
          id TEXT PRIMARY KEY,
          question TEXT,
          answer TEXT
        );
      `);
    } catch (err) {
      console.error('Failed to initialize SQLite:', err);
    }
  }

  private async ensureInit() {
    await this.initPromise;
    if (!this.db) throw new Error('Database not initialized');
  }

  async getAll<T>(tableName: string): Promise<T[]> {
    await this.ensureInit();
    const result: T[] = [];
    this.db.exec({
      sql: `SELECT * FROM ${tableName}`,
      rowMode: 'object',
      callback: (row: any) => {
        // Post-process rows to handle SQLite types (e.g., booleans)
        if (tableName === 'invoices') {
          row.paidStatus = !!row.paidStatus;
        }
        if (tableName === 'readings') {
          row.manualOverride = !!row.manualOverride;
        }
        result.push(row);
      },
    });
    return result;
  }

  async put(tableName: string, data: any) {
    await this.ensureInit();

    // Convert objects to SQL-friendly values
    const preparedData = { ...data };
    if (tableName === 'invoices' && typeof preparedData.paidStatus === 'boolean') {
      preparedData.paidStatus = preparedData.paidStatus ? 1 : 0;
    }
    if (tableName === 'readings' && typeof preparedData.manualOverride === 'boolean') {
      preparedData.manualOverride = preparedData.manualOverride ? 1 : 0;
    }

    const keys = Object.keys(preparedData);
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(preparedData);

    const sql = `INSERT OR REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

    this.db.exec({
      sql,
      bind: values,
    });
  }

  async delete(tableName: string, id: string) {
    await this.ensureInit();
    this.db.exec({
      sql: `DELETE FROM ${tableName} WHERE id = ?`,
      bind: [id],
    });
  }

  async restoreData(data: {
    shops: string;
    meters: string;
    readings: string;
    invoices: string;
    settings?: string;
    security_questions?: string
  }) {
    await this.ensureInit();

    try {
      this.db.exec('BEGIN TRANSACTION');

      this.db.exec('DELETE FROM shops');
      this.db.exec('DELETE FROM meters');
      this.db.exec('DELETE FROM readings');
      this.db.exec('DELETE FROM invoices');
      this.db.exec('DELETE FROM settings');
      this.db.exec('DELETE FROM security_questions');

      const shops = JSON.parse(data.shops || '[]');
      const meters = JSON.parse(data.meters || '[]');
      const readings = JSON.parse(data.readings || '[]');
      const invoices = JSON.parse(data.invoices || '[]');
      const settings = JSON.parse(data.settings || '[]');
      const securityQuestions = JSON.parse(data.security_questions || '[]');

      for (const s of shops) await this.put('shops', s);
      for (const m of meters) await this.put('meters', m);
      for (const r of readings) await this.put('readings', r);
      for (const i of invoices) await this.put('invoices', i);
      for (const st of settings) await this.put('settings', st);
      for (const sq of securityQuestions) await this.put('security_questions', sq);

      this.db.exec('COMMIT');

      window.location.reload();
    } catch (err) {
      if (this.db) this.db.exec('ROLLBACK');
      console.error('Failed to restore data:', err);
      throw err;
    }
  }

  async wipeData() {
    await this.ensureInit();
    try {
      this.db.exec('BEGIN TRANSACTION');
      this.db.exec('DELETE FROM shops');
      this.db.exec('DELETE FROM meters');
      this.db.exec('DELETE FROM readings');
      this.db.exec('DELETE FROM invoices');
      this.db.exec('DELETE FROM settings');
      this.db.exec('DELETE FROM security_questions');
      this.db.exec('COMMIT');

      window.location.href = '/';
    } catch (err) {
      if (this.db) this.db.exec('ROLLBACK');
      console.error('Failed to wipe data:', err);
      throw err;
    }
  }
}

// ✅ Export instance only once, at the bottom
export const dbService = new DBService();