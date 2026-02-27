import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Camera,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Store,
  Loader2,
  Printer,
  Share2,
  RotateCcw,
  Zap,
  CheckCircle2,
  Pencil,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as htmlToImage from 'html-to-image';
import { hybridService } from '../services/hybridService';
import { Shop, Meter, MeterReading, Invoice } from '../types';
import InvoiceTemplate from './InvoiceTemplate';

interface OCRResult {
  readingValue: number;
  consumedUnits?: number;
  serialNumber: string;
  confidence: number;
  ocrText?: string;
}

interface Props {
  onCapture: (data: {
    readingValue: number;
    consumedUnits?: number;
    serialNumber: string;
    photoUrl: string;
    confidence: number;
    manualShopId?: string;
    manualUnits?: number;
  }) => void;
  shops: Shop[];
  meters: Meter[];
  ratePerUnit: number;
  generatedInvoice?: {
    invoice: Invoice;
    shop: Shop;
    meter: Meter;
    reading: MeterReading;
  } | null;
  onClearInvoice?: () => void;
}

const MeterReader: React.FC<Props> = ({ onCapture, shops, meters, ratePerUnit, generatedInvoice, onClearInvoice }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingShop, setIsSelectingShop] = useState(false);
  const [manualShopId, setManualShopId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoConfirmTimer, setAutoConfirmTimer] = useState<number | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Helper to normalize serial numbers for robust matching
  const normalizeSerial = (serial: string) => serial.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const aiMatchedShop = useMemo(() => {
    if (!analysisResult?.serialNumber) return null;
    const normalizedAIResult = normalizeSerial(analysisResult.serialNumber);
    const meter = meters.find(
      m => normalizeSerial(m.serialNumber) === normalizedAIResult
    );
    return shops.find(s => s.meterId === meter?.id) || null;
  }, [analysisResult, shops, meters]);

  const finalShop = useMemo(() => {
    if (manualShopId) return shops.find(s => s.id === manualShopId) || null;
    return aiMatchedShop;
  }, [manualShopId, aiMatchedShop, shops]);

  const finalMeter = useMemo(() => {
    if (!finalShop) return null;
    return meters.find(m => m.id === finalShop.meterId) || null;
  }, [finalShop, meters]);

  const [manualUnits, setManualUnits] = useState<number | null>(null);

  const billingStats = useMemo(() => {
    if (!analysisResult) return null;
    const prev = finalMeter?.lastReading || 0;

    // Prioritize manualUnits, then AI-extracted consumedUnits, then calculated difference
    let units = 0;
    if (manualUnits !== null) {
      units = manualUnits;
    } else if (analysisResult.consumedUnits !== undefined && analysisResult.consumedUnits !== null) {
      units = analysisResult.consumedUnits;
    } else {
      units = Math.max(0, analysisResult.readingValue - prev);
    }

    return { units, amount: units * ratePerUnit };
  }, [analysisResult, finalMeter, ratePerUnit, manualUnits]);

  useEffect(() => {
    // Reset manual units when a new analysis comes in
    setManualUnits(null);
  }, [analysisResult]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setError(null);
    } catch {
      setError('Camera access denied');
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    const img = canvasRef.current.toDataURL('image/jpeg', 0.8);
    setCapturedImage(img);
    stopCamera();
    handleAnalysis(img);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setCapturedImage(result);
      handleAnalysis(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalysis = async (img: string) => {
    setIsAnalyzing(true);
    setError(null);
    setManualShopId(null);
    setAnalysisResult(null);

    try {
      const knownSerials = meters.map(m => m.serialNumber);
      const result = await hybridService.analyzeImage(img, knownSerials);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'AI analysis failed. Please retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (!analysisResult || !capturedImage || !finalShop) return;

    onCapture({
      ...analysisResult,
      photoUrl: capturedImage,
      manualShopId: finalShop.id,
      manualUnits: manualUnits !== null ? manualUnits : (billingStats?.units || 0),
    });

    reset();
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setError(null);
    setManualShopId(null);
    setIsSelectingShop(false);
    setAutoConfirmTimer(null);
  };

  const filteredShops = shops.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ShopSelectionList = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-white dark:bg-slate-900 z-50 p-4 md:p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Select Shop</h2>
        <button
          onClick={() => setIsSelectingShop(false)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>
      <input
        autoFocus
        className="w-full p-4 mb-6 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-2xl outline-none text-sm font-medium border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
        placeholder="Search by shop name or owner…"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
        {filteredShops.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="font-medium">No shops found</p>
          </div>
        ) : (
          filteredShops.map((s, idx) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                setManualShopId(s.id);
                setIsSelectingShop(false);
                setSearchQuery('');
              }}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-left hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700/50 transition-all active:scale-95 group"
            >
              <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{s.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">👤 {s.ownerName}</p>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );

  const handlePrintInvoice = async () => {
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
      alert("Error: Print failed.");
    }
  };

  const handleShare = async () => {
    if (!generatedInvoice || !invoiceRef.current) return;
    const { shop } = generatedInvoice;

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
      link.download = `MeraMeter-Professional-Bill.png`;
      link.click();

      try {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
      } catch (e) { }

      alert("✓ PROFESSIONAL FORM GENERATED!\n\n1. Check your Downloads.\n2. WhatsApp Web is opening.\n3. DRAG THE IMAGE from Downloads into the chat box.");
      window.open('https://web.whatsapp.com/', '_blank');

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Share failed", err);
      alert("Error generating professional form.");
    } finally {
      setIsSharing(false);
    }
  };

  // If a generated invoice is present, show the invoice view
  if (generatedInvoice) {
    const { invoice, shop, meter, reading } = generatedInvoice;

    return (
      <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
        <div className="max-w-lg mx-auto space-y-8">
          <InvoiceTemplate
            invoice={invoice}
            shop={shop}
            meter={meter}
            reading={reading}
            invoiceRef={invoiceRef}
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full no-print">
            <button
              onClick={handlePrintInvoice}
              disabled={isPrinting || isSharing}
              className={`flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all ${isPrinting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5 text-slate-400" />}
              <span>{isPrinting ? 'GENERATING...' : 'PRINT BILL'}</span>
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing || isPrinting}
              className={`flex-1 ${isSharing ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#25D366]'} text-white p-5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black shadow-xl shadow-green-100 hover:bg-[#20BD5A] active:scale-95 transition-all outline-none`}
            >
              {isSharing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
              <span>{isSharing ? 'GENERATING...' : 'SHARE ON WHATSAPP'}</span>
            </button>
          </div>
          <div className="mt-4 no-print">
            <button
              onClick={onClearInvoice}
              className="w-full bg-slate-800 dark:bg-slate-800 text-white p-5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black shadow-lg dark:shadow-black/20 hover:bg-slate-900 dark:hover:bg-slate-700 active:scale-95 transition-all border border-slate-700 dark:border-slate-700"
            >
              <RotateCcw className="w-5 h-5" />
              <span>TAKE NEW READING</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8 font-sans transition-colors duration-300 flex flex-col items-center justify-center">
      <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange} />
      <canvas ref={canvasRef} hidden />

      <AnimatePresence>
        {isSelectingShop && <ShopSelectionList />}
      </AnimatePresence>

      {!stream && !capturedImage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-4"
        >
          <div className="text-center mb-8">
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight"
            >
              Scan Meter
            </motion.h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Capture reading using camera</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={startCamera}
            className="w-full group relative overflow-hidden py-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity duration-300" />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="relative"
            >
              <Camera className="w-6 h-6" />
            </motion.div>
            <span className="text-lg relative">Scan with Camera</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <ImageIcon className="w-6 h-6" />
            <span className="text-lg">Pick from Gallery</span>
          </motion.button>
        </motion.div>
      )}

      {stream && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md flex flex-col gap-4"
        >
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="rounded-3xl w-full shadow-2xl"
            />
            <div className="absolute inset-0 rounded-3xl border-4 border-emerald-500/30 pointer-events-none" />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={capturePhoto}
            className="py-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all"
          >
            <Camera className="w-6 h-6" />
            <span>Capture Photo</span>
          </motion.button>
          <button
            onClick={stopCamera}
            className="py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              Analyzing meter image…
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full max-w-md relative"
          >
            {/* Decorative background */}
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
            
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl dark:shadow-black/50 border border-slate-100 dark:border-slate-800 space-y-6 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Review Reading</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">Confirm before generating bill</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Shop Selection */}
                {finalShop && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                  >
                    <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Selected Shop</p>
                      <p className="font-black text-slate-900 dark:text-white truncate">{finalShop.name}</p>
                    </div>
                  </motion.div>
                )}

                {/* Serial Number */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Meter Serial Number</p>
                    <Pencil className="w-3 h-3 text-slate-300 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-transparent font-black text-slate-900 dark:text-white font-mono tracking-wider outline-none text-sm"
                    value={analysisResult.serialNumber}
                    onChange={e => setAnalysisResult({ ...analysisResult, serialNumber: e.target.value })}
                  />
                </div>

                {/* Reading Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Previous Reading</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{finalMeter?.lastReading || 0}</p>
                      <span className="text-xs text-slate-400 uppercase font-black">kWh</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Current Reading</p>
                      <Pencil className="w-3 h-3 text-slate-300 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-transparent font-black text-slate-900 dark:text-white outline-none text-2xl"
                        value={analysisResult.readingValue}
                        onChange={e => setAnalysisResult({ ...analysisResult, readingValue: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="text-xs text-slate-400 uppercase font-black">kWh</span>
                    </div>
                  </div>
                </div>

                {/* Consumed Units */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-5 rounded-2xl border-2 border-emerald-100 dark:border-emerald-800/30 group focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Consumed Units</p>
                    <Pencil className="w-3 h-3 text-emerald-300 dark:text-emerald-600 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <input
                      type="number"
                      step="1"
                      className="w-full bg-transparent font-black text-emerald-900 dark:text-emerald-300 outline-none text-3xl"
                      value={manualUnits !== null ? manualUnits : billingStats?.units}
                      onChange={e => setManualUnits(parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-xs text-emerald-600 dark:text-emerald-500 uppercase font-black">Units</span>
                  </div>
                </motion.div>
              </div>

              {/* Bill Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-emerald-600 dark:to-teal-600 rounded-3xl p-6 flex items-center justify-between shadow-xl shadow-slate-900/30 dark:shadow-emerald-950/40"
              >
                <div>
                  <p className="text-[10px] font-black text-slate-300 dark:text-emerald-100 uppercase tracking-widest mb-1">Total Bill Amount</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-slate-300 dark:text-emerald-100">Rs.</span>
                    <p className="text-3xl font-black text-white tracking-tighter">{billingStats?.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-emerald-200 uppercase">Rate</p>
                  <p className="text-lg font-black text-white">@{ratePerUnit}</p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {finalShop ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirm}
                    className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 dark:from-white dark:to-slate-100 dark:hover:from-slate-200 dark:hover:to-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all"
                  >
                    <Check className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
                    <span>Approve & Generate Bill</span>
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/40 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-red-700 dark:text-red-400 leading-relaxed">
                      No matching shop found. Please select manually below.
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={() => setIsSelectingShop(true)}
                  className="w-full py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 active:scale-[0.98] transition-all"
                >
                  {finalShop ? 'Change Shop' : 'Select Shop Manually'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-md p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={reset}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MeterReader;
