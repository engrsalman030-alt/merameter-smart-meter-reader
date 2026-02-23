import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock,
    Palette,
    Zap,
    Download,
    Upload,
    Eye,
    EyeOff,
    ShieldCheck,
    Users,
    Layout,
    Database,
    Save,
    AlertTriangle,
    FileJson,
    CheckCircle2
} from 'lucide-react';

interface SettingsViewProps {
    currentTheme: 'light' | 'dark';
    onThemeChange: (theme: 'light' | 'dark') => void;
    ratePerUnit: number;
    onRateChange: (rate: number) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    currentTheme,
    onThemeChange,
    ratePerUnit,
    onRateChange,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [tempRate, setTempRate] = useState(ratePerUnit);

    // User Profile State
    const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Admin User');
    const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || 'admin@merameter.com');
    const [userImage, setUserImage] = useState(localStorage.getItem('userImage') || '');
    const profileImageInputRef = useRef<HTMLInputElement>(null);

    // Platform Branding State
    const [appName, setAppName] = useState(localStorage.getItem('appName') || 'MeraMeter');
    const [appLogo, setAppLogo] = useState(localStorage.getItem('appLogo') || '');
    const appLogoInputRef = useRef<HTMLInputElement>(null);

    const handleBrandingUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('appName', appName);
        localStorage.setItem('appLogo', appLogo);
        setPasswordMessage({ type: 'success', text: 'Branding updated successfully' });
        setTimeout(() => setPasswordMessage(null), 3000);
        window.dispatchEvent(new Event('storage'));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAppLogo(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('userName', userName);
        localStorage.setItem('userEmail', userEmail);
        localStorage.setItem('userImage', userImage);
        setPasswordMessage({ type: 'success', text: 'Profile updated successfully' });
        setTimeout(() => setPasswordMessage(null), 3000);
        window.dispatchEvent(new Event('storage'));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setUserImage(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        const storedPassword = localStorage.getItem('adminPassword') || 'admin123';
        if (currentPassword !== storedPassword) {
            setPasswordMessage({ type: 'error', text: 'Current password is incorrect' });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        localStorage.setItem('adminPassword', newPassword);
        setPasswordMessage({ type: 'success', text: 'Password changed successfully' });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => setPasswordMessage(null), 3000);
    };

    const handleRateChange = () => {
        if (tempRate <= 0) {
            setPasswordMessage({ type: 'error', text: 'Rate must be greater than 0' });
            return;
        }
        localStorage.setItem('ratePerUnit', tempRate.toString());
        onRateChange(tempRate);
        setPasswordMessage({ type: 'success', text: 'Rate updated successfully' });
        setTimeout(() => setPasswordMessage(null), 2000);
    };

    const handleExportData = async () => {
        try {
            const { dbService } = await import('../services/dbService');

            const shops = await dbService.getAll('shops');
            const meters = await dbService.getAll('meters');
            const readings = await dbService.getAll('readings');
            const invoices = await dbService.getAll('invoices');

            const data = {
                exportDate: new Date().toISOString(),
                shops: JSON.stringify(shops),
                meters: JSON.stringify(meters),
                readings: JSON.stringify(readings),
                invoices: JSON.stringify(invoices),
            };

            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `merameter-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            setPasswordMessage({ type: 'success', text: 'Data exported successfully' });
        } catch (err) {
            setPasswordMessage({ type: 'error', text: 'Failed to export data' });
        }
        setTimeout(() => setPasswordMessage(null), 2000);
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                if (!data.shops || !data.meters) {
                    throw new Error('Invalid backup file');
                }

                if (confirm('RESTORE DATA?\n\nThis will replace all current data with the backup. This cannot be undone.')) {
                    const { dbService } = await import('../services/dbService');
                    await dbService.restoreData(data);
                    window.location.reload();
                }
            } catch (err) {
                setPasswordMessage({ type: 'error', text: 'Invalid backup file or corrupted data' });
                setTimeout(() => setPasswordMessage(null), 3000);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 dark:bg-transparent min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Settings</h1>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        System Preferences & Configuration
                    </p>
                </div>
                {/* Toast Message */}
                <AnimatePresence>
                    {passwordMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className={`px-5 py-3 rounded-xl flex items-center gap-3 shadow-lg border ${passwordMessage.type === 'success'
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-red-500 text-white border-red-600'
                                }`}
                        >
                            {passwordMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <p className="text-xs font-bold uppercase tracking-wide">{passwordMessage.text}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Profile Card */}
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">My Profile</h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Personal details and avatar</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="flex flex-col md:flex-row gap-8">
                            {/* Avatar Upload */}
                            <div className="shrink-0">
                                <div
                                    className="group relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-800 cursor-pointer"
                                    onClick={() => profileImageInputRef.current?.click()}
                                >
                                    {userImage ? (
                                        <img src={userImage} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Users className="w-10 h-10 text-slate-300" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                                        <Upload className="w-8 h-8 text-white drop-shadow-lg" />
                                    </div>
                                </div>
                                <input type="file" ref={profileImageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <p className="text-[10px] font-bold text-center text-slate-400 mt-3 uppercase tracking-wider">Click to change</p>
                            </div>

                            {/* Fields */}
                            <div className="flex-1 space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label>
                                    <input
                                        type="email"
                                        value={userEmail}
                                        onChange={(e) => setUserEmail(e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="name@example.com"
                                    />
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98]">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Branding Card */}
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Layout className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">App Branding</h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Logo and application name</p>
                            </div>
                        </div>

                        <form onSubmit={handleBrandingUpdate} className="flex flex-col md:flex-row gap-8">
                            <div className="shrink-0">
                                <div
                                    className="group relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-800 cursor-pointer flex items-center justify-center"
                                    onClick={() => appLogoInputRef.current?.click()}
                                >
                                    {appLogo ? (
                                        <img src={appLogo} alt="Logo" className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <Zap className="w-10 h-10 text-slate-300" />
                                    )}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                                        <Upload className="w-8 h-8 text-white drop-shadow-lg" />
                                    </div>
                                </div>
                                <input type="file" ref={appLogoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                <p className="text-[10px] font-bold text-center text-slate-400 mt-3 uppercase tracking-wider">Click to change</p>
                            </div>

                            <div className="flex-1 space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Application Name</label>
                                    <input
                                        type="text"
                                        value={appName}
                                        onChange={(e) => setAppName(e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 active:scale-[0.98]">
                                    Update Branding
                                </button>
                            </div>
                        </form>
                    </section>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Security Card */}
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Security</h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Password & Authentication</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full pl-5 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-5 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        />
                                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors">
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Confirm</label>
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 active:scale-[0.98]">
                                Change Password
                            </button>
                        </form>
                    </section>

                    {/* Rate & Theme Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Rate Card */}
                        <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Electricity Rate</h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6">Cost per unit (kWh)</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rate (PKR)</label>
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        value={tempRate}
                                        onChange={(e) => setTempRate(parseFloat(e.target.value) || 0)}
                                        step="0.1"
                                        min="0"
                                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    />
                                    <button onClick={handleRateChange} className="px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-[0.98]">
                                        Update
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Theme Card */}
                        <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 mb-6">
                                    <Palette className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Theme</h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6">Interface appearance</p>
                            </div>

                            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <button
                                    onClick={() => onThemeChange('light')}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTheme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    Light
                                </button>
                                <button
                                    onClick={() => onThemeChange('dark')}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentTheme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    Dark
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Data Management Card (Large) */}
                    <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                <Database className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Data Management</h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Backup and restore database</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Export */}
                            <div className="p-6 rounded-2xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30 hover:border-violet-200 dark:hover:border-violet-700 transition-colors group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                                        <FileJson className="w-6 h-6" />
                                    </div>
                                    <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-wider shadow-sm">
                                        Safe
                                    </span>
                                </div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide mb-2">Export Backup</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                    Download a complete JSON snapshot of your shops, meters, readings, and invoices.
                                </p>
                                <button
                                    onClick={handleExportData}
                                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Data
                                </button>
                            </div>

                            {/* Import */}
                            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider shadow-sm flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Caution
                                    </span>
                                </div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide mb-2">Restore Backup</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                    Restore system data from a backup file. This will <span className="font-bold text-red-500">overwrite</span> all current data.
                                </p>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportData} />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    Select File
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;