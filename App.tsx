// App.tsx
import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Pencil, Store, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import MeterReader from './components/MeterReader';
import ShopForm from './components/ShopForm';
import ShopManagement from './components/ShopManagement';
import InvoiceView from './components/InvoiceView';
import SettingsView from './components/SettingsView';
import Login from './components/Login';
import { dbService } from './services/dbService';
import { Shop, Meter, MeterReading, Invoice } from './types';
import { ToastProvider, useToast } from './components/Toast';

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

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [shops, setShops] = useState<Shop[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ratePerUnit, setRatePerUnit] = useState(45);
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [deletingShopId, setDeletingShopId] = useState<string | null>(null);
  const [generatedInvoice, setGeneratedInvoice] = useState<{
    invoice: Invoice;
    shop: Shop;
    meter: Meter;
    reading: MeterReading;
  } | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const savedRate = localStorage.getItem('billingRate');
    if (savedRate) setRatePerUnit(parseFloat(savedRate));

    const init = async () => {
      refreshState();
    };
    init();

    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const handleRateChange = (newRate: number) => {
    setRatePerUnit(newRate);
    localStorage.setItem('billingRate', newRate.toString());
  };

  const refreshState = async () => {
    setShops(await dbService.getAll<Shop>('shops'));
    setMeters(await dbService.getAll<Meter>('meters'));
    setReadings(await dbService.getAll<MeterReading>('readings'));
    setInvoices(await dbService.getAll<Invoice>('invoices'));
  };

  const handleAddShop = async (shop: Shop, meter: Meter) => {
    await dbService.put('shops', shop);
    await dbService.put('meters', meter);
    await refreshState();
    setIsAddingShop(false);
    setEditingShop(null);
    showToast(`${shop.name} record updated successfully!`, 'success');
  };

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop);
    setIsAddingShop(true);
  };

  const handleDeleteShop = async (shopId: string, meterId?: string) => {
    try {
      if (meterId) {
        await dbService.delete('meters', meterId);
      }
      await dbService.delete('shops', shopId);

      // Also cleanup readings and invoices for this shop
      const allReadings = await dbService.getAll<MeterReading>('readings');
      const shopReadings = allReadings.filter(r => r.shopId === shopId);
      for (const r of shopReadings) {
        await dbService.delete('readings', r.id);
      }

      const allInvoices = await dbService.getAll<Invoice>('invoices');
      const shopInvoices = allInvoices.filter(i => i.shopId === shopId);
      for (const i of shopInvoices) {
        await dbService.delete('invoices', i.id);
      }

      await refreshState();
      setDeletingShopId(null);
      showToast('Record deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete shop:', error);
      showToast('Failed to delete shop. Please try again.', 'error');
    }
  };

  const handleMeterCapture = async (data: {
    readingValue: number;
    consumedUnits?: number;
    serialNumber: string;
    photoUrl: string;
    confidence: number;
    manualShopId?: string;
    manualUnits?: number;
  }) => {
    const shopId = data.manualShopId;
    const shop = shops.find(s => s.id === shopId);
    const meter = meters.find(m => m.id === shop?.meterId);

    if (!shop || !meter) {
      console.error('Shop or meter not found');
      return;
    }

    // Create meter reading record
    const newReading: MeterReading = {
      id: Date.now().toString(),
      meterId: meter.id,
      shopId: shop.id,
      readingValue: data.readingValue,
      previousReadingValue: meter.lastReading || 0,
      readingDate: new Date().toISOString(),
      photoUrl: data.photoUrl,
      confidence: data.confidence,
    };

    // Calculate consumption (allow manual override or AI suggestion)
    const prevReading = meter.lastReading || 0;
    let units = 0;
    if (data.manualUnits !== undefined) {
      units = data.manualUnits;
    } else if (data.consumedUnits !== undefined && data.consumedUnits !== null) {
      units = data.consumedUnits;
    } else {
      units = Math.max(0, data.readingValue - prevReading);
    }

    const amount = units * ratePerUnit;

    // Create invoice
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      shopId: shop.id,
      readingId: newReading.id,
      units: units,
      ratePerUnit: ratePerUnit,
      totalAmount: amount,
      issuedDate: new Date().toISOString(),
      status: 'approved',
      paidStatus: false,
    };

    // Update meter with latest reading
    const updatedMeter = {
      ...meter,
      lastReading: data.readingValue,
    };

    // Save all to database
    await dbService.put('readings', newReading);
    await dbService.put('invoices', newInvoice);
    await dbService.put('meters', updatedMeter);

    // Refresh state
    await refreshState();

    // Show the generated invoice immediately
    setGeneratedInvoice({
      invoice: newInvoice,
      shop,
      meter: updatedMeter,
      reading: newReading,
    });
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isOnline={isOnline}
      onLogout={handleLogout}
      allShops={shops}
      ratePerUnit={ratePerUnit}
      onRateChange={handleRateChange}
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
          onCapture={handleMeterCapture}
          generatedInvoice={generatedInvoice}
          onClearInvoice={() => setGeneratedInvoice(null)}
        />
      )}

      {activeTab === 'shops' && (
        <ShopManagement
          shops={shops}
          meters={meters}
          readings={readings}
          invoices={invoices}
          onAddShop={() => { setEditingShop(null); setIsAddingShop(true); setIsViewOnly(false); }}
          onEditShop={(shop) => { handleEditShop(shop); setIsViewOnly(false); }}
          onDeleteShop={handleDeleteShop}
          onViewShop={(id) => {
            const shop = shops.find(s => s.id === id);
            if (shop) {
              handleEditShop(shop);
              setIsViewOnly(true);
            }
          }}
        />
      )}

      {/* Modal Overlay for Shop Form */}
      {isAddingShop && (
        <ShopForm
          onSave={handleAddShop}
          onCancel={() => { setIsAddingShop(false); setEditingShop(null); setIsViewOnly(false); }}
          editShop={editingShop}
          editMeter={meters.find(m => m.shopId === editingShop?.id)}
          isReadOnly={isViewOnly}
        />
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
          currentTheme={(localStorage.getItem('theme') as 'light' | 'dark') || 'light'}
          onThemeChange={(theme) => {
            localStorage.setItem('theme', theme);
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }}
          ratePerUnit={ratePerUnit}
          onRateChange={handleRateChange}
        />
      )}
    </Layout >
  );
};

export default App;
