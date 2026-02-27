import React, { useState, useMemo } from 'react';
import {
  Share2,
  Printer,
  CheckCircle2,
  Banknote,
  Zap,
  Download,
  Eye,
  Store,
  Filter,
  Search
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Shop, MeterReading, Invoice, Meter } from '../types';

import InvoiceTemplate from './InvoiceTemplate';
import InvoiceModal from './InvoiceModal';
import { dbService } from '../services/dbService';
import { useToast } from './Toast';

interface Props {
  invoices: Invoice[];
  readings: MeterReading[];
  shops: Shop[];
  meters: Meter[];
  onRefresh: () => Promise<void>;
}

const InvoiceView: React.FC<Props> = ({ invoices, readings, shops, meters, onRefresh }) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isViewingInvoice, setIsViewingInvoice] = useState(false);
  const [invoiceVariant, setInvoiceVariant] = useState<'minimalist' | 'dashboard'>('minimalist');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      } else {
        const w = window.open();
        if (w) {
          w.document.write(`<img src="${dataUrl}" style="width:100%">`);
          w.document.close();
          w.focus();
          setTimeout(() => {
            try { w.print(); } catch (e) { console.warn('Print popup failed', e); }
            try { w.close(); } catch (e) {}
            setIsPrinting(false);
          }, 200);
        } else {
          setIsPrinting(false);
          showToast('Unable to open print window. Please allow popups.', 'error');
        }
      }
    } catch (err) {
      console.error("Print failed", err);
      setIsPrinting(false);
      showToast("Printing failed. Please try again.", "error");
    }
  };

  const handleShare = async () => {
    if (!selectedInvoice || !invoiceRef.current) return;
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
        showToast("Ready to share! Image copied to clipboard.", "success");
      } catch (e) {
        showToast("Image downloaded. Clipboard not available.", "info");
      }
      try { window.open('https://web.whatsapp.com/', '_blank'); } catch (e) {}
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
      const updatedInvoice = { ...invoiceToToggle, paidStatus: !invoiceToToggle.paidStatus };
      await dbService.put('invoices', updatedInvoice);
      await onRefresh();
      showToast(`Invoice #${invoiceToToggle.id.slice(0, 8)} marked as ${updatedInvoice.paidStatus ? 'Paid' : 'Pending'}`, 'info');
    } catch (err) {
      console.error("Failed to update status", err);
      showToast("Failed to update payment status.", "error");
    }
  };

  const handleDeleteClick = (invoice: Invoice) => setInvoiceToDelete(invoice);

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    try {
      await dbService.delete('invoices', invoiceToDelete.id);
      await onRefresh();
      setInvoiceToDelete(null);
      setIsViewingInvoice(false);
      showToast(`Invoice #${invoiceToDelete.id.slice(0, 8)} deleted successfully`, 'success');
    } catch (err) {
      console.error("Failed to delete invoice", err);
      showToast("Failed to delete invoice. Please try again.", "error");
    } finally {
      setIsDeleting(false);
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

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  React.useEffect(() => setCurrentPage(1), [searchQuery, filterStatus]);

  if (isViewingInvoice && selectedInvoice) {
    const shop = shops.find(s => s.id === selectedInvoice.shopId);
    const meter = meters.find(m => m.id === selectedInvoice.meterId);
    const reading = readings.find(r => r.id === selectedInvoice.readingId);

    return (
      <InvoiceModal
        invoice={selectedInvoice}
        shop={shop || null}
        meter={meter || null}
        reading={reading || null}
        onClose={() => setIsViewingInvoice(false)}
        onRefresh={onRefresh}
        togglePaidStatus={togglePaidStatus}
        onDeleteConfirm={handleConfirmDelete}
        initialVariant={invoiceVariant}
      />
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 dark:bg-transparent min-h-screen">
      {/* Header */}
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

      {/* Desktop Table */}
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
              {paginatedInvoices.length === 0 ? (
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
                paginatedInvoices.map((inv) => {
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-8 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {paginatedInvoices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-100 dark:border-slate-800">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No matching records</p>
          </div>
        ) : (
          paginatedInvoices.map(inv => {
            const invShop = shops.find(s => s.id === inv.shopId);
            return (
              <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">#{inv.id.slice(0, 6).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider ${inv.paidStatus
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400'
                      : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                      {inv.paidStatus ? 'Received' : 'Awaited'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {invShop?.customerImage ? (
                    <img src={invShop.customerImage} className="w-12 h-12 rounded-xl object-cover grayscale opacity-50" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                      <Store className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{invShop?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{invShop?.ownerName}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-8 py-3">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-5 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing records: {filteredInvoices.length}</p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Ledger Verified</span>
        </div>
      </div>

      {/* Hidden print container */}
      <div id="image-print-container" style={{ display: 'none' }} />
    </div>
  );
};

export default InvoiceView;
