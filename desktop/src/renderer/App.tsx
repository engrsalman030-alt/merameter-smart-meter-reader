import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import MeterReader from './components/MeterReader';
import ShopForm from './components/ShopForm';
import ShopManagement from './components/ShopManagement';
import InvoiceView from './components/InvoiceView';
import SettingsView from './components/SettingsView';
import ShopDetailsView from './components/ShopDetailsView';
import Login from './components/Login';
import { Shop, Meter, MeterReading, Invoice } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { hybridService } from '../../../services/hybridService';

const App: React.FC = () => {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
};

const AppContent: React.FC = () => {
    const { showToast } = useToast();
    const [isLoggedIn, setIsLoggedIn] = useState(
        localStorage.getItem('isAdminLoggedIn') === 'true'
    );

    const [activeTab, setActiveTab] =
        useState<'admin' | 'reader' | 'shops' | 'invoices' | 'settings'>('admin');

    const [viewingShopId, setViewingShopId] = useState<string | null>(null);

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isOfflineMode, setIsOfflineMode] = useState(
        localStorage.getItem('offlineMode') === 'true'
    );

    const [shops, setShops] = useState<Shop[]>([]);
    const [meters, setMeters] = useState<Meter[]>([]);
    const [readings, setReadings] = useState<MeterReading[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const [isAddingShop, setIsAddingShop] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);

    // Theme & Price State
    const [theme, setTheme] = useState<'light' | 'dark'>(
        (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
    );
    const [ratePerUnit, setRatePerUnit] = useState<number>(
        parseFloat(localStorage.getItem('ratePerUnit') || '30')
    );

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const refreshState = useCallback(async () => {
        try {
            const data = await hybridService.getAllData();
            setShops(data.shops || []);
            setMeters(data.meters || []);
            setReadings(data.readings || []);
            setInvoices(data.invoices || []);
        } catch (err) {
            console.error("Failed to fetch data:", err);
            showToast("Database connection error", "error");
        }
    }, [showToast]);

    useEffect(() => {
        hybridService.setOfflineMode(isOfflineMode);
        refreshState();

        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);

        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, [refreshState]);

    const handleAddShopSave = async (shop: Partial<Shop>, meter: Partial<Meter>) => {
        try {
            const id = editingShop ? editingShop.id : `shop_${Date.now()}`;
            const meterId = editingShop ? editingShop.meterId : `meter_${Date.now()}`;

            const newShop: Shop = {
                ...shop,
                id,
                meterId: meterId
            } as Shop;

            const newMeter: Meter = {
                ...meter,
                id: meterId as string,
                shopId: id
            } as Meter;

            console.log('Saving via hybridService:', { newShop, newMeter });
            const success = await hybridService.saveShopWithMeter(newShop as any, newMeter as any);
            if (success) {
                await refreshState();
                setIsAddingShop(false);
                setEditingShop(null);
                showToast(editingShop ? 'Entity updated' : 'New entity registered', 'success');
            }
        } catch (err) {
            console.error('handleAddShopSave Error:', err);
            showToast('System fault during save', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdminLoggedIn');
        setIsLoggedIn(false);
    };

    const handleDeleteShop = async (shopId: string) => {
        try {
            const success = await hybridService.deleteShop(shopId);
            if (success) {
                await refreshState();
                showToast('Entity purged from matrix', 'success');
            }
        } catch (err) {
            showToast('Failed to delete entity', 'error');
        }
    };

    if (!isLoggedIn) {
        return <Login onLogin={() => setIsLoggedIn(true)} />;
    }

    return (
        <Layout
            activeTab={activeTab}
            onTabChange={(tab) => {
                setActiveTab(tab);
                setViewingShopId(null);
            }}
            isOnline={isOnline}
            onLogout={handleLogout}
            onOfflineToggle={(mode) => {
                setIsOfflineMode(mode);
                localStorage.setItem('offlineMode', mode ? 'true' : 'false');
                hybridService.setOfflineMode(mode);
                showToast(mode ? "Offline Mode Enabled" : "Online Mode Enabled", "info");
            }}
            isOfflineMode={isOfflineMode}
        >
            {activeTab === 'admin' && (
                <AdminDashboard
                    shops={shops}
                    readings={readings}
                    invoices={invoices}
                />
            )}

            {activeTab === 'reader' && (
                <MeterReader
                    shops={shops}
                    meters={meters}
                    ratePerUnit={ratePerUnit}
                    onReadingCaptured={async () => {
                        await refreshState();
                    }}
                />
            )}

            {activeTab === 'shops' && (
                viewingShopId ? (
                    <ShopDetailsView
                        shop={shops.find(s => s.id === viewingShopId)!}
                        meter={meters.find(m => m.shopId === viewingShopId)}
                        onClose={() => setViewingShopId(null)}
                    />
                ) : (
                    <ShopManagement
                        shops={shops}
                        onAddShop={() => { setEditingShop(null); setIsAddingShop(true); }}
                        onEditShop={(shop) => { setEditingShop(shop); setIsAddingShop(true); }}
                        onDeleteShop={handleDeleteShop}
                        onViewDetails={(shopId) => {
                            setViewingShopId(shopId);
                        }}
                    />
                )
            )}

            {activeTab === 'invoices' && (
                <InvoiceView
                    invoices={invoices}
                    readings={readings}
                    shops={shops}
                    meters={meters}
                    onRefresh={refreshState}
                />
            )}

            {activeTab === 'settings' && (
                <SettingsView
                    currentTheme={theme}
                    onThemeChange={setTheme}
                    ratePerUnit={ratePerUnit}
                    onRateChange={setRatePerUnit}
                />
            )}

            {isAddingShop && (
                <ShopForm
                    onSave={handleAddShopSave}
                    onCancel={() => { setIsAddingShop(false); setEditingShop(null); }}
                    editShop={editingShop}
                    editMeter={meters.find(m => m.shopId === editingShop?.id)}
                />
            )}
        </Layout>
    );
};

export default App;
