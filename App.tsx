// App.tsx
import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Pencil, Store, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import MeterReader from './components/MeterReader';
import InvoiceView from './components/InvoiceView';
import ShopForm from './components/ShopForm';
import MeterUpload from './components/MeterUpload';
import Login from './components/Login';
import { dbService } from './services/dbService';
import { Shop, Meter, MeterReading, Invoice } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('isAdminLoggedIn') === 'true'
  );

  const [activeTab, setActiveTab] =
    useState<'admin' | 'reader' | 'shops' | 'invoices' | 'ai'>('admin');

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [shops, setShops] = useState<Shop[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ratePerUnit, setRatePerUnit] = useState(45);
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
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
      await dbService.seedInitialData();
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
    } catch (error) {
      console.error('Failed to delete shop:', error);
      alert('Failed to delete shop. Please try again.');
    }
  };

  const handleMeterCapture = async (data: {
    readingValue: number;
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

    // Calculate consumption (allow manual override)
    const prevReading = meter.lastReading || 0;
    const units = data.manualUnits !== undefined
      ? data.manualUnits
      : Math.max(0, data.readingValue - prevReading);

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
        isAddingShop ? (
          <ShopForm
            onSave={handleAddShop}
            onCancel={() => { setIsAddingShop(false); setEditingShop(null); }}
            editShop={editingShop}
            editMeter={editingShop ? meters.find(m => m.id === editingShop.meterId) : null}
          />
        ) : (
          <div className="p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 dark:bg-transparent min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Units Registry</h1>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 dark:text-slate-500">Management of all smart meters</p>
              </div>
              <button
                onClick={() => { setEditingShop(null); setIsAddingShop(true); }}
                className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 dark:bg-emerald-600 dark:shadow-emerald-900/40 hover:bg-black dark:hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all group"
              >
                <Plus className="w-5 h-5 text-emerald-400 dark:text-white group-hover:rotate-90 transition-transform" />
                <span>Register New Unit</span>
              </button>
            </div>

            {shops.length === 0 ? (
              <div className="text-center space-y-4 py-24 bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-xs">No Units Registered Yet</p>
                <p className="text-slate-300 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest">Register your first shop or meter to begin tracking</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                {shops.map(s => {
                  const meter = meters.find(m => m.id === s.meterId);
                  const shopReadings = readings.filter(r => r.meterId === meter?.id);
                  const latestReading = shopReadings.length > 0 ? shopReadings[shopReadings.length - 1] : null;
                  const isExpanded = expandedShopId === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`group bg-white dark:bg-slate-900 rounded-[2rem] border transition-all duration-500 overflow-hidden ${isExpanded
                        ? 'border-emerald-200 shadow-2xl shadow-emerald-100/50 ring-1 ring-emerald-100 dark:border-emerald-500/30 dark:shadow-emerald-950/40 dark:ring-emerald-900/20'
                        : 'border-slate-100 dark:border-slate-800 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-xl dark:hover:shadow-black/20 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                    >
                      {/* Card Header */}
                      <div
                        className={`p-7 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : 'bg-transparent'}`}
                        onClick={() => setExpandedShopId(prev => (prev === s.id ? null : s.id))}
                      >
                        <div className="min-w-0">
                          <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 truncate tracking-tight">{s.name}</h3>
                          <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mt-0.5">Shop ID: {s.id.slice(0, 8)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {deletingShopId === s.id ? (
                            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/30 p-1 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in-95 duration-200">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteShop(s.id, s.meterId); }}
                                className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-sm transition-all active:scale-90"
                                title="Confirm Delete"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeletingShopId(null); }}
                                className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm transition-all active:scale-90"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditShop(s); }}
                                className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all active:scale-90"
                                title="Edit Unit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeletingShopId(s.id); }}
                                className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all active:scale-90"
                                title="Delete Unit"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <div className={`p-1.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700'}`}>
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-50 dark:border-slate-800"
                          >
                            <div className="p-7 space-y-6">
                              {/* Ownership Layer */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Legal Owner</p>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.ownerName}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Contact</p>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.phone}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">National CNIC</p>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono tracking-tight">{s.cnic}</p>
                                </div>
                              </div>

                              {/* Address Layer */}
                              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Billing Location</p>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{s.address}</p>
                              </div>

                              {/* Technical Layer */}
                              {meter && (
                                <div className="bg-slate-900 rounded-2xl p-5 space-y-4 shadow-xl dark:bg-slate-800/80">
                                  <div className="flex justify-between items-center">
                                    <div className="bg-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/30">
                                      Active Smart Meter
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Inst: {new Date(meter.installDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex justify-between items-end">
                                    <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Hardware Serial</p>
                                      <p className="text-xs font-black text-white font-mono">{meter.serialNumber}</p>
                                    </div>
                                    {meter.lastReading !== undefined && (
                                      <div className="text-right">
                                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">CUMULATIVE</p>
                                        <p className="text-xl font-black text-white tracking-tighter leading-none">{meter.lastReading.toLocaleString()} <span className="text-[8px] text-slate-500">kWh</span></p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Audit Layer */}
                              {latestReading && (
                                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30 flex justify-between items-center">
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Latest Verification</p>
                                    <div className="flex items-baseline gap-1">
                                      <p className="text-xl font-black text-emerald-900 dark:text-emerald-300 tracking-tighter">{latestReading.readingValue.toLocaleString()}</p>
                                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase">kWh</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Scan Date</p>
                                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{new Date(latestReading.timestamp || latestReading.readingDate || new Date()).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {
        activeTab === 'invoices' && (
          <InvoiceView
            invoices={invoices}
            readings={readings}
            shops={shops}
            meters={meters}
          />
        )
      }

      {activeTab === 'ai' && <MeterUpload />}
    </Layout >
  );
};

export default App;
