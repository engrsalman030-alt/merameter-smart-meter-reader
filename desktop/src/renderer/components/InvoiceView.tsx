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
    Store,
    Cpu,
    ArrowLeft,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Shop, MeterReading, Invoice, Meter } from '../types';
import InvoiceTemplate from './InvoiceTemplate';
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
        showToast("Printing initiated...", "info");
        window.print();
    };

    const handleDownload = async () => {
        if (!invoiceRef.current || !selectedInvoice) return;
        setIsSharing(true);
        try {
            const dataUrl = await toPng(invoiceRef.current, {
                backgroundColor: invoiceVariant === 'dashboard' ? '#1A1F2B' : '#ffffff',
                pixelRatio: 2,
                cacheBust: true
            });
            const link = document.createElement('a');
            link.download = `MeraMeter-Invoice-${selectedInvoice.id.slice(0, 8)}.png`;
            link.href = dataUrl;
            link.click();
            showToast("Invoice image saved!", "success");
        } catch (err) {
            showToast("Failed to generate image.", "error");
        } finally {
            setIsSharing(false);
        }
    };

    const togglePaidStatus = async (invoiceToToggle: Invoice) => {
        try {
            const success = await window.electronAPI.updateInvoicePaidStatus(invoiceToToggle.id, !invoiceToToggle.paidStatus);
            if (success) {
                await onRefresh();
                showToast(`Invoice updated!`, 'success');
            }
        } catch (err) {
            showToast("Failed to update status.", "error");
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
        return (
            <div className="p-4 md:p-8 space-y-6 bg-slate-50 dark:bg-transparent min-h-screen">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => setIsViewingInvoice(false)}
                        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs uppercase tracking-widest font-black">Back to Ledger</span>
                    </button>

                    <div className="flex flex-col lg:flex-row gap-10 items-start">
                        <div className="lg:flex-1 w-full scale-95 origin-top lg:scale-100 transition-all">
                            <InvoiceTemplate
                                invoice={selectedInvoice}
                                shop={shop}
                                meter={meter}
                                reading={reading}
                                invoiceRef={invoiceRef}
                                variant={invoiceVariant}
                            />
                        </div>

                        <div className="lg:w-80 w-full space-y-6 no-print">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Style</h3>
                                    <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-xl mt-4">
                                        <button
                                            onClick={() => setInvoiceVariant('minimalist')}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${invoiceVariant === 'minimalist' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                                        >
                                            Minimal
                                        </button>
                                        <button
                                            onClick={() => setInvoiceVariant('dashboard')}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${invoiceVariant === 'dashboard' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                                        >
                                            Premium
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                <button
                                    onClick={() => togglePaidStatus(selectedInvoice)}
                                    className={`w-full h-16 rounded-2xl border font-black uppercase tracking-widest text-[10px] flex items-center justify-between px-6 transition-all ${selectedInvoice.paidStatus ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                >
                                    <span>{selectedInvoice.paidStatus ? 'Payment Confirmed' : 'Mark as Received'}</span>
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all"
                                    disabled={isSharing}
                                >
                                    <Download className="w-5 h-5" />
                                    {isSharing ? 'Generating...' : 'Save as PNG'}
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="w-full h-16 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:border-emerald-500 transition-all"
                                >
                                    <Printer className="w-5 h-5 text-slate-400" />
                                    Print Bill
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-transparent min-h-screen">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Billing Ledger</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Transaction Audit System</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="relative group flex-1 sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search ID or Customer..."
                            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <select
                            className="h-12 pl-6 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm cursor-pointer"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all">All Entries</option>
                            <option value="paid">Settled</option>
                            <option value="pending">Due</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoicing No.</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Target</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Billed Units</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">No records detected in matrix</td>
                                </tr>
                            ) : (
                                filteredInvoices.slice().reverse().map((inv) => {
                                    const invShop = shops.find(s => s.id === inv.shopId);
                                    return (
                                        <tr key={inv.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                            <td className="px-8 py-6 text-[10px] font-mono font-bold text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-widest">
                                                #{inv.id.slice(0, 8)}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    {invShop?.customerImage ? (
                                                        <img src={invShop.customerImage} className="w-9 h-9 rounded-xl object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all shadow-sm" />
                                                    ) : (
                                                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                                            <Store className="w-4 h-4 text-slate-300" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white leading-none">{invShop?.name || 'Unknown'}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Shop {invShop?.shopNumber || '?'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase leading-none">{inv.billingPeriod || 'N/A'}</p>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1 italic">{new Date(inv.issuedDate).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{inv.units.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">kWh</span></span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black text-emerald-600 tracking-tight">Rs. {inv.totalAmount.toLocaleString()}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-black tracking-widest uppercase inline-block ${inv.paidStatus ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    {inv.paidStatus ? 'Settled' : 'Awaited'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => { setSelectedInvoiceId(inv.id); setIsViewingInvoice(true); }}
                                                    className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white transition-all transform active:scale-90"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvoiceView;
