import React, { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Eye,
    Pencil,
    Trash2,
    Store,
    CreditCard,
    Calendar,
    Phone,
    Cpu,
    CheckCircle2,
    UserCircle
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
    onViewShop: (shopId: string) => void;
}

const ShopManagement: React.FC<ShopManagementProps> = ({
    shops,
    meters,
    readings,
    invoices,
    onAddShop,
    onEditShop,
    onDeleteShop,
    onViewShop
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending'>('all');


    // Filtered Shops
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
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Shop Management</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 dark:text-slate-500">Registry & Operational Oversight</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="relative group flex-1 lg:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, number..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="w-full sm:w-auto pl-11 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all">All Units</option>
                            <option value="active">Active Only</option>
                            <option value="pending">Pending Bills</option>
                        </select>
                    </div>

                    <button
                        onClick={onAddShop}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-black dark:hover:bg-emerald-500 active:scale-95 transition-all shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Shop</span>
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop No</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner / Shop</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden xl:table-cell">CNIC</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Phone</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Meter Serial</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredShops.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                                    <Store className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <p className="text-slate-400 font-bold text-sm">No shops found matching your criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredShops.map((shop) => {
                                        const meter = meters.find(m => m.id === shop.meterId);

                                        return (
                                            <React.Fragment key={shop.id}>
                                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/50">
                                                            {shop.shopNumber || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {shop.customerImage ? (
                                                                <img
                                                                    src={shop.customerImage}
                                                                    alt=""
                                                                    className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                                    <UserCircle className="w-6 h-6 text-slate-300" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{shop.name}</p>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{shop.ownerName}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 hidden xl:table-cell">
                                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                            <CreditCard className="w-3 h-3" />
                                                            <span className="text-xs font-mono">{shop.cnic || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 hidden sm:table-cell">
                                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                            <Phone className="w-3 h-3" />
                                                            <span className="text-xs font-bold">{shop.phone}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 hidden lg:table-cell">
                                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                            <Cpu className="w-3 h-3" />
                                                            <span className="text-xs font-mono">{meter?.serialNumber || 'Unassigned'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => onViewShop(shop.id)}
                                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => onEditShop(shop)}
                                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => onDeleteShop(shop.id, shop.meterId)}
                                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Grid View */}
                <div className="md:hidden space-y-4">
                    {filteredShops.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                            <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold text-sm">No results found</p>
                        </div>
                    ) : (
                        filteredShops.map((shop) => {
                            const meter = meters.find(m => m.id === shop.meterId);

                            return (
                                <div key={shop.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-5 space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {shop.customerImage ? (
                                                <img src={shop.customerImage} className="w-12 h-12 rounded-2xl object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                    <UserCircle className="w-6 h-6 text-slate-300" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{shop.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{shop.shopNumber || 'N/A'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{shop.ownerName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{shop.phone}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meter ID</p>
                                            <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{meter?.serialNumber || 'Unassigned'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onViewShop(shop.id)}
                                            className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => onEditShop(shop)}
                                            className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDeleteShop(shop.id, shop.meterId)}
                                            className="px-5 py-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer info */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:row justify-between items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Active Shop Registry — {filteredShops.length} entries
                    </p>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Real-time Data Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default ShopManagement;
