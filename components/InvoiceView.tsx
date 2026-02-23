import React, { useState, useMemo } from 'react';
import {
  Share2,
  Printer,
  CheckCircle2,
  Banknote,
  Zap,
  Download,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  Eye,
  MoreVertical,
  Store,
  Cpu,
  Phone,
  Calendar,
  CreditCard,
  MapPin,
  X,
  ArrowLeft,
  Clock,
  AlertCircle
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Shop, MeterReading, Invoice, Meter } from '../types';

interface Props {
  invoices: Invoice[];
  readings: MeterReading[];
  shops: Shop[];
  meters: Meter[];
  onRefresh: () => Promise<void>;
}

import InvoiceTemplate from './InvoiceTemplate';
import { dbService } from '../services/dbService';
import { useToast } from './Toast';

const InvoiceView: React.FC<Props> = ({ invoices, readings, shops, meters, onRefresh }) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isViewingInvoice, setIsViewingInvoice] = useState(false);
  const [invoiceVariant, setInvoiceVariant] = useState<'minimalist' | 'dashboard'>('minimalist');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { showToast } = useToast();
  const invoiceRef = React.useRef<HTMLDivElement>(null);

  const selectedInvoice = useMemo(() => {
    if (!selectedInvoiceId) return invoices[0] || null;
    return invoices.find(i => i.id === selectedInvoiceId);
  }, [selectedInvoiceId, invoices]);

  const reading = useMemo(() => {
    if (!selectedInvoice) return null;
    return readings.find(r => r.id === selectedInvoice.readingId) || null;
  }, [selectedInvoice, readings]);

  const shop = useMemo(() => {
    if (!selectedInvoice) return null;
    return shops.find(s => s.id === selectedInvoice.shopId) || null;
  }, [selectedInvoice, shops]);

  const meter = useMemo(() => {
    if (!shop) return null;
    return meters.find(m => m.id === shop.meterId) || null;
  }, [shop, meters]);

  const handlePrint = async () => {
    if (!invoiceRef.current) return;
    setIsPrinting(true);
    try {
      const dataUrl = await htmlToImage.toPng(invoiceRef.current, {
        backgroundColor: invoiceVariant === 'dashboard' ? '#f8fafc' : '#ffffff',
        pixelRatio: 3,
      });

      const printContainer = document.getElementById('image-print-container');
      if (printContainer) {
        const img = new Image();
        img.src = dataUrl;
        img.style.width = '100%';
        img.onload = () => {
          printContainer.innerHTML = '';
          printContainer.appendChild(img);
          setTimeout(() => {
            window.print();
            setIsPrinting(false);
            setTimeout(() => { printContainer.innerHTML = ''; }, 500);
          }, 100);
        };
      }
    } catch (err) {
      console.error("Print failed", err);
      setIsPrinting(false);
      showToast("Printing failed. Please try again.", "error");
    }
  };

  const handleShare = async () => {
    const currentShop = shops.find(s => s.id === selectedInvoice?.shopId);
    if (!currentShop || !selectedInvoice || !invoiceRef.current) return;
    setIsSharing(true);
    try {
      const blob = await htmlToImage.toBlob(invoiceRef.current, {
        backgroundColor: invoiceVariant === 'dashboard' ? '#f8fafc' : '#ffffff',
        pixelRatio: 3,
      });
      if (!blob) throw new Error('Generation failed');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MeraMeter-Invoice-${selectedInvoice.id.slice(0, 8)}.png`;
      link.click();
      try {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
      } catch (e) { }
      showToast("Ready to share! Image copied to clipboard.", "success");
      window.open('https://web.whatsapp.com/', '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Share failed", err);
      showToast("Failed to generate shareable image.", "error");
    } finally {
      setIsSharing(false);
    }
  };

  const togglePaidStatus = async (invoiceToToggle: Invoice) => {
    try {
      const updatedInvoice = {
        ...invoiceToToggle,
        paidStatus: !invoiceToToggle.paidStatus
      };
      await dbService.put('invoices', updatedInvoice);
      await onRefresh();
      showToast(`Invoice #${invoiceToToggle.id.slice(0, 8)} marked as ${updatedInvoice.paidStatus ? 'Paid' : 'Pending'}`, 'info');
    } catch (err) {
      console.error("Failed to update status", err);
      showToast("Failed to update payment status.", "error");
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const shopCandidate = shops.find(s => s.id === inv.shopId);
      const matchSearch =
        shopCandidate?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shopCandidate?.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shopCandidate?.shopNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterStatus === 'all') return matchSearch;
      if (filterStatus === 'paid') return matchSearch && inv.paidStatus;
      if (filterStatus === 'pending') return matchSearch && !inv.paidStatus;

      return matchSearch;
    });
  }, [invoices, shops, searchQuery, filterStatus]);

  if (isViewingInvoice && selectedInvoice) {
    const shop = shops.find(s => s.id === selectedInvoice.shopId);
    const meter = meters.find(m => m.id === selectedInvoice.meterId);
    const reading = readings.find(r => r.id === selectedInvoice.readingId);

    return (
      <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 dark:bg-transparent min-h-screen">
        <div className="max-w-[2000px] mx-auto">
          <button
            onClick={() => setIsViewingInvoice(false)}
            className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-widest font-black">Back to Ledger</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Main Invoice Column - 75% width */}
            <div className="lg:w-[75%] space-y-6">
              <InvoiceTemplate
                invoice={selectedInvoice}
                shop={shop || null}
                meter={meter || null}
                reading={reading || null}
                invoiceRef={invoiceRef}
                variant={invoiceVariant}
              />
            </div>

            {/* Action Rail - 25% width */}
            <div className="lg:w-[25%] space-y-6 no-print">
              {/* Template Style Switcher */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none text-left">Presentation Style</h3>
                  <p className="text-[9px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest text-left">Interface Mode</p>
                </div>
                <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                  <button
                    onClick={() => setInvoiceVariant('minimalist')}
                    className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${invoiceVariant === 'minimalist' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-100 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                  >
                    Minimal
                  </button>
                  <button
                    onClick={() => setInvoiceVariant('dashboard')}
                    className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${invoiceVariant === 'dashboard' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-100 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                  >
                    Dash
                  </button>
                </div>
              </div>

              {/* Ledger Actions */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                <div className="space-y-1 text-left">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">Ledger Actions</h3>
                  <p className="text-[9px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest">Administrative Panel</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => togglePaidStatus(selectedInvoice)}
                    className={`w-full group flex items-center justify-between p-6 rounded-[1.5rem] transition-all duration-300 border ${selectedInvoice.paidStatus
                        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/10 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-emerald-500/30'
                      }`}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest">Settlement</span>
                      <span className={`text-[9px] font-bold ${selectedInvoice.paidStatus ? 'text-emerald-500/70' : 'text-slate-400'}`}>
                        {selectedInvoice.paidStatus ? 'Record Verified' : 'Mark as Verified'}
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-xl border transition-colors ${selectedInvoice.paidStatus ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-600 text-slate-300 group-hover:text-emerald-500 group-hover:bg-emerald-50'}`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handlePrint}
                      className="flex flex-col items-center justify-center gap-3 p-6 bg-[#1A1F2B] dark:bg-slate-100 text-white dark:text-slate-900 rounded-[1.5rem] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#1A1F2B]/10 group"
                    >
                      <Printer className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Print</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex flex-col items-center justify-center gap-3 p-6 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 rounded-[1.5rem] transition-all hover:border-[#1A1F2B] dark:hover:border-slate-100 hover:scale-[1.02] active:scale-[0.98] group"
                    >
                      <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Export</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="bg-[#F8FAFC] dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-emerald-500 shadow-sm border border-slate-100 dark:border-slate-700">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Dashboard Logic</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      Toggle modes to switch between minimalist presentation and high-density dashboard views.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 dark:bg-transparent min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Billing & Invoices</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Revenue Ledger</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative group flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Search ledger..."
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <select
              className="pl-11 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold appearance-none outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Records</option>
              <option value="paid">Settled</option>
              <option value="pending">Awaited</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table Section */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cycle</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <Banknote className="w-10 h-10 text-slate-100 dark:text-slate-700" />
                      </div>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No matching ledger records</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const invShop = shops.find(s => s.id === inv.shopId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest group-hover:text-slate-900 transition-colors">
                          #{inv.id.slice(0, 6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          {invShop?.customerImage ? (
                            <img src={invShop.customerImage} className="w-9 h-9 rounded-xl object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                              <Store className="w-4 h-4 text-slate-300" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{invShop?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{invShop?.ownerName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">{inv.billingPeriod || 'Nov 2023'}</p>
                          <p className="text-[9px] font-medium text-slate-400">{new Date(inv.issuedDate).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-sm font-bold text-slate-800 dark:text-white">{inv.units.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">kWh</span></span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">Rs. {inv.totalAmount.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider ${inv.paidStatus
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'}`}>
                          {inv.paidStatus ? 'Received' : 'Awaited'}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedInvoiceId(inv.id); setIsViewingInvoice(true); }}
                            className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-100 dark:border-slate-700 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No matching records</p>
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const invShop = shops.find(s => s.id === inv.shopId);
            return (
              <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 space-y-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    {invShop?.customerImage ? (
                      <img src={invShop.customerImage} className="w-12 h-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                        <Store className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{invShop?.name || 'Unknown'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">#{inv.id.slice(0, 6).toUpperCase()}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-100 dark:bg-slate-800" />
                        <span className="text-[10px] font-medium text-slate-400">{new Date(inv.issuedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider border ${inv.paidStatus ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    {inv.paidStatus ? 'Paid' : 'Awaited'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Units</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{inv.units.toLocaleString()}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payable</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Rs. {inv.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedInvoiceId(inv.id); setIsViewingInvoice(true); }}
                    className="flex-1 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => togglePaidStatus(inv)}
                    className={`px-6 py-4 rounded-2xl border transition-all active:scale-95 ${inv.paidStatus ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300'}`}
                  >
                    {inv.paidStatus ? <CheckCircle2 className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-8 py-5 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing records: {filteredInvoices.length}</p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Ledger Verified</span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
