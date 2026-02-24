import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'merameter.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

export const initDatabase = () => {
  try {
    db.transaction(() => {
      db.prepare(`
              CREATE TABLE IF NOT EXISTS shops (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                ownerName TEXT,
                cnic TEXT,
                phone TEXT,
                address TEXT,
                shopNumber TEXT,
                customerImage TEXT,
                registrationDate TEXT DEFAULT CURRENT_TIMESTAMP,
                meterId TEXT
              )
            `).run();

      db.prepare(`
              CREATE TABLE IF NOT EXISTS meters (
                id TEXT PRIMARY KEY,
                serialNumber TEXT UNIQUE NOT NULL,
                shopId TEXT,
                installDate TEXT,
                lastReading REAL,
                meterImage TEXT,
                initialReadingBefore REAL,
                initialReadingAfter REAL,
                FOREIGN KEY (shopId) REFERENCES shops(id) ON DELETE CASCADE
              )
            `).run();

      db.prepare(`
              CREATE TABLE IF NOT EXISTS readings (
                id TEXT PRIMARY KEY,
                meterId TEXT NOT NULL,
                shopId TEXT,
                readingValue REAL NOT NULL,
                previousReadingValue REAL,
                photoUrl TEXT,
                readingDate TEXT DEFAULT CURRENT_TIMESTAMP,
                confidence REAL,
                manualOverride INTEGER DEFAULT 0,
                notes TEXT,
                FOREIGN KEY (meterId) REFERENCES meters(id) ON DELETE CASCADE,
                FOREIGN KEY (shopId) REFERENCES shops(id) ON DELETE SET NULL
              )
            `).run();

      db.prepare(`
              CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                readingId TEXT UNIQUE,
                shopId TEXT NOT NULL,
                units REAL NOT NULL,
                ratePerUnit REAL NOT NULL,
                totalAmount REAL NOT NULL,
                issuedDate TEXT DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                paidStatus INTEGER DEFAULT 0,
                FOREIGN KEY (readingId) REFERENCES readings(id) ON DELETE SET NULL,
                FOREIGN KEY (shopId) REFERENCES shops(id) ON DELETE CASCADE
              )
            `).run();

      // Indexes for performance
      db.prepare('CREATE INDEX IF NOT EXISTS idx_meters_shopId ON meters(shopId)').run();
      db.prepare('CREATE INDEX IF NOT EXISTS idx_readings_meterId ON readings(meterId)').run();
      db.prepare('CREATE INDEX IF NOT EXISTS idx_invoices_shopId ON invoices(shopId)').run();

      // Migration: Ensure meterId exists in shops
      try {
        db.prepare('ALTER TABLE shops ADD COLUMN meterId TEXT').run();
      } catch (e) {
        // Column likely already exists
      }
    })();
    console.log('Database initialized successfully at:', dbPath);
  } catch (error) {
    console.error('Database Initialization Error:', error);
    throw error;
  }
};

export default db;
