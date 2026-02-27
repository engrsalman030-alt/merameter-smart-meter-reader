// App.tsx
import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Pencil, Store, Trash2, AlertTriangle, Check, X, MessageCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import MeterReader from './components/MeterReader';
import ShopForm from './components/ShopForm';
import ShopManagement from './components/ShopManagement';
import InvoiceView from './components/InvoiceView';
import SettingsView from './components/SettingsView';
import ShopDetailsView from './components/ShopDetailsView';
import Login from './components/Login';
import { hybridService } from './services/hybridService';
import { Shop, Meter, MeterReading, Invoice } from './types';
import { ToastProvider, useToast } from './components/Toast';

// ─── Root ─────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

// ─── Main Content ─────────────────────────────────────────────────────────────
const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('isAdminLoggedIn') === 'true'
  );

  const [activeTab, setActiveTab] =
    useState<'admin' | 'reader' | 'shops' | 'invoices' | 'settings'>('admin');

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineMode, setIsOfflineMode] = useState(
    localStorage.getItem('offlineMode') === 'true'
  );

  const [shops, setShops] = useState<Shop[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ratePerUnit, setRatePerUnit] = useState(45);
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [deletingShopId, setDeletingShopId] = useState<string | null>(null);
  const [viewingShopId, setViewingShopId] = useState<string | null>(null);
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

    hybridService.setOfflineMode(isOfflineMode);

    const init = async () => { refreshState(); };
    init();

    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const handleOfflineToggle = (mode: boolean) => {
    setIsOfflineMode(mode);
    localStorage.setItem('offlineMode', mode ? 'true' : 'false');
    hybridService.setOfflineMode(mode);
    showToast(mode ? "Offline Mode Enabled" : "Online Mode Enabled", "info");
  };

  const handleRateChange = (newRate: number) => {
    setRatePerUnit(newRate);
    localStorage.setItem('billingRate', newRate.toString());
  };

  const refreshState = async () => {
    try {
      const data = await hybridService.getAllData();
      setShops(data.shops || []);
      setMeters(data.meters || []);
      setReadings(data.readings || []);
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showToast("Data sync error", "error");
    }
  };

  const handleAddShop = async (shop: Shop, meter: Meter) => {
    try {
      await hybridService.saveShopWithMeter(shop, meter);
      await refreshState();
      setIsAddingShop(false);
      setEditingShop(null);
      showToast(`${shop.name} record updated successfully!`, 'success');
    } catch (err) {
      showToast("Failed to save shop", "error");
    }
  };

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop);
    setIsAddingShop(true);
  };

  const handleDeleteShop = async (shopId: string) => {
    try {
      await hybridService.deleteShop(shopId);
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
    if (!shop) return;
    const meter = meters.find(m => m.id === shop.meterId);
    if (!meter) return;

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

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      shopId: shop.id,
      readingId: newReading.id,
      units,
      ratePerUnit,
      totalAmount: amount,
      issuedDate: new Date().toISOString(),
      status: 'approved',
      paidStatus: false,
    };

    // ✅ Save reading and invoice to database
    try {
      await hybridService.saveMeterReading(newReading);
      await hybridService.saveInvoice(newInvoice);
      await hybridService.updateMeterLastReading(meter.id, data.readingValue);
      await refreshState();
      
      showToast('Reading saved successfully!', 'success');
    } catch (err) {
      console.error('Failed to save reading:', err);
      showToast('Failed to save reading', 'error');
      return;
    }

    setGeneratedInvoice({
      invoice: newInvoice,
      shop,
      meter: { ...meter, lastReading: data.readingValue },
      reading: newReading,
    });
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Layout
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setViewingShopId(null);
        }}
        isOnline={isOnline}
        onLogout={handleLogout}
        allShops={shops}
        ratePerUnit={ratePerUnit}
        onRateChange={handleRateChange}
        onOfflineToggle={handleOfflineToggle}
        isOfflineMode={isOfflineMode}
      >
        {activeTab === 'admin' && (
          <AdminDashboard shops={shops} readings={readings} invoices={invoices} />
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
            onViewDetails={(id) => { setViewingShopId(id); }}
          />
        )}

        {/* Modal Overlay for Shop Details */}
        {viewingShopId && (
          <ShopDetailsView
            shop={shops.find(s => s.id === viewingShopId)!}
            meter={meters.find(m => m.shopId === viewingShopId)}
            readings={readings}
            onClose={() => setViewingShopId(null)}
            onEdit={(shop) => { setViewingShopId(null); handleEditShop(shop); }}
            onDelete={(shopId) => { setViewingShopId(null); handleDeleteShop(shopId); }}
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
      </Layout>

      {/* ── Footer ── */}
      <AppFooter />
    </div>
  );
};

const AppFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      rowGap: 6,
      columnGap: 16,
      padding: '9px 24px',
      background: '#ffffff',
      borderTop: '1px solid rgba(0,0,0,0.1)',
      flexShrink: 0,
    }}>

      {/* ── LEFT: Copyright + App name ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Zap size={12} style={{ color: '#000', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: '#000' }}>© {year}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#000', letterSpacing: '0.05em' }}>
          MeterBill
        </span>
        <span style={{
          fontSize: 9, color: '#000',
          background: 'rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          padding: '1px 5px', borderRadius: 3,
        }}>
          v1.0
        </span>
        {/* vertical divider */}
        <span style={{ display: 'inline-block', width: 1, height: 12, background: 'rgba(0,0,0,0.2)', margin: '0 1px' }} />
        <span style={{ fontSize: 10, color: '#000' }}>All rights reserved</span>
      </div>

      {/* ── CENTER: Powered by ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 10, color: '#000' }}>Powered by</span>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
          color: '#000',
        }}>
          Virtual Tech Solution
        </span>
      </div>

      {/* ── RIGHT: Support contact ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 10, color: '#000' }}>Support &amp; Assistance:</span>
        <a
          href="https://wa.me/923419004030"
          target="_blank"
          rel="noopener noreferrer"
          title="Chat with us on WhatsApp"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            textDecoration: 'none',
            background: 'rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.1)',
            padding: '3px 10px', borderRadius: 5,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
          }}
        >
          <MessageCircle size={11} style={{ color: '#000', flexShrink: 0 }} />
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#000',
            fontFamily: 'monospace', letterSpacing: '0.05em',
          }}>
            0341-9004030
          </span>
          <span style={{
            fontSize: 9, color: '#555',
            background: 'rgba(0,0,0,0.05)',
            padding: '1px 5px', borderRadius: 3,
            letterSpacing: '0.04em', fontWeight: 500,
          }}>
            WhatsApp
          </span>
        </a>
      </div>

    </footer>
  );
};

export default App;