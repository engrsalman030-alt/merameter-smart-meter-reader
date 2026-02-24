import React, { useState, useRef } from 'react';
import {
    Camera,
    Upload,
    CheckCircle2,
    Zap,
    RefreshCw,
    ChevronDown,
    ArrowRight,
    Download,
    FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shop, MeterReading, Invoice, Meter } from '../types';
import { useToast } from './Toast';
import InvoiceTemplate from './InvoiceTemplate';
import { toPng } from 'html-to-image';
import { hybridService } from '../../../../services/hybridService';

interface Props {
    shops: Shop[];
    onReadingCaptured: () => Promise<void>;
    meters: Meter[];
    ratePerUnit: number;
}

const MeterReader: React.FC<Props> = ({ shops, onReadingCaptured, meters, ratePerUnit }) => {
    const { showToast } = useToast();
    const [step, setStep] = useState<'upload' | 'analyzing' | 'confirm' | 'invoice'>('upload');
    const [image, setImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{
        reading: number;
        serialNumber: string;
        confidence: number;
        billingPeriod?: string;
    } | null>(null);

    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [matchedMeter, setMatchedMeter] = useState<Meter | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
    const [generatedReading, setGeneratedReading] = useState<MeterReading | null>(null);

    const invoiceRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64Image = ev.target?.result as string;
            setImage(base64Image);
            startAnalysis(base64Image);
        };
        reader.readAsDataURL(file);
    };

    const startAnalysis = async (img: string) => {
        setStep('analyzing');
        try {
            const knownSerials = meters.map(m => m.serialNumber);
            // Unified scanning via hybridService
            const result = await hybridService.analyzeImage(img, knownSerials);

            if (result) {
                // Map local OCR or Gemini result to local state
                const mappedResult = {
                    reading: result.readingValue ?? 0,
                    serialNumber: result.serialNumber || 'UNKNOWN',
                    confidence: (result.confidence || 0) * 100,
                    billingPeriod: result.explanation // Using explanation as a fallback for metadata
                };
                setAnalysisResult(mappedResult);
                setStep('confirm');

                if (mappedResult.serialNumber) {
                    const meter = meters.find(m => m.serialNumber === mappedResult.serialNumber);
                    if (meter) {
                        setMatchedMeter(meter);
                        const shop = shops.find(s => s.id === meter.shopId);
                        if (shop) setSelectedShop(shop);
                    }
                }
            } else {
                throw new Error("Could not extract data from image");
            }
        } catch (err) {
            console.error('AI Analysis Error:', err);
            showToast('AI Analysis failed. Please try again.', 'error');
            setStep('upload');
        }
    };

    const handleConfirm = async () => {
        if (!selectedShop || !analysisResult) {
            showToast('Please select a shop first', 'warning');
            return;
        }

        setIsProcessing(true);
        try {
            const readingValue = analysisResult.reading;
            // MATCHED API NAME: getLatestReading
            const previousReadingData = await window.electronAPI.getLatestReading(selectedShop.id);
            const prevVal = previousReadingData ? previousReadingData.readingValue : 0;

            const units = Math.max(0, readingValue - prevVal);
            const totalAmount = units * ratePerUnit;

            const readingData: any = {
                id: `reading_${Date.now()}`,
                shopId: selectedShop.id,
                meterId: matchedMeter?.id || (meters.find(m => m.shopId === selectedShop.id)?.id) || 'manual',
                readingValue,
                previousReadingValue: prevVal,
                readingDate: new Date().toISOString(),
                photoUrl: image || '',
                confidence: analysisResult.confidence,
            };

            const invoiceData: any = {
                id: `inv_${Date.now()}`,
                readingId: readingData.id,
                shopId: selectedShop.id,
                units,
                ratePerUnit,
                totalAmount,
                paidStatus: false,
                issuedDate: new Date().toISOString(),
                billingPeriod: analysisResult.billingPeriod || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            };

            const meterUpdate = {
                id: readingData.meterId,
                lastReading: readingValue
            };

            // MATCHED API NAME: addReadingAndInvoice
            const result = await window.electronAPI.addReadingAndInvoice({ reading: readingData, invoice: invoiceData, meterUpdate });

            if (result.reading && result.invoice) {
                setGeneratedInvoice(result.invoice);
                setGeneratedReading(result.reading);
                setStep('invoice');
                showToast('Reading committed and bill generated!', 'success');
                await onReadingCaptured();
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to save reading', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadInvoice = async () => {
        if (!invoiceRef.current) return;
        try {
            const dataUrl = await toPng(invoiceRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `MeraMeter-Invoice-${generatedInvoice?.id.slice(0, 8)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            showToast('Failed to generate image', 'error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            <AnimatePresence mode="wait">
                {step === 'upload' && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Matrix AI Scanner</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Neural Vision Protocol v2.0</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative flex flex-col items-center justify-center h-80 bg-white dark:bg-slate-900 rounded-[2.5rem] border-4 border-dashed border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xl overflow-hidden"
                            >
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl group-hover:scale-110 transition-transform">
                                    <Upload className="w-10 h-10 text-emerald-600" />
                                </div>
                                <p className="mt-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Import Scan</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>

                            <div
                                className="group relative flex flex-col items-center justify-center h-80 bg-slate-950 rounded-[2.5rem] border-4 border-slate-900 hover:border-emerald-500 transition-all cursor-pointer shadow-xl overflow-hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-transparent opacity-50" />
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl group-hover:bg-emerald-500 transition-all">
                                        <Camera className="w-10 h-10 text-white" />
                                    </div>
                                    <p className="mt-4 text-xs font-black text-white uppercase tracking-[0.2em]">Hardware Camera</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'analyzing' && (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-24 space-y-8"
                    >
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-emerald-500/20 rounded-full animate-ping absolute inset-0" />
                            <div className="w-24 h-24 border-t-4 border-emerald-500 rounded-full animate-spin" />
                            <Zap className="w-8 h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] animate-pulse">Decrypting Matrix...</h3>
                        </div>
                    </motion.div>
                )}

                {step === 'confirm' && analysisResult && (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                                <div className="flex-1 p-8 md:p-12 space-y-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Extraction Success</p>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Review Results</h3>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units Identified</span>
                                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{analysisResult.reading} <span className="text-xs uppercase">kWh</span></span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Index</span>
                                            <span className="text-sm font-black text-emerald-500">{analysisResult.confidence}%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-left">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Destination</label>
                                        <div className="relative">
                                            <select
                                                value={selectedShop?.id || ''}
                                                onChange={(e) => {
                                                    const shop = shops.find(s => s.id === e.target.value);
                                                    setSelectedShop(shop || null);
                                                }}
                                                className="w-full h-16 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-6 font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                                            >
                                                <option value="">Select Entity</option>
                                                {shops.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} (Shop {s.shopNumber})</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep('upload')}
                                            className="flex-1 h-16 font-black text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={isProcessing || !selectedShop}
                                            className="flex-[2] h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white transition-all transform active:scale-95 disabled:grayscale"
                                        >
                                            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Commit Reading'}
                                        </button>
                                    </div>
                                </div>

                                <div className="h-64 md:h-auto md:w-80 group relative overflow-hidden">
                                    <img src={image!} alt="Evidence" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'invoice' && generatedInvoice && (
                    <motion.div
                        key="invoice"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-500/10">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Entry Serialized</span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Billing Artifact Generated</h2>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-10 items-start">
                            <div className="w-full lg:flex-1 shadow-2xl rounded-[3rem] overflow-hidden">
                                <InvoiceTemplate
                                    invoice={generatedInvoice}
                                    shop={selectedShop}
                                    reading={generatedReading}
                                    meter={matchedMeter}
                                    invoiceRef={invoiceRef}
                                    variant="dashboard"
                                />
                            </div>

                            <div className="w-full lg:w-72 space-y-4">
                                <button
                                    onClick={handleDownloadInvoice}
                                    className="w-full h-16 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-emerald-500 transition-all flex items-center justify-center gap-3"
                                >
                                    <Download className="w-5 h-5 text-emerald-500" />
                                    Save as Artifact
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="w-full h-16 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-blue-500 transition-all flex items-center justify-center gap-3"
                                >
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    Direct Print
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                                <button
                                    onClick={() => {
                                        setStep('upload');
                                        setImage(null);
                                        setAnalysisResult(null);
                                        setSelectedShop(null);
                                        setMatchedMeter(null);
                                    }}
                                    className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-500 dark:hover:bg-emerald-500 dark:hover:text-white transition-all transform active:scale-95"
                                >
                                    New Cycle Scan
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MeterReader;
