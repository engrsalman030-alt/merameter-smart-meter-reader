import React from 'react';
import { Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { Shop, MeterReading, Invoice, Meter } from '../types';

interface InvoiceTemplateProps {
    invoice: Invoice;
    shop: Shop | null;
    meter: Meter | null;
    reading: MeterReading | null;
    invoiceRef?: React.RefObject<HTMLDivElement>;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, shop, meter, reading, invoiceRef }) => {
    return (
        <div ref={invoiceRef} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-800 overflow-hidden relative invoice-container">
            {/* Bold Header Strip */}
            <div className="h-1.5 bg-slate-900 no-print" />

            <div className="p-8 md:p-12 space-y-10">
                {/* BRANDING & LOGO */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b-2 border-slate-100 dark:border-slate-800 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-4 border-slate-900 bg-white dark:bg-slate-800">
                            <Zap className="text-slate-900 dark:text-white w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">MeraMeter</h1>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-0.5">Smart Utility Management</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase opacity-[0.03] absolute top-10 right-10 select-none">Invoice</h2>
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Bill ID</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white font-mono">#{invoice.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* CONSUMER & BILLING DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2">Shop Name</p>
                            <div className="space-y-1">
                                <p className="text-xl font-black text-slate-900 dark:text-white">{shop?.name}</p>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 font-bold">Owner: {shop?.ownerName}</p>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 max-w-[280px] leading-relaxed italic">{shop?.address}</p>
                            </div>
                        </div>
                        <div className="flex gap-8">
                            <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">CNIC</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{shop?.cnic}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Contact</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{shop?.phone}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 md:text-right flex flex-col items-start md:items-end justify-center">
                        <div className="bg-white dark:bg-slate-800/50 px-4 py-3 rounded-xl border-2 border-slate-900 dark:border-slate-700 tracking-tight">
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Meter ID</p>
                            <p className="text-base font-black text-slate-900 dark:text-white font-mono">{meter?.serialNumber}</p>
                        </div>
                        <div className="space-y-1 text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest">
                            <p>Month: {invoice.billingPeriod || 'MONTHLY'}</p>
                            <p>Issued: {new Date(invoice.issuedDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* CONSUMPTION SECTION - SIMPLIFIED WHITE */}
                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className="grid grid-cols-3 gap-4 items-center relative z-10">
                            <div className="text-center md:text-left">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Prev Reading</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{(reading?.previousReadingValue ?? (reading?.readingValue ?? 0) - invoice.units).toLocaleString()}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase">kWh</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="h-px w-8 bg-slate-300 dark:bg-slate-700 mb-2" />
                                <ChevronRight className="w-4 h-4 text-slate-900 dark:text-white" />
                                <div className="h-px w-8 bg-slate-300 dark:bg-slate-700 mt-2" />
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-[8px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2 italic">Current Reading</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{reading?.readingValue.toLocaleString()}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase">kWh</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-1">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Units Used</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{invoice.units.toLocaleString()}</p>
                        </div>
                        <div className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-1">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rate / Unit</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Rs. {invoice.ratePerUnit.toFixed(0)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-4 border-slate-900 dark:border-slate-600 flex flex-col items-center justify-center gap-1 shadow-sm">
                            <p className="text-[9px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Total Payable</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Rs. {invoice.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* TERMS & SIGNATURE */}
                <div className="pt-10 flex flex-col md:flex-row justify-between items-end gap-10 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-3 max-w-xs">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Digitally Verified Bill</span>
                        </div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-[1.6] uppercase tracking-wider">
                            Auto-generated by MeraMeter AI. Please pay before the due date. For queries: help@merameter.pk
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] mb-2">Authorized System Signature</p>
                        <div className="font-serif text-xl text-slate-800 dark:text-white italic opacity-30 select-none">MeraMeter Verified</div>
                        <div className="w-32 h-px bg-slate-100 dark:bg-slate-800 mt-2 ml-auto" />
                    </div>
                </div>
            </div>

            {/* Print Only Footer */}
            <div className="print-only p-6 text-center border-t border-slate-50 bg-slate-50/50">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">Thank you for using MeraMeter - Smart Utility Management</p>
            </div>
        </div>
    );
};

export default InvoiceTemplate;
