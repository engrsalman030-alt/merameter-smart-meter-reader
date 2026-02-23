import React from 'react';
import { Zap, CheckCircle2, Store, MapPin, Cpu } from 'lucide-react';
import { Shop, MeterReading, Invoice, Meter } from '../types';

interface InvoiceTemplateProps {
    invoice: Invoice;
    shop: Shop | null;
    meter: Meter | null;
    reading: MeterReading | null;
    invoiceRef?: React.RefObject<HTMLDivElement>;
    variant?: 'minimalist' | 'dashboard';
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
    invoice,
    shop,
    meter,
    reading,
    invoiceRef,
    variant = 'minimalist'
}) => {
    const isDashboard = variant === 'dashboard';

    return (
        <div
            ref={invoiceRef}
            className={`overflow-hidden invoice-container w-full transition-all duration-500 text-left ${isDashboard
                    ? 'bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl'
                    : 'bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
        >
            {/* 1. HEADER SECTION - Deep Navy for Dashboard */}
            <div className={`flex flex-col md:flex-row justify-between items-start gap-8 p-10 md:p-12 transition-colors duration-500 ${isDashboard ? 'bg-[#1A1F2B] dark:bg-slate-950' : 'bg-white dark:bg-slate-900'}`}>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-emerald-500">
                        <Zap className={`${isDashboard ? 'w-10 h-10' : 'w-8 h-8'} fill-current`} />
                        <h1 className={`${isDashboard ? 'text-3xl text-white' : 'text-2xl text-slate-900 dark:text-white'} font-bold tracking-tight`}>MeraMeter</h1>
                    </div>
                    <p className={`font-medium ${isDashboard ? 'text-slate-400 text-base' : 'text-slate-400 text-sm'}`}>Digital Utility Ledger System</p>
                </div>

                <div className="text-left md:text-right space-y-2">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDashboard ? 'text-slate-500' : 'text-slate-400'}`}>Invoicing No.</p>
                    <p className={`${isDashboard ? 'text-xl text-white' : 'text-lg text-slate-900 dark:text-white'} font-bold font-mono leading-none`}>#{invoice.id.slice(0, 10).toUpperCase()}</p>
                    <div className="pt-1">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${invoice.paidStatus
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-50 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'}`}>
                            {invoice.paidStatus ? 'Payment Confirmed' : 'Balance Awaited'}
                        </span>
                    </div>
                </div>
            </div>

            <div className={`${isDashboard ? 'p-8 md:p-12 space-y-12' : 'p-10 md:p-16 space-y-16'}`}>
                {/* 2. CORE INFORMATION - Soft Slate for Dashboard cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <div className={`space-y-6 transition-colors duration-500 ${isDashboard ? 'bg-[#F8FAFC] dark:bg-slate-900/40 p-10 rounded-3xl border border-slate-100 dark:border-slate-800' : ''}`}>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Consumer Entity</p>
                            <div className="flex items-center gap-5">
                                {shop?.customerImage ? (
                                    <img src={shop.customerImage} alt="" className="w-20 h-20 rounded-2xl object-cover ring-8 ring-white dark:ring-slate-800 shadow-sm" />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <Store className="w-10 h-10 text-slate-200" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{shop?.name}</h2>
                                    <p className="text-base text-slate-500 dark:text-slate-400 font-medium">{shop?.ownerName}</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Shop {shop?.shopNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                            <MapPin className="w-4 h-4" />
                            <span>{shop?.address}</span>
                        </div>
                    </div>

                    <div className={`space-y-6 transition-colors duration-500 ${isDashboard ? 'bg-[#F8FAFC] dark:bg-slate-900/40 p-10 rounded-3xl border border-slate-100 dark:border-slate-800' : ''}`}>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Administrative Info</p>
                            <div className="space-y-4">
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Cycle</p>
                                    <p className="text-base font-bold text-slate-800 dark:text-white">{invoice.billingPeriod || 'Standard'}</p>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Issued</p>
                                    <p className="text-base font-bold text-slate-800 dark:text-white">{new Date(invoice.issuedDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Cpu className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Hardware ID:</span>
                            <span className="text-sm font-bold font-mono text-slate-600 dark:text-slate-300">{meter?.serialNumber}</span>
                        </div>
                    </div>
                </div>

                {/* 3. CONSUMPTION SUMMARY */}
                <div className={`space-y-6 ${isDashboard ? 'bg-white dark:bg-slate-900/20 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm' : 'border-y border-slate-100 dark:border-slate-800 py-8'}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Consumption Summary</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opening Bal.</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-800 dark:text-white">{(reading?.previousReadingValue ?? (reading?.readingValue ?? 0) - invoice.units).toLocaleString()}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">kWh</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 md:border-l border-slate-100 dark:border-slate-800 md:pl-10">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Closing Bal.</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-800 dark:text-white">{reading?.readingValue.toLocaleString()}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">kWh</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 md:border-l border-slate-100 dark:border-slate-800 md:pl-10">
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Net Units Used</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-emerald-500 tracking-tighter decoration-emerald-500/10 underline underline-offset-8 decoration-4">{invoice.units.toLocaleString()}</span>
                                <span className="text-sm font-bold text-emerald-500 uppercase">kWh</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. FINANCIAL BREAKDOWN */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className={`lg:col-span-12 space-y-12 transition-all ${isDashboard ? 'bg-[#F8FAFC] dark:bg-slate-900/40 p-10 rounded-3xl border border-slate-100 dark:border-slate-800' : ''}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Financial Ledger</p>
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center text-base">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Units Consumed</span>
                                            <span className="font-bold text-slate-900 dark:text-white">Rs. {invoice.totalAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-base">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Tax & Surcharges</span>
                                            <span className="font-bold text-slate-900 dark:text-white">Rs. 0.00</span>
                                        </div>
                                        <div className="pt-8 mt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Total Net Payable</p>
                                                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Rs. {invoice.totalAmount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 px-6 py-3 bg-emerald-600 rounded-2xl w-fit shadow-lg shadow-emerald-500/20">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                    <span className="text-[11px] font-black text-white uppercase tracking-widest">Validated Ledger Record</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Visual Audit Entry (High Res Scan)</p>
                                <div className="relative aspect-[4/3] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group">
                                    {reading?.photoUrl ? (
                                        <img src={reading.photoUrl} alt="Audit Verification" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                    ) : (
                                        <Zap className="w-16 h-16 text-slate-100" />
                                    )}
                                    <div className="absolute top-6 left-6 bg-emerald-600 text-white backdrop-blur px-5 py-2.5 rounded-2xl shadow-2xl ring-4 ring-emerald-500/30 animate-pulse">
                                        <p className="text-xs font-black uppercase tracking-[0.15em]">AI Certified Entry</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. FOOTER */}
                <div className={`pt-12 flex justify-between items-center transition-colors duration-500 ${isDashboard ? 'border-t-2 border-slate-100 dark:border-slate-800' : 'border-t border-slate-100 dark:border-slate-800'}`}>
                    <div className="space-y-1">
                        <p className="text-[10px] text-slate-900 dark:text-white font-black uppercase tracking-[0.2em]">Security Protocol MM-{invoice.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Encrypted Ledger Authentication Matrix</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest select-none underline decoration-emerald-500/50 underline-offset-4 decoration-2">Digital Stamp Verified</p>
                    </div>
                </div>
            </div>

            <div className={`p-10 text-center border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4 ${isDashboard ? 'bg-[#1A1F2B] dark:bg-slate-950' : 'bg-slate-50/50'}`}>
                <div className="flex items-center gap-4">
                    <div className="h-[1px] w-12 bg-slate-700/50" />
                    <p className={`text-[10px] font-bold uppercase tracking-[0.5em] ${isDashboard ? 'text-slate-500' : 'text-slate-400'}`}>MeraMeter Excellence — merameter.pk</p>
                    <div className="h-[1px] w-12 bg-slate-700/50" />
                </div>
                {isDashboard && <p className="text-[8px] text-slate-600 font-medium uppercase tracking-[0.2em]">Authorized Government Utility Ledger Platform</p>}
            </div>
        </div>
    );
};

export default InvoiceTemplate;
