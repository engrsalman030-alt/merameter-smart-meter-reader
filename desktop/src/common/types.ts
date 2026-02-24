export enum SyncStatus {
    PENDING = 'PENDING',
    SYNCED = 'SYNCED',
    FAILED = 'FAILED'
}

export enum ReadingStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export interface Shop {
    id: string;
    name: string;
    ownerName: string;
    cnic: string;
    phone: string;
    address: string;
    shopNumber: string;
    customerImage?: string;
    registrationDate: string;
    meterId?: string;
    unitRate?: number;
}

export interface Meter {
    id: string;
    serialNumber: string;
    shopId: string;
    installDate: string;
    lastReading?: number;
    meterImage?: string;
    initialReadingBefore?: number;
    initialReadingAfter?: number;
}

export interface MeterReading {
    id: string;
    meterId: string;
    shopId?: string;
    readingValue: number;
    previousReadingValue?: number;
    photoUrl: string;
    readingDate?: string;
    timestamp?: string;
    status?: ReadingStatus;
    syncStatus?: SyncStatus;
    readerName?: string;
    ocrConfidence?: number;
    confidence?: number;
    manualOverride?: boolean;
    notes?: string;
}

export interface Invoice {
    id: string;
    readingId: string;
    shopId: string;
    billingPeriod?: string;
    units: number;
    ratePerUnit: number;
    totalAmount: number;
    issuedDate: string;
    status?: string;
    paidStatus?: boolean | number; // SQLite uses 0/1
}
