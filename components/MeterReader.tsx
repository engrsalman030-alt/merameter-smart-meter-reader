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
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { analyzeMeterImage } from '../services/aiService';
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
      const result = await analyzeMeterImage(img, knownSerials);
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
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 p-4">
      <input
        autoFocus
        className="w-full p-3 mb-4 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-xl outline-none"
        placeholder="Search shop..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-100px)] pr-2">
        {filteredShops.map(s => (
          <button
            key={s.id}
            onClick={() => {
              setManualShopId(s.id);
              setIsSelectingShop(false);
            }}
            className="w-full p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-left hover:border-emerald-500 transition-all"
          >
            <p className="font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{s.ownerName}</p>
          </button>
        ))}
      </div>
    </div>
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
    <div className="p-4 md:p-8 min-h-screen flex flex-col items-center justify-center gap-6">
      <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange} />
      <canvas ref={canvasRef} hidden />

      {isSelectingShop && <ShopSelectionList />}

      {!stream && !capturedImage && (
        <div className="w-full max-w-sm flex flex-col gap-4">
          <button
            onClick={startCamera}
            className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold shadow-lg hover:scale-105 transition-transform active:scale-95"
          >
            <Camera className="w-5 h-5" />
            <span className="text-lg">Scan Meter</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-100 text-slate-700 font-bold shadow-md hover:bg-slate-200 transition-colors active:scale-95"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-lg">Pick Gallery</span>
          </button>
        </div>
      )}

      {stream && (
        <div className="w-full max-w-sm flex flex-col gap-4">
          <video ref={videoRef} autoPlay playsInline className="rounded-2xl" />
          <button onClick={capturePhoto} className="py-4 rounded-2xl bg-emerald-600 text-white font-black">
            Take Photo
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex gap-2 text-emerald-600 font-bold">
          <Loader2 className="animate-spin" /> Checking Image...
        </div>
      )}

      {analysisResult && (
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-950/20 rounded-bl-[5rem] -mr-10 -mt-10 opacity-40 pointer-events-none" />

          <div className="relative">
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] mb-4">Reading Check</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-6">Confirm Data</h3>

            <div className="space-y-4">
              {/* Unit Association */}
              {finalShop && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                  <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-black text-slate-800 dark:text-white truncate">{finalShop.name}</p>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group focus-within:border-emerald-500 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Meter ID (Serial)</p>
                  <Pencil className="w-3 h-3 text-slate-300 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="text"
                  className="w-full bg-transparent font-black text-slate-800 dark:text-white font-mono tracking-wider outline-none text-sm"
                  value={analysisResult.serialNumber}
                  onChange={e => setAnalysisResult({ ...analysisResult, serialNumber: e.target.value })}
                />
              </div>

              {/* Reading Comparison Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Previous</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-lg font-black text-slate-400 dark:text-slate-500 tracking-tighter">{finalMeter?.lastReading || 0}</p>
                    <span className="text-[8px] text-slate-300 uppercase font-black">kWh</span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group focus-within:border-emerald-500 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Current</p>
                    <Pencil className="w-3 h-3 text-slate-300 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      step="0.1"
                      className="w-full bg-transparent font-black text-slate-800 dark:text-white tracking-tighter outline-none text-lg"
                      value={analysisResult.readingValue}
                      onChange={e => setAnalysisResult({ ...analysisResult, readingValue: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase font-bold">kWh</span>
                  </div>
                </div>
              </div>

              {/* Consumed Units Display */}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-2xl border-2 border-emerald-100 dark:border-emerald-800/30 group focus-within:border-emerald-500 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Consumed Units</p>
                  <Pencil className="w-3 h-3 text-emerald-300 dark:text-emerald-600 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    step="1"
                    className="w-full bg-transparent font-black text-emerald-900 dark:text-emerald-300 tracking-tighter outline-none text-2xl"
                    value={manualUnits !== null ? manualUnits : billingStats?.units}
                    onChange={e => setManualUnits(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-500 uppercase font-black">Units</span>
                </div>
              </div>
            </div>

            {/* Price Preview */}
            <div className="mt-6 bg-slate-900 dark:bg-emerald-600 rounded-3xl p-6 flex items-center justify-between shadow-xl shadow-slate-200 dark:shadow-emerald-950/40">
              <div>
                <p className="text-[10px] font-black text-emerald-400 dark:text-emerald-100 uppercase tracking-widest mb-1">Total Bill Amount</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-emerald-300 dark:text-emerald-200">Rs.</span>
                  <p className="text-3xl font-black text-white tracking-tighter">{billingStats?.amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 dark:text-emerald-200/60 uppercase">Rate</p>
                <p className="text-xs font-black text-white">@{ratePerUnit}</p>
              </div>
            </div>

            {finalShop ? (
              <div className="mt-8">
                <button
                  onClick={handleConfirm}
                  className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Check className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
                  <span>Approve & Generate Bill</span>
                </button>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/40 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-red-700 dark:text-red-400 leading-relaxed">No matching shop found for this serial number. Please search and select the shop manually.</p>
              </div>
            )}

            <button
              onClick={() => setIsSelectingShop(true)}
              className="w-full py-4 text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            >
              Select Shop Manually
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-shake">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">{error}</p>
          <button onClick={reset} className="ml-auto p-2 hover:bg-red-100 rounded-lg transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MeterReader;
