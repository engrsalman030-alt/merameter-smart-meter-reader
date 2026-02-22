// AdminDashboard.tsx
import React, { useMemo, useState } from 'react';
import {
  Users,
  Zap,
  Banknote,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Shop, MeterReading, Invoice, ReadingStatus } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  shops: Shop[];
  readings: MeterReading[];
  invoices: Invoice[];
}

const AdminDashboard: React.FC<Props> = ({ shops, readings, invoices }) => {
  const [expandShops, setExpandShops] = useState(false);

  // Totals
  const totalUnits = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.units, 0),
    [invoices]
  );
  const totalBilled = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    [invoices]
  );
  const paidCollection = useMemo(
    () => invoices.filter(inv => inv.paidStatus).reduce((sum, inv) => sum + inv.totalAmount, 0),
    [invoices]
  );
  const outstandingBalance = useMemo(
    () => totalBilled - paidCollection,
    [totalBilled, paidCollection]
  );

  return (
    <div className="p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 dark:bg-transparent min-h-screen">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Main Dashboard</h1>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Daily Overview</p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* PRIMARY STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Collection Card - Hero Style */}
        <div className="relative group lg:col-span-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2rem] shadow-2xl shadow-emerald-200/50 dark:shadow-emerald-950/40" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
          <div className="relative p-8 flex flex-col justify-between h-full min-h-[220px] space-y-4">
            <div className="flex justify-between items-start">
              <div className="bg-white/10 w-fit p-3 rounded-xl backdrop-blur-md">
                <Banknote className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.3em]">Total Billed</p>
                <p className="text-xl font-black text-white">Rs. {Math.round(totalBilled).toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em] mb-1">Amount Received</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-emerald-300">PKR</span>
                <p className="text-5xl font-black text-white tracking-tighter">
                  {Math.round(paidCollection).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="pt-2 flex justify-between items-center">
              <span className="text-[10px] font-black text-emerald-100/60 uppercase tracking-widest">Across {invoices.length} Invoices</span>
              <div className="bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">
                <span className="text-[9px] font-black text-red-200 uppercase tracking-tighter">Amount Remaining: Rs. {Math.round(outstandingBalance).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Units Consumed Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-xl dark:hover:shadow-black/20 transition-all duration-300 group overflow-hidden">
          <div className="bg-amber-50 dark:bg-amber-950/20 w-fit p-3 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Units Used</p>
            <div className="flex items-baseline gap-1 mt-1 flex-wrap">
              <p className={`${totalUnits.toLocaleString().length > 10 ? 'text-2xl' : 'text-3xl'} font-black text-slate-800 dark:text-white tracking-tighter transition-all duration-300`}>
                {totalUnits.toLocaleString()}
              </p>
              <p className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase">kWh</p>
            </div>
          </div>
        </div>

        {/* Registered Shops Card */}
        <button
          onClick={() => setExpandShops(!expandShops)}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-xl dark:hover:shadow-black/20 transition-all duration-300 group text-left relative overflow-hidden active:scale-95"
        >
          <div className="bg-blue-50 dark:bg-blue-950/20 w-fit p-3 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Registered Units</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mt-1">{shops.length}</p>
          </div>
          <div className="absolute top-8 right-8 text-slate-300 dark:text-slate-700 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
            {expandShops ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>
      </div>

      {/* SECONDARY DATA SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* SHOPS DRAWER (Conditional) */}
        <AnimatePresence>
          {expandShops && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Registry of Units</h2>
                </div>
                <button
                  onClick={() => setExpandShops(false)}
                  className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {shops.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Records Found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                  {shops.map(shop => (
                    <div
                      key={shop.id}
                      className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-black/10 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group"
                    >
                      <div className="mb-4">
                        <p className="font-black text-slate-800 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{shop.name}</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">ID: {shop.id.slice(0, 8)}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                          <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase">Owner</span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{shop.ownerName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                          <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase">Contact</span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{shop.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase">Meter</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-500 font-mono">{shop.meterId.slice(0, 10)}...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* LATEST READINGS - Fixed Sidebar feel */}
        <div className={`space-y-6 ${expandShops ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Recent Activity</h2>
            </div>

            {readings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                <Zap className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-4" />
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Waiting for Scans</p>
              </div>
            ) : (
              <div className={`grid gap-4 overflow-y-auto pr-2 custom-scrollbar ${!expandShops ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
                {readings.slice().reverse().slice(0, 12).map((reading) => {
                  const shop = shops.find(s => s.id === reading.shopId);
                  return (
                    <div
                      key={reading.id}
                      className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md dark:hover:shadow-black/20 hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 dark:text-slate-100 text-sm truncate">{shop?.name || 'Unknown'}</p>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">{new Date(reading.timestamp || reading.readingDate || new Date()).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{reading.readingValue}</p>
                          <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] -mt-1">kWh</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${reading.status === 'APPROVED' || !reading.status ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{reading.status || 'APPROVED'}</span>
                        </div>
                        <span className="text-[9px] font-black bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600">
                          {reading.confidence}% Conf.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
