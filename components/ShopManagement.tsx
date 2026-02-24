import React, { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Filter,
    Eye,
    Pencil,
    Trash2,
    Store,
    CreditCard,
    Phone,
    Cpu,
    UserCircle,
    MoreHorizontal
} from 'lucide-react';
import { Shop, Meter, MeterReading, Invoice } from '../types';

interface ShopManagementProps {
    shops: Shop[];
    meters: Meter[];
    readings: MeterReading[];
    invoices: Invoice[];
    onAddShop: () => void;
    onEditShop: (shop: Shop) => void;
    onDeleteShop: (shopId: string, meterId: string) => void;
    onViewDetails: (shopId: string) => void;
}

const ShopManagement: React.FC<ShopManagementProps> = ({
    shops,
    meters,
    readings,
    invoices,
    onAddShop,
    onEditShop,
    onDeleteShop,
    onViewDetails
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending'>('all');

    // Filtered Shops Logic
    const filteredShops = useMemo(() => {
        return shops.filter(shop => {
            const matchSearch =
                shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.shopNumber?.toLowerCase().includes(searchQuery.toLowerCase());

            if (filterStatus === 'all') return matchSearch;

            const meter = meters.find(m => m.id === shop.meterId);
            const hasPending = invoices.some(inv => inv.shopId === shop.id && !inv.paidStatus);

            if (filterStatus === 'active') return matchSearch && !!meter;
            if (filterStatus === 'pending') return matchSearch && hasPending;

            return matchSearch;
        });
    }, [shops, meters, invoices, searchQuery, filterStatus]);

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 dark:bg-transparent min-h-screen">

            {/* ─── HEADER SECTION ─── */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Shop Management</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 dark:text-slate-500">
                        Registry & Operational Oversight
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    {/* Search Input */}
                    <div className="relative group flex-1 lg:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search registry..."
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:font-medium placeholder:text-slate-400 text-slate-900 dark:text-white shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Select */}
                    <div className="relative min-w-[160px]">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer text-slate-700 dark:text-slate-200 shadow-sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all">All Units</option>
                            <option value="active">Active Only</option>
                            <option value="pending">Pending Bills</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400" />
                        </div>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={onAddShop}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-slate-900/10 dark:shadow-emerald-900/20 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Shop</span>
                    </button>
                </div>
            </div>

            {/* ─── CONTENT SECTION ─── */}
            <div className="space-y-6">

                {/* Desktop List View */}
                <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ownership</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Meter ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Ops</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredShops.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                                    <Store className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 dark:text-white font-bold text-sm">No shops found</p>
                                                    <p className="text-slate-400 text-xs font-medium mt-1">Try adjusting your search or filters</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredShops.map((shop) => {
                                        const meter = meters.find(m => m.id === shop.meterId);
                                        return (
                                            <tr key={shop.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                                                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                                                                {shop.shopNumber || '00'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{shop.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Shop Registry</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{shop.ownerName}</span>
                                                        <span className="text-[10px] font-mono text-slate-400">{shop.cnic || 'NO CNIC'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-middle text-slate-500 dark:text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        <Cpu className="w-3.5 h-3.5 opacity-50" />
                                                        <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300">{meter?.serialNumber || 'UNASSIGNED'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <Phone className="w-3.5 h-3.5 opacity-50" />
                                                        <span className="text-xs font-bold">{shop.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-middle text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => onViewDetails(shop.id)}
                                                            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-slate-400 hover:text-emerald-600 rounded-lg transition-all text-[10px] font-black uppercase tracking-wider border border-slate-100 dark:border-slate-700 hover:border-emerald-200"
                                                        >
                                                            Registry
                                                        </button>
                                                        <button
                                                            onClick={() => onEditShop(shop)}
                                                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteShop(shop.id, shop.meterId)}
                                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden space-y-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredShops.length === 0 ? (
                        <div className="p-12 text-center">
                            <Store className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold text-sm">No results found</p>
                        </div>
                    ) : (
                        filteredShops.map((shop) => {
                            const meter = meters.find(m => m.id === shop.meterId);
                            return (
                                <div key={shop.id} className="p-4 flex items-center justify-between gap-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex-shrink-0 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50">
                                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                                                {shop.shopNumber || '00'}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-none mb-1">{shop.name}</h3>
                                            <p className="text-[10px] font-semibold text-slate-500 truncate">{shop.ownerName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => onViewDetails(shop.id)}
                                            className="p-2.5 text-slate-400 hover:text-emerald-600"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onEditShop(shop)}
                                            className="p-2.5 text-slate-400"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteShop(shop.id, shop.meterId)}
                                            className="p-2.5 text-slate-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Active Shop Registry — {filteredShops.length} entries
                    </p>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">System Online</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopManagement;