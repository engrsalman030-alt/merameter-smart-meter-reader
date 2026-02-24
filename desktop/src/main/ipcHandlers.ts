import { ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import db from './database';
import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Shop, Meter, MeterReading, Invoice } from '../common/types';

// genAI is initialized lazily or after dotenv is guaranteed by main.ts
let genAI: GoogleGenerativeAI | null = null;
const getGenAI = () => {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY || '';
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

export const setupIpcHandlers = () => {
    // Shops CRUD
    ipcMain.handle('get-shops', () => {
        return db.prepare('SELECT * FROM shops').all();
    });

    ipcMain.handle('save-shop', (_: IpcMainInvokeEvent, shop: Shop) => {
        const stmt = db.prepare(`
      INSERT OR REPLACE INTO shops (id, name, ownerName, cnic, phone, address, shopNumber, customerImage, registrationDate, meterId)
      VALUES (@id, @name, @ownerName, @cnic, @phone, @address, @shopNumber, @customerImage, @registrationDate, @meterId)
    `);
        return stmt.run(shop);
    });

    ipcMain.handle('delete-shop', (_: IpcMainInvokeEvent, id: string) => {
        const transaction = db.transaction(() => {
            const shop = db.prepare('SELECT meterId FROM shops WHERE id = ?').get(id) as { meterId: string } | undefined;
            if (shop) {
                db.prepare('DELETE FROM meters WHERE id = ?').run(shop.meterId);
            }
            db.prepare('DELETE FROM readings WHERE shopId = ?').run(id);
            db.prepare('DELETE FROM invoices WHERE shopId = ?').run(id);
            db.prepare('DELETE FROM shops WHERE id = ?').run(id);
        });
        return transaction();
    });

    ipcMain.handle('save-shop-with-meter', (_: IpcMainInvokeEvent, shop: Shop, meter: Meter) => {
        try {
            const transaction = db.transaction(() => {
                db.prepare(`
                  INSERT OR REPLACE INTO shops (id, name, ownerName, cnic, phone, address, shopNumber, customerImage, registrationDate, meterId)
                  VALUES (@id, @name, @ownerName, @cnic, @phone, @address, @shopNumber, @customerImage, @registrationDate, @meterId)
                `).run(shop);

                db.prepare(`
                  INSERT OR REPLACE INTO meters (id, serialNumber, shopId, installDate, lastReading, meterImage, initialReadingBefore, initialReadingAfter)
                  VALUES (@id, @serialNumber, @shopId, @installDate, @lastReading, @meterImage, @initialReadingBefore, @initialReadingAfter)
                `).run(meter);
            });
            transaction();
            console.log('--- IPC save-shop-with-meter SUCCESS ---');
            return true;
        } catch (error) {
            console.error('IPC save-shop-with-meter Error:', error);
            throw error;
        }
    });

    // Meters CRUD
    ipcMain.handle('get-meters', () => {
        return db.prepare('SELECT * FROM meters').all();
    });

    ipcMain.handle('save-meter', (_: IpcMainInvokeEvent, meter: Meter) => {
        const stmt = db.prepare(`
      INSERT OR REPLACE INTO meters (id, serialNumber, shopId, installDate, lastReading, meterImage, initialReadingBefore, initialReadingAfter)
      VALUES (@id, @serialNumber, @shopId, @installDate, @lastReading, @meterImage, @initialReadingBefore, @initialReadingAfter)
    `);
        return stmt.run(meter);
    });

    // Readings & Invoices
    ipcMain.handle('get-readings', () => {
        return db.prepare('SELECT * FROM readings').all();
    });

    ipcMain.handle('get-latest-reading', (_: IpcMainInvokeEvent, shopId: string) => {
        return db.prepare('SELECT * FROM readings WHERE shopId = ? ORDER BY readingDate DESC LIMIT 1').get(shopId);
    });

    ipcMain.handle('add-reading-and-invoice', (_: IpcMainInvokeEvent, { reading, invoice, meterUpdate }: { reading: MeterReading, invoice: Invoice, meterUpdate: { lastReading: number, id: string } }) => {
        const transaction = db.transaction(() => {
            db.prepare(`
        INSERT INTO readings (id, meterId, shopId, readingValue, previousReadingValue, photoUrl, readingDate, confidence, manualOverride, notes)
        VALUES (@id, @meterId, @shopId, @readingValue, @previousReadingValue, @photoUrl, @readingDate, @confidence, @manualOverride, @notes)
      `).run(reading);

            db.prepare(`
        INSERT INTO invoices (id, readingId, shopId, units, ratePerUnit, totalAmount, issuedDate, status, paidStatus)
        VALUES (@id, @readingId, @shopId, @units, @ratePerUnit, @totalAmount, @issuedDate, @status, @paidStatus)
      `).run(invoice);

            db.prepare(`
        UPDATE meters SET lastReading = @lastReading WHERE id = @id
      `).run(meterUpdate);

            return { reading, invoice };
        });
        return transaction();
    });

    ipcMain.handle('get-invoices', () => {
        return db.prepare('SELECT * FROM invoices').all();
    });

    ipcMain.handle('update-invoice-status', (_: IpcMainInvokeEvent, { id, paidStatus }: { id: string, paidStatus: boolean }) => {
        return db.prepare('UPDATE invoices SET paidStatus = ? WHERE id = ?').run(paidStatus ? 1 : 0, id);
    });

    ipcMain.handle('get-all-data', () => {
        try {
            return {
                shops: db.prepare('SELECT * FROM shops').all(),
                meters: db.prepare('SELECT * FROM meters').all(),
                readings: db.prepare('SELECT * FROM readings').all(),
                invoices: db.prepare('SELECT * FROM invoices').all()
            };
        } catch (error) {
            console.error('IPC get-all-data Error:', error);
            throw error;
        }
    });

    // AI Scan
    ipcMain.handle('scan-image', async (_: IpcMainInvokeEvent, { base64Image, knownSerialNumbers }: { base64Image: string, knownSerialNumbers: string[] }) => {
        try {
            const ai = getGenAI();
            const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
            const rawData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
            const mimeType = base64Image.startsWith("data:image/png") ? "image/png" : "image/jpeg";

            const prompt = `You are an expert utility meter inspector in Pakistan.
Extract: 1. Serial number. 2. Current reading(kWh). 3. Consumed units(if any).
Known serials: ${knownSerialNumbers.join(', ')}.
Return ONLY JSON: { "serialNumber": string, "readingValue": number, "consumedUnits": number, "confidence": number }`;

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: rawData, mimeType } }
            ]);

            const response = await result.response;
            let text = response.text();
            console.log('AI Raw Response:', text);

            // More robust JSON extraction
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("AI response did not contain valid JSON: " + text.slice(0, 100));
            }

            const cleanJson = jsonMatch[0];
            const parsed = JSON.parse(cleanJson);

            return {
                reading: parsed.readingValue || parsed.reading || 0,
                serialNumber: parsed.serialNumber || '',
                confidence: parsed.confidence || 0,
                billingPeriod: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            };
        } catch (error) {
            console.error('AI Scan Error:', error);
            throw error;
        }
    });

    // Backup & Restore
    ipcMain.handle('backup-db', async () => {
        const { filePath } = await dialog.showSaveDialog({
            title: 'Backup Database',
            defaultPath: `merameter_backup_${Date.now()}.db`,
            filters: [{ name: 'SQLite Database', extensions: ['db'] }]
        });

        if (filePath) {
            fs.copyFileSync(db.name, filePath);
            return true;
        }
        return false;
    });

    ipcMain.handle('restore-db', async () => {
        const { filePaths } = await dialog.showOpenDialog({
            title: 'Restore Database',
            filters: [{ name: 'SQLite Database', extensions: ['db'] }],
            properties: ['openFile']
        });

        if (filePaths.length > 0) {
            db.close();
            fs.copyFileSync(filePaths[0], db.name);
            return true;
        }
        return false;
    });
};
