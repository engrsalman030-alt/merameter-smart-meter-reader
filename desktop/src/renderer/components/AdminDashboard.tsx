// AdminDashboard.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
    Store,
    Cpu,
    Zap,
    Banknote,
    Clock,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    X,
    Users,
    Activity,
} from 'lucide-react';
import { Shop, MeterReading, Invoice } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';

interface Props {
    shops: Shop[];
    readings: MeterReading[];
    invoices: Invoice[];
}

const AdminDashboard: React.FC<Props> = ({ shops, readings, invoices }) => {
    const [expandShops, setExpandShops] = useState(false);

    // User Profile State
    const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Admin User');
    const [userImage, setUserImage] = useState(localStorage.getItem('userImage') || '');

    useEffect(() => {
        const handleStorageChange = () => {
            setUserName(localStorage.getItem('userName') || 'Admin User');
            setUserImage(localStorage.getItem('userImage') || '');
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // ─── KPI Calculations ───
    const totalUnits = useMemo(
        () => invoices.reduce((sum, inv) => sum + inv.units, 0),
        [invoices]
    );
    const totalRevenue = useMemo(
        () => invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        [invoices]
    );
    const paidCollection = useMemo(
        () => invoices.filter(inv => inv.paidStatus).reduce((sum, inv) => sum + inv.totalAmount, 0),
        [invoices]
    );
    const pendingAmount = useMemo(
        () => totalRevenue - paidCollection,
        [totalRevenue, paidCollection]
    );
    const pendingCount = useMemo(
        () => invoices.filter(inv => !inv.paidStatus).length,
        [invoices]
    );

    // ─── Chart Data ───
    const monthlyData = useMemo(() => {
        const months: Record<string, { month: string; units: number; revenue: number }> = {};
        invoices.forEach(inv => {
            const date = new Date(inv.issuedDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (!months[key]) months[key] = { month: label, units: 0, revenue: 0 };
            months[key].units += inv.units;
            months[key].revenue += inv.totalAmount;
        });
        return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
    }, [invoices]);

    const paymentStatusData = useMemo(() => {
        const paid = invoices.filter(i => i.paidStatus).length;
        const pending = invoices.length - paid;
        return [
            { name: 'Paid', value: paid, color: '#059669' },
            { name: 'Pending', value: pending, color: '#f59e0b' },
        ];
    }, [invoices]);

    // ─── KPI Card Config ───
    const kpiCards = [
        {
            label: 'Total Shops',
            value: shops.length,
            icon: Store,
            color: 'blue',
            bgClass: 'bg-blue-50 dark:bg-blue-950/20',
            iconClass: 'text-blue-600 dark:text-blue-400',
            hoverBg: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
        },
        {
            label: 'Active Meters',
            value: shops.length,
            icon: Cpu,
            color: 'indigo',
            bgClass: 'bg-indigo-50 dark:bg-indigo-950/20',
            iconClass: 'text-indigo-600 dark:text-indigo-400',
            hoverBg: 'group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30',
        },
        {
            label: 'Units Consumed',
            value: `${totalUnits.toLocaleString()} kWh`,
            icon: Zap,
            color: 'amber',
            bgClass: 'bg-amber-50 dark:bg-amber-950/20',
            iconClass: 'text-amber-600 dark:text-amber-400',
            hoverBg: 'group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30',
        },
        {
            label: 'Total Revenue',
            value: `Rs. ${Math.round(totalRevenue).toLocaleString()}`,
            icon: Banknote,
            color: 'emerald',
            bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
            iconClass: 'text-emerald-600 dark:text-emerald-400',
            hoverBg: 'group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30',
        },
        {
            label: 'Pending Payments',
            value: `Rs. ${Math.round(pendingAmount).toLocaleString()}`,
            subtitle: `${pendingCount} invoice${pendingCount !== 1 ? 's' : ''}`,
            icon: Clock,
            color: 'red',
            bgClass: 'bg-red-50 dark:bg-red-950/20',
            iconClass: 'text-red-600 dark:text-red-400',
            hoverBg: 'group-hover:bg-red-100 dark:group-hover:bg-red-900/30',
        },
    ];

    const CHART_COLORS = ['#059669', '#f59e0b', '#3b82f6', '#6366f1'];

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 dark:bg-transparent min-h-screen">

            {/* ─── HEADER ─── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 flex items-center justify-center">
                            {userImage ? (
                                <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Users className="w-8 h-8 text-slate-200" />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-50 dark:border-slate-950 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Welcome, {userName.split(' ')[0]}</h1>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Managing utility billing for {shops.length} nodes
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* ─── KPI CARDS ─── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpiCards.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={i}
                            className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300"
                        >
                            <div className={`${kpi.bgClass} w-10 h-10 rounded-xl flex items-center justify-center ${kpi.hoverBg} transition-colors`}>
                                <Icon className={`w-5 h-5 ${kpi.iconClass}`} />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-3">{kpi.label}</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5 truncate">{kpi.value}</p>
                            {kpi.subtitle && (
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 mt-0.5">{kpi.subtitle}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ─── COLLECTION HERO CARD ─── */}
            <div className="relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 rounded-2xl" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32" />
                <div className="relative p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Total Collection</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-emerald-300">PKR</span>
                            <p className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                                {Math.round(paidCollection).toLocaleString()}
                            </p>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                            Across {invoices.length} invoices · Billed Rs. {Math.round(totalRevenue).toLocaleString()}
                        </p>
                    </div>
                    {pendingAmount > 0 && (
                        <div className="bg-red-500/15 px-4 py-2 rounded-xl border border-red-500/20">
                            <p className="text-[10px] font-bold text-red-300 uppercase tracking-wider">Outstanding</p>
                            <p className="text-lg font-black text-red-400 tracking-tight">Rs. {Math.round(pendingAmount).toLocaleString()}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── CHARTS SECTION ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Monthly Consumption Trend */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-1 h-5 bg-blue-600 rounded-full" />
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Monthly Consumption</h3>
                    </div>
                    {monthlyData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No data yet</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="unitsFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }}
                                    labelStyle={{ fontWeight: 800, color: '#0f172a' }}
                                />
                                <Area type="monotone" dataKey="units" stroke="#3b82f6" strokeWidth={2.5} fill="url(#unitsFill)" name="Units (kWh)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Payment Status Pie */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Payment Status</h3>
                    </div>
                    {invoices.length === 0 ? (
                        <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No invoices</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={paymentStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {paymentStatusData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex gap-6 mt-2">
                                {paymentStatusData.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.name}: {item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Revenue Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-1 h-5 bg-amber-500 rounded-full" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Revenue Overview</h3>
                </div>
                {monthlyData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No revenue data</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={monthlyData} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }}
                                labelStyle={{ fontWeight: 800, color: '#0f172a' }}
                                formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} name="Revenue (Rs.)" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ─── RECENT ACTIVITY ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Shops Drawer */}
                <AnimatePresence>
                    {expandShops && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                    <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Registered Shops</h2>
                                </div>
                                <button
                                    onClick={() => setExpandShops(false)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {shops.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No shops registered</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                    {shops.map(shop => (
                                        <div
                                            key={shop.id}
                                            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {shop.customerImage ? (
                                                    <img src={shop.customerImage} alt={shop.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                                                        <Store className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{shop.name}</p>
                                                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{shop.ownerName} · {shop.phone}</p>
                                                </div>
                                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                                                    {shop.shopNumber || shop.id.slice(0, 6)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Recent Readings */}
                <div className={`space-y-4 ${expandShops ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Recent Readings</h2>
                            </div>
                            <button
                                onClick={() => setExpandShops(!expandShops)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
                            >
                                <Users className="w-3.5 h-3.5" />
                                {expandShops ? 'Hide Shops' : `View ${shops.length} Shops`}
                            </button>
                        </div>

                        {readings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <Activity className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-3" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No readings yet</p>
                            </div>
                        ) : (
                            <div className={`grid gap-3 ${!expandShops ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                                {readings.slice().reverse().slice(0, 12).map((reading) => {
                                    const shop = shops.find(s => s.id === reading.shopId);
                                    return (
                                        <div
                                            key={reading.id}
                                            className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md dark:hover:shadow-black/10 transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{shop?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] font-semibold text-slate-400 mt-1">
                                                        {new Date(reading.timestamp || reading.readingDate || new Date()).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{reading.readingValue}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">kWh</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${reading.status === 'APPROVED' || !reading.status ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{reading.status || 'Approved'}</span>
                                                </div>
                                                {reading.confidence && (
                                                    <span className="text-[9px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                                                        {reading.confidence}%
                                                    </span>
                                                )}
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
