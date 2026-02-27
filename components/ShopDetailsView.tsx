import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Shop, Meter, MeterReading } from '../types';

interface Props {
  shop: Shop;
  meter?: Meter;
  readings?: MeterReading[];
  onClose: () => void;
}

const ShopDetailsView: React.FC<Props> = ({
  shop,
  meter,
  readings = [],
  onClose,
}) => {
  const [expanded, setExpanded] = useState(false);

  /* ================= DATA ================= */

  const meterReadings = useMemo(() => {
    if (!meter?.id) return [];
    return readings
      .filter(r => r.meterId === meter.id)
      .sort(
        (a, b) =>
          new Date(b.readingDate || '').getTime() -
          new Date(a.readingDate || '').getTime()
      );
  }, [readings, meter?.id]);

  // If collapsed, show first 8; else show all
  const visibleReadings = expanded ? meterReadings : meterReadings.slice(0, 8);

  const billingRate = useMemo(() => {
    const stored = localStorage.getItem('billingRate');
    const parsed = stored ? parseFloat(stored) : 30;
    return isNaN(parsed) ? 30 : parsed;
  }, []);

  const latest = meterReadings[0];

  const consumption = latest
    ? Math.max(
        0,
        (latest.readingValue ?? 0) - (latest.previousReadingValue ?? 0)
      )
    : 0;

  const total = consumption * billingRate;

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-xl flex items-center justify-center p-8">
      <div className="w-full max-w-5xl max-h-[94vh] bg-white dark:bg-neutral-950 rounded-[30px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center px-12 py-8 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {shop.name}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Shop #{shop.shopNumber} • Since{' '}
              {new Date(shop.registrationDate).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-12 py-12 space-y-16">

          {/* ================= 1️⃣ PROFILE + DETAILS ================= */}
          <div className="grid md:grid-cols-3 gap-12 items-start">

            {/* Image */}
            <div className="flex flex-col items-center text-center">
              <div className="w-40 h-40 rounded-3xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                {shop.customerImage ? (
                  <img
                    src={shop.customerImage}
                    alt="Owner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
                    No Image
                  </div>
                )}
              </div>

              <h3 className="mt-6 text-lg font-semibold">
                {shop.ownerName}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                {shop.phone}
              </p>
            </div>

            {/* Details */}
            <div className="md:col-span-2 space-y-5 text-sm">
              <Detail label="CNIC" value={shop.cnic} />
              <Detail label="Address" value={shop.address} />
              <Detail label="Meter Serial" value={meter?.serialNumber} />
              <Detail
                label="Install Date"
                value={
                  meter?.installDate
                    ? new Date(meter.installDate).toLocaleDateString()
                    : '-'
                }
              />
              <Detail
                label="Current Reading"
                value={`${meter?.lastReading ?? 0} kWh`}
              />
            </div>
          </div>

          {/* ================= 2️⃣ BILLING HERO ================= */}
          <div className="rounded-[32px] p-12 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 border border-neutral-200 dark:border-neutral-800">

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Current Bill
                </p>
                <h3 className="text-5xl font-bold mt-4 text-neutral-900 dark:text-white">
                  Rs. {total.toLocaleString()}
                </h3>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Consumption
                </p>
                <p className="text-xl font-semibold mt-3">
                  {consumption} kWh
                </p>
              </div>
            </div>

            <div className="mt-10 flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
              <span>Billing Rate</span>
              <span className="font-semibold">
                Rs. {billingRate} / kWh
              </span>
            </div>
          </div>

          {/* ================= 3️⃣ READING HISTORY ================= */}
          {meterReadings.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  Reading History
                </h4>

                {meterReadings.length > 8 && (
                  <button
                    onClick={() => setExpanded(prev => !prev)}
                    className="text-sm font-medium text-neutral-600 hover:text-black dark:hover:text-white transition"
                  >
                    {expanded ? 'Collapse' : 'View All'}
                  </button>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl">
                <table className="w-full text-sm">
                  <thead className="text-neutral-500 uppercase text-xs tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="py-5 text-left">#</th> {/* Serial Number */}
                      <th className="py-5 text-left">Meter Serial No</th>
                      <th className="py-5 text-left">Date</th>
                      <th className="py-5 text-left">Previous</th>
                      <th className="py-5 text-left">Current</th>
                      <th className="py-5 text-left">Consumed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleReadings.map((reading, idx) => {
                      const globalIndex = meterReadings.indexOf(reading) + 1; // continuous serial
                      const used = Math.max(
                        0,
                        (reading.readingValue ?? 0) - (reading.previousReadingValue ?? 0)
                      );
                      return (
                        <tr
                          key={reading.id}
                          className="border-b border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition"
                        >
                          <td>{globalIndex}</td>
                          <td>{meter?.serialNumber ?? '-'}</td>
                          <td className="py-6">
                            {new Date(reading.readingDate || '').toLocaleDateString()}
                          </td>
                          <td>{reading.previousReadingValue ?? 0}</td>
                          <td className="font-semibold">{reading.readingValue}</td>
                          <td>{used} kWh</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* Small reusable row */
const Detail = ({ label, value }: any) => (
  <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
    <span className="text-neutral-500">{label}</span>
    <span className="font-medium max-w-[60%] text-right break-words">
      {value ?? '-'}
    </span>
  </div>
);

export default ShopDetailsView;