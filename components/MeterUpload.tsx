import React, { useState, useRef } from 'react';
import { analyzeMeterImage } from '../services/aiService';
import { Image as ImageIcon, AlertCircle, Loader2, CheckCircle2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OCRResult {
  readingValue: number;
  consumedUnits?: number;
  serialNumber: string;
  confidence: number;
  ocrText?: string;
}

export default function MeterUpload() {
  const [result, setResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await analyzeMeterImage(base64);
        setResult(res); // this is the key state your app needs
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Analysis failed');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const printInvoice = (data: OCRResult | null) => {
    if (!data) return;

    const units = data.consumedUnits ?? data.readingValue;
    const ratePerUnit = parseFloat(localStorage.getItem('billingRate') || '10');
    const amount = units * ratePerUnit;

    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h2 { text-align: center; margin-bottom: 30px; color: #1e293b; font-size: 24px; }
            .line { display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
            .line span { font-weight: 500; }
            .line span:first-child { color: #64748b; }
            .line span:last-child { color: #1e293b; font-weight: 600; }
            hr { border: none; border-top: 2px solid #e2e8f0; margin: 20px 0; }
            .total { font-weight: bold; padding-top: 12px; }
            .total span:last-child { font-size: 18px; color: #059669; }
            .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px; }
            .header { text-align: center; margin-bottom: 30px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">MeraMeter Smart Meter Reader</p>
            </div>
            <h2>Electricity Bill</h2>
            <div class="line"><span>Date:</span><span>${new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
            <div class="line"><span>Serial Number:</span><span>${data.serialNumber}</span></div>
            <hr />
            <div class="line"><span>Units Consumed:</span><span>${units} kWh</span></div>
            <div class="line"><span>Rate per Unit:</span><span>Rs. ${ratePerUnit.toFixed(2)}</span></div>
            <div class="line total"><span>Total Amount:</span><span>Rs. ${(amount).toLocaleString('en-PK', { maximumFractionDigits: 2 })}</span></div>
            <hr />
            <div class="footer">
              <p>Computer generated invoice. No signature required.</p>
              <p style="margin: 5px 0 0 0;">Thank you for using MeraMeter</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8 font-sans transition-colors duration-300">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Upload Meter Image
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium">
            Analyze meter readings instantly
          </p>
        </motion.div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 md:p-12 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-500/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative flex flex-col items-center gap-4">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                  Select Meter Image
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Click to browse or drag and drop your meter photo
                </p>
              </div>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={loading}
          />
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-3 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Analyzing meter image…
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800/50"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="relative"
            >
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-2xl opacity-40 pointer-events-none" />
              
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-black/30 border border-slate-100 dark:border-slate-800 p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Analysis Result</h2>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">Meter data extracted successfully</p>
                  </div>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Serial Number */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Serial Number</p>
                      <button
                        onClick={() => copyToClipboard(result.serialNumber)}
                        className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400 hover:text-emerald-600" />
                        )}
                      </button>
                    </div>
                    <p className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-widest">
                      {result.serialNumber}
                    </p>
                  </div>

                  {/* Reading */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Current Reading</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-emerald-900 dark:text-emerald-300">
                        {result.readingValue}
                      </p>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">kWh</span>
                    </div>
                  </div>

                  {/* Consumed Units */}
                  {result.consumedUnits !== undefined && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/30">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Consumed Units</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-blue-900 dark:text-blue-300">
                          {result.consumedUnits}
                        </p>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">Units</span>
                      </div>
                    </div>
                  )}

                  {/* Confidence */}
                  {result.confidence !== undefined && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Confidence Level</p>
                      <div className="space-y-2">
                        <p className="text-2xl font-black text-amber-900 dark:text-amber-300">
                          {result.confidence}%
                        </p>
                        <div className="w-full h-2 bg-amber-200 dark:bg-amber-900/30 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.confidence}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detected Text */}
                  {result.ocrText && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Detected Text</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-900 p-3 rounded-lg text-xs">
                        {result.ocrText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => printInvoice(result)}
                    className="flex-1 py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-black dark:hover:bg-slate-100 active:scale-95 transition-all shadow-lg shadow-slate-900/20 dark:shadow-white/20"
                  >
                    Print Invoice
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setError(null);
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 py-3 px-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all"
                  >
                    Analyze Another
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!result && !loading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto mt-12 text-center"
        >
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              📷 Upload a meter image to get started
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
