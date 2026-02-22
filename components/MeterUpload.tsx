import React from 'react';
import { analyzeMeterImage, OCRResult } from '../services/aiService';
import { useState, useRef } from 'react';
import { Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';

export default function MeterUpload() {
  const [result, setResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const printInvoice = (data: OCRResult | null) => {
    if (!data) return;

    const units = data.consumedUnits ?? data.readingValue;
    const ratePerUnit = 10; // your rate per kWh
    const amount = units * ratePerUnit;

    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            .line { display: flex; justify-content: space-between; margin-bottom: 8px; }
            hr { margin: 12px 0; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Electricity Bill</h2>
          <div class="line"><span>Date:</span><span>${new Date().toLocaleDateString()}</span></div>
          <div class="line"><span>Serial Number:</span><span>${data.serialNumber}</span></div>
          <hr />
          <div class="line"><span>Units Consumed:</span><span>${units} kWh</span></div>
          <div class="line"><span>Rate per Unit:</span><span>Rs. ${ratePerUnit}</span></div>
          <div class="line total"><span>Total Amount:</span><span>Rs. ${amount}</span></div>
          <hr />
          <p style="text-align:center; font-size: 12px;">Computer generated invoice.</p>
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
    <div className="max-w-md mx-auto p-6 flex flex-col items-center gap-6">
      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-100 text-slate-700 font-bold shadow-md hover:bg-slate-200"
      >
        <ImageIcon className="w-5 h-5" />
        <span>Select Meter Image</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-emerald-600 font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Analyzing meter image…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="w-full bg-white rounded-2xl shadow-lg p-6 space-y-3 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Meter Reading Result</h2>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-600">Serial Number:</span>
            <span className="text-slate-900 font-bold">{result.serialNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-600">Reading:</span>
            <span className="text-slate-900 font-bold">{result.readingValue} kWh</span>
          </div>
          {result.consumedUnits !== undefined && (
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Consumed Units:</span>
              <span className="text-slate-900 font-bold">{result.consumedUnits}</span>
            </div>
          )}
          {result.confidence !== undefined && (
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Confidence:</span>
              <span className="text-slate-900 font-bold">{result.confidence}%</span>
            </div>
          )}
          {result.ocrText && (
            <div>
              <span className="font-semibold text-slate-600">Detected Text:</span>
              <p className="text-slate-800 mt-1">{result.ocrText}</p>
            </div>
          )}

          {/* Print Invoice Button */}
          <button
            onClick={() => printInvoice(result)}
            className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Print Invoice
          </button>
        </div>
      )}
    </div>
  );
}
