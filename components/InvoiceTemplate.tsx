import React, { useState } from "react";
import {
  Zap,
  Store,
  MapPin,
  Cpu,
  CheckCircle2,
  Printer,
  Share2,
  LayoutDashboard,
  X,
} from "lucide-react";
import { Shop, MeterReading, Invoice, Meter } from "../types";

interface Props {
  invoice: Invoice;
  shop: Shop | null;
  meter: Meter | null;
  reading: MeterReading | null;
  invoiceRef?: React.RefObject<HTMLDivElement>;
  variant?: 'minimalist' | 'dashboard';
}

const LedgerInvoicePage: React.FC<Props> = ({
  invoice,
  shop,
  meter,
  reading,
  invoiceRef,
  variant = 'minimalist',
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const openingReading =
    reading?.previousReadingValue ??
    (reading?.readingValue ?? 0) - invoice.units;

  return (
    <>
      
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ================= LEFT SIDE (INVOICE) ================= */}
          <div ref={invoiceRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden text-sm">

            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-emerald-500">
                  <Zap className="w-5 h-5" />
                  <h1 className="font-bold text-lg text-slate-900 dark:text-white">
                    MeraMeter
                  </h1>
                </div>
                <p className="text-xs text-slate-400">
                  Digital Utility Ledger
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase text-slate-400 font-semibold">
                  Invoice
                </p>
                <p className="font-mono font-bold text-slate-900 dark:text-white">
                  #{invoice.id.slice(0, 10).toUpperCase()}
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    invoice.paidStatus
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {invoice.paidStatus ? "Paid" : "Unpaid"}
                </span>
              </div>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-6">

              {/* INFO GRID */}
              <div className="grid sm:grid-cols-2 gap-6">

                {/* CONSUMER */}
                <div>
                  <p className="text-xs uppercase text-slate-400 font-semibold mb-3">
                    Consumer
                  </p>

                  <div className="flex items-center gap-3">
                    {shop?.customerImage ? (
                      <img
                        src={shop.customerImage}
                        alt=""
                        className="w-12 h-12 rounded-md object-cover border cursor-pointer"
                        onClick={() =>
                          setPreviewImage(shop.customerImage)
                        }
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Store className="w-5 h-5 text-slate-400" />
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {shop?.name || "N/A"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {shop?.ownerName}
                      </p>
                      <p className="text-xs text-slate-400">
                        Shop {shop?.shopNumber || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {shop?.address}
                  </div>
                </div>

                {/* BILLING */}
                <div>
                  <p className="text-xs uppercase text-slate-400 font-semibold mb-3">
                    Billing Info
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Billing Cycle</span>
                      <span>{invoice.billingPeriod || "Standard"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Issued</span>
                      <span>
                        {new Date(
                          invoice.issuedDate
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Meter ID</span>
                      <span className="flex items-center gap-1 font-mono text-xs">
                        <Cpu className="w-3 h-3" />
                        {meter?.serialNumber || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONSUMPTION */}
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-3">
                  Consumption
                </p>

                <div className="grid grid-cols-3 text-center border rounded-md overflow-hidden text-sm">
                  <div className="p-3 border-r dark:border-slate-700">
                    <p className="text-xs text-slate-400">Opening</p>
                    <p className="font-semibold">
                      {openingReading.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-3 border-r dark:border-slate-700">
                    <p className="text-xs text-slate-400">Closing</p>
                    <p className="font-semibold">
                      {reading?.readingValue?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="p-3">
                    <p className="text-xs text-emerald-500">Units</p>
                    <p className="font-bold text-emerald-600">
                      {invoice.units.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* FINANCIAL */}
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-3">
                  Financial
                </p>

                <div className="border rounded-md p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Charges</span>
                    <span>
                      Rs. {invoice.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="border-t pt-2 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>
                      Rs. {invoice.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* IMAGE */}
              {reading?.photoUrl && (
                <div>
                  <p className="text-xs uppercase text-slate-400 font-semibold mb-2">
                    Meter Image
                  </p>
                  <img
                    src={reading.photoUrl}
                    alt="Meter"
                    onClick={() =>
                      setPreviewImage(reading.photoUrl)
                    }
                    className="w-full max-h-56 object-cover rounded-md border cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t px-6 py-3 flex justify-between text-xs text-slate-500">
              <span>
                Ref: MM-{invoice.id.slice(0, 8).toUpperCase()}
              </span>

              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </div>
            </div>
          </div>

          
        </div>
      

      {/* IMAGE MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl w-full">
            <button
              className="absolute -top-10 right-0 text-white"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={previewImage}
              alt="Preview"
              className="w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default LedgerInvoicePage;