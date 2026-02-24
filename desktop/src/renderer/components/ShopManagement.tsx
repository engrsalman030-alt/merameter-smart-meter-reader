import React, { useState, useMemo } from 'react';
import {
    Store,
    MapPin,
    Phone,
    Plus,
    Search,
    MoreVertical,
    Edit2,
    Trash2,
    Map,
    Filter,
    CheckCircle2,
    Package,
    ArrowRight,
    TrendingUp,
} from 'lucide-react';
import { Shop } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';

interface Props {
    shops: Shop[];
    onAddShop: () => void;
    onEditShop: (shop: Shop) => void;
    onDeleteShop: (shopId: string) => Promise<void>;
    onViewDetails: (shopId: string) => void;
}

const ShopManagement: React.FC<Props> = ({ shops, onAddShop, onEditShop, onDeleteShop, onViewDetails }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const { showToast } = useToast();

    const filteredShops = useMemo(() => {
        return shops.filter(
            (shop) =>
                shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.shopNumber.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [shops, searchQuery]);

    const handleDelete = async (shopId: string, shopName: string) => {
        if (window.confirm(`Are you sure you want to delete ${shopName}? All related readings and invoices will be lost.`)) {
            try {
                await onDeleteShop(shopId);
                showToast('Shop deleted successfully', 'success');
            } catch (err) {
                showToast('Failed to delete shop', 'error');
            }
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-transparent min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Entity Directory</h1>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{shops.length} Registered Nodes</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search ID, Name or Owner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={onAddShop}
                        className="h-12 px-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Entity
                    </button>
                </div>
            </div>

            {filteredShops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center">
                        <Store className="w-10 h-10 text-slate-200" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">No matching results</h3>
                        <p className="text-sm font-bold text-slate-300 dark:text-slate-700">Refine your search parameters or add a new entity</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredShops.map((shop, index) => (
                            <motion.div
                                key={shop.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                            >
                                <div className="h-32 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none">
                                        <svg width="100%" height="100%">
                                            <pattern id={`pattern-${shop.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                                                <path d="M0 20L20 0M-1 1L1 -1M19 21L21 19" stroke="currentColor" strokeWidth="1" />
                                            </pattern>
                                            <rect width="100%" height="100%" fill={`url(#pattern-${shop.id})`} />
                                        </svg>
                                    </div>

                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                        <div className="px-3 py-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-lg border border-white/20 shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">Shop No.</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{shop.shopNumber || 'N/A'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onEditShop(shop)}
                                                className="p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-full border border-white/20 text-slate-500 hover:text-emerald-500 hover:scale-110 active:scale-90 transition-all shadow-sm"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(shop.id, shop.name)}
                                                className="p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-full border border-white/20 text-slate-500 hover:text-red-500 hover:scale-110 active:scale-90 transition-all shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="absolute -bottom-8 left-8">
                                        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 p-1 border-4 border-slate-100 dark:border-slate-950 shadow-xl overflow-hidden ring-4 ring-white/50 dark:ring-slate-900/50">
                                            {shop.customerImage ? (
                                                <img src={shop.customerImage} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <div className="w-full h-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center rounded-xl">
                                                    <Store className="w-8 h-8 text-emerald-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 pt-12 space-y-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1 group-hover:text-emerald-500 transition-colors uppercase">{shop.name}</h3>
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{shop.ownerName}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold">{shop.phone}</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-slate-500 dark:text-slate-400">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold leading-relaxed">{shop.address}</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard Rate</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">Rs. {shop.unitRate || 30} <span className="text-[10px] text-slate-400">/kWh</span></p>
                                        </div>
                                        <button
                                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white transition-all shadow-lg shadow-black/10 dark:shadow-white/5 active:scale-95"
                                            onClick={() => onViewDetails(shop.id)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default ShopManagement;
