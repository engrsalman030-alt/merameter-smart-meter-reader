import React from 'react';
import {
    Store,
    MapPin,
    Phone,
    User,
    Hash,
    Calendar,
    Cpu,
    ArrowLeft,
    Shield,
    Activity,
    Zap,
    CheckCircle2
} from 'lucide-react';
import { Shop, Meter } from '../types';

interface Props {
    shop: Shop;
    meter?: Meter;
    onClose: () => void;
}

const ShopDetailsView: React.FC<Props> = ({ shop, meter, onClose }) => {
    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-transparent min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header/Navigation */}
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs uppercase tracking-widest font-black">Back to Directory</span>
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Hero Section */}
                    <div className="h-48 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] pointer-events-none">
                            <svg width="100%" height="100%">
                                <pattern id="details-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M0 40L40 0M-1 1L1 -1M39 41L41 39" stroke="currentColor" strokeWidth="1" />
                                </pattern>
                                <rect width="100%" height="100%" fill="url(#details-pattern)" />
                            </svg>
                        </div>

                        <div className="absolute -bottom-12 left-12 flex items-end gap-6">
                            <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 p-1 border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden">
                                {shop.customerImage ? (
                                    <img src={shop.customerImage} className="w-full h-full object-cover rounded-2xl" alt={shop.name} />
                                ) : (
                                    <div className="w-full h-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center rounded-2xl">
                                        <Store className="w-12 h-12 text-emerald-500" />
                                    </div>
                                )}
                            </div>
                            <div className="mb-14">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{shop.name}</h1>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    Authorized Establishment
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-12 pt-20 grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Left Column: Shop Info */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 pb-2">Business Identification</h3>

                                <div className="grid grid-cols-1 gap-6 mt-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tight">Proprietor Name</p>
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{shop.ownerName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                            <Hash className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tight">Shop Number</p>
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">#{shop.shopNumber || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tight">Registration Date</p>
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">{new Date(shop.registrationDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 pb-2">Contact & Location</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                            <Phone className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{shop.phone}</p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                            <MapPin className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{shop.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Meter Info */}
                        <div className="space-y-8">
                            <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                    <Zap className="w-24 h-24 text-emerald-500" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <Activity className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Active Metrology Node</h3>
                                    </div>

                                    {meter ? (
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Serial Number</p>
                                                <p className="text-2xl font-black text-white font-mono tracking-tighter">{meter.serialNumber}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Reading</p>
                                                    <p className="text-xl font-black text-emerald-500 tracking-tight">{meter.lastReading} <span className="text-xs font-bold text-slate-500">kWh</span></p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Billing Rate</p>
                                                    <p className="text-xl font-black text-white tracking-tight">Rs. {shop.unitRate || 30}</p>
                                                </div>
                                            </div>
                                            <div className="pt-6 border-t border-slate-800">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <span>Node Status</span>
                                                    <span className="text-emerald-500 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Synchronized
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center space-y-2">
                                            <p className="text-sm font-black text-slate-500 uppercase">No Meter Link Detected</p>
                                            <p className="text-xs font-bold text-slate-600">Please re-register this entity</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {meter?.meterImage && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 pb-2">Hardware Verification</h3>
                                    <div className="rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden grayscale hover:grayscale-0 transition-all duration-500">
                                        <img src={meter.meterImage} className="w-full h-auto" alt="Meter Hardware" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopDetailsView;
