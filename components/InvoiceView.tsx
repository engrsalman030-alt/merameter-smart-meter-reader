import React, { useState, useMemo } from 'react';
import { Share2, Printer, CheckCircle2, Banknote, Zap, Download, ChevronRight, Loader2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Shop, MeterReading, Invoice, Meter } from '../types';

interface Props {
  invoices: Invoice[];
  readings: MeterReading[];
  shops: Shop[];
  meters: Meter[];
}

import InvoiceTemplate from './InvoiceTemplate';

const InvoiceView: React.FC<Props> = ({ invoices, readings, shops, meters }) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
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
        backgroundColor: '#ffffff',
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
      alert("Error: Print failed. Try again.");
    }
  };

  const handleShare = async () => {
    if (!shop || !selectedInvoice || !invoiceRef.current) return;
    setIsSharing(true);
    try {
      const blob = await htmlToImage.toBlob(invoiceRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 3,
      });
      if (!blob) throw new Error('Generation failed');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MeraMeter-Formate.png`;
      link.click();
      try {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
      } catch (e) { }
      alert("✓ IMAGE READY!\n\n1. Download successful.\n2. WhatsApp opening.\n3. DRAG THE IMAGE into WhatsApp.");
      window.open('https://web.whatsapp.com/', '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Share failed", err);
      alert("Error generating image.");
    } finally {
      setIsSharing(false);
    }
  };

  if (!selectedInvoice) {
    return (
      <div className="p-4 md:p-8 min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Banknote className="w-16 h-16 mx-auto text-slate-300" />
          <p className="text-slate-600 font-bold">No invoices available</p>
          <p className="text-slate-500 text-sm">Invoices will appear after meter readings are recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 dark:bg-transparent min-h-[calc(100vh-80px)]">

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Main Invoice Section */}
        <div className="lg:col-span-8 space-y-6">
          <InvoiceTemplate
            invoice={selectedInvoice}
            shop={shop}
            meter={meter}
            reading={reading}
            invoiceRef={invoiceRef}
          />

          {/* Actions - No Print */}
          <div className="flex flex-col sm:flex-row gap-4 no-print">
            <button
              onClick={handlePrint}
              disabled={isPrinting || isSharing}
              className={`flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-center gap-4 text-xs font-black text-slate-700 dark:text-slate-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.02)] hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.98] transition-all group ${isPrinting ? 'opacity-50' : ''}`}
            >
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />}
              </div>
              <span className="tracking-[0.2em] uppercase">{isPrinting ? 'GENERATING...' : 'Print Bill'}</span>
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing || isPrinting}
              className={`flex-1 ${isSharing ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 dark:bg-emerald-600'} text-white p-6 rounded-3xl flex items-center justify-center gap-4 text-xs font-black shadow-2xl shadow-slate-200 dark:shadow-emerald-950/40 hover:bg-black dark:hover:bg-emerald-500 active:scale-[0.98] transition-all group`}
            >
              <div className="bg-white/10 p-2.5 rounded-xl group-hover:bg-white/20 transition-colors">
                {isSharing ? (
                  <Loader2 className="w-5 h-5 text-emerald-100 animate-spin" />
                ) : (
                  <Share2 className="w-5 h-5 text-emerald-100 group-hover:text-white transition-colors" />
                )}
              </div>
              <span className="tracking-[0.2em] uppercase">
                {isSharing ? 'GENERATING...' : 'Share on WhatsApp'}
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar: Invoice List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden sticky top-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
              <div className="w-2 h-6 bg-slate-800 dark:bg-emerald-500 rounded-full" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Past Bills</h3>
            </div>

            <div className="max-h-[600px] overflow-y-auto p-3 space-y-2">
              {invoices.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8 font-medium">No history available</p>
              ) : invoices.map((inv) => {
                const invShop = shops.find(s => s.id === inv.shopId);
                const isSelected = selectedInvoiceId === inv.id;

                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    className={`w-full text-left p-4 rounded-xl flex justify-between items-center transition-all duration-200 active:scale-[0.98] ${isSelected
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 drop-shadow-sm hover:drop-shadow dark:hover:shadow-black/20'
                      }`}
                  >
                    <div className="flex-1 truncate pr-3">
                      <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                        {invShop?.name || 'Unknown Shop'}
                      </p>
                      <p className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-slate-400 dark:text-emerald-100/60' : 'text-slate-400 dark:text-slate-500'}`}>
                        {new Date(inv.issuedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm ${isSelected ? 'text-emerald-400 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                        Rs. {inv.totalAmount.toLocaleString()}
                      </p>
                      <p className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-slate-500 dark:text-emerald-200/40' : 'text-slate-400 dark:text-slate-500'}`}>
                        {inv.units} units
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceView;
