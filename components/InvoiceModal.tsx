import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Printer, Share2, CheckCircle2, X, Trash2 } from "lucide-react";
import * as htmlToImage from "html-to-image";
import InvoiceTemplate from "./InvoiceTemplate";
import { Shop, MeterReading, Invoice, Meter } from "../types";

interface Props {
  invoice: Invoice;
  shop: Shop | null;
  meter: Meter | null;
  reading: MeterReading | null;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  togglePaidStatus: (inv: Invoice) => Promise<void>;
  onDeleteConfirm: () => Promise<void>;
  initialVariant?: "minimalist" | "dashboard";
}

const InvoiceModal: React.FC<Props> = ({
  invoice,
  shop,
  meter,
  reading,
  onClose,
  onRefresh,
  togglePaidStatus,
  onDeleteConfirm,
  initialVariant = "minimalist",
}) => {
  const modalRoot = document.body;
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const printInvoice = async () => {
    if (!printRef.current) return;
    setIsPrinting(true);
    try {
      const dataUrl = await htmlToImage.toPng(printRef.current, {
        backgroundColor: initialVariant === "dashboard" ? "#f8fafc" : "#ffffff",
        pixelRatio: 3,
      });

      const printContainer = document.getElementById("image-print-container");
      if (printContainer) {
        const img = new Image();
        img.src = dataUrl;
        img.style.width = "100%";
        img.onload = () => {
          printContainer.innerHTML = "";
          printContainer.appendChild(img);
          setTimeout(() => {
            try {
              window.print();
            } finally {
              setIsPrinting(false);
              setTimeout(() => {
                printContainer.innerHTML = "";
              }, 500);
            }
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
          console.warn('Unable to open print window.');
        }
      }
    } catch (err) {
      console.error("Print failed", err);
      setIsPrinting(false);
    }
  };

  const exportImage = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const blob = await htmlToImage.toBlob(printRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      if (!blob) throw new Error("Generation failed");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `MeraMeter-Invoice-${invoice.id.slice(0, 8)}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    await onDeleteConfirm();
    onClose();
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4">
      <div   className="absolute inset-0 bg-black/50 backdrop-blur-sm"    onClick={onClose} />

      <div
        id="invoice-modal"
        className="relative max-w-4xl w-full mx-auto bg-transparent flex"
      >
        {/* Modal Content */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg">
          <InvoiceTemplate
            invoice={invoice}
            shop={shop}
            meter={meter}
            reading={reading}
            invoiceRef={printRef}
            variant={initialVariant}
          />
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-col gap-3 ml-4 sticky top-4 self-start no-print">
          <button
            onClick={printInvoice}
            className="px-3 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 text-sm"
            disabled={isPrinting}
          >
            <Printer className="w-4 h-4" />
            <span>{isPrinting ? "Printing..." : "Print"}</span>
          </button>

          <button
            onClick={exportImage}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm"
            disabled={isExporting}
          >
            <Share2 className="w-4 h-4" />
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </button>

          <button
            onClick={() => togglePaidStatus(invoice)}
            className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Toggle Paid</span>
          </button>

          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-sm flex items-center gap-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, modalRoot);
};

export default InvoiceModal;
