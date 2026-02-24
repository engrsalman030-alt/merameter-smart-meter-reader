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
    Users,
    Layout,
    AlertTriangle,
    CheckCircle2,
    Moon,
    Sun,
    Info,
    ChevronDown,
    ChevronUp,
    X,
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
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [tempRate, setTempRate] = useState(ratePerUnit);

    const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Admin User');
    const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || 'admin@merameter.com');
    const [userImage, setUserImage] = useState(localStorage.getItem('userImage') || '');
    const profileImageInputRef = useRef<HTMLInputElement>(null);

    const [appName, setAppName] = useState(localStorage.getItem('appName') || 'MeraMeter');
    const [appLogo, setAppLogo] = useState(localStorage.getItem('appLogo') || '');
    const appLogoInputRef = useRef<HTMLInputElement>(null);

    const [isAboutOpen, setIsAboutOpen] = useState(false);

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
            reader.onloadend = () => setAppLogo(reader.result as string);
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
            reader.onloadend = () => setUserImage(reader.result as string);
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

    const handleExportBackup = async () => {
        try {
            const success = await window.electronAPI.backupDB();
            if (success) setPasswordMessage({ type: 'success', text: 'Database backup created' });
        } catch (err) {
            setPasswordMessage({ type: 'error', text: 'Failed to create backup' });
        }
        setTimeout(() => setPasswordMessage(null), 2000);
    };

    const handleRestoreBackup = async () => {
        if (!confirm('RESTORE DATA?\n\nThis will replace all current data. THE APP WILL RELOAD.')) return;
        try {
            const success = await window.electronAPI.restoreDB();
            if (success) {
                setPasswordMessage({ type: 'success', text: 'Restored! Reloading...' });
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (err) {
            setPasswordMessage({ type: 'error', text: 'Failed to restore database' });
        }
        setTimeout(() => setPasswordMessage(null), 3000);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8 flex justify-center items-start font-sans animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                <AnimatePresence>
                    {passwordMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -50, x: '-50%' }}
                            animate={{ opacity: 1, y: 20, x: '-50%' }}
                            exit={{ opacity: 0, y: -50, x: '-50%' }}
                            className={`fixed top-0 left-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border backdrop-blur-md ${passwordMessage.type === 'success'
                                ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                                : 'bg-red-500/90 text-white border-red-400/50'
                                }`}
                        >
                            {passwordMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <p className="text-xs font-bold uppercase tracking-wide">{passwordMessage.text}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
                </div>

                <div className="p-6 md:p-8 space-y-10">
                    <section>
                        <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white mb-5">
                            <Users className="w-5 h-5 text-blue-500" />
                            Profile Settings
                        </h2>
                        <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                            <form onSubmit={handleProfileUpdate} className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="relative group cursor-pointer" onClick={() => profileImageInputRef.current?.click()}>
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-800">
                                        {userImage ? (
                                            <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Users className="w-8 h-8 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="w-5 h-5 text-white" />
                                    </div>
                                    <input type="file" ref={profileImageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>
                                <div className="flex-1 w-full space-y-3">
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        placeholder="Full Name"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                    <div className="flex gap-3">
                                        <input
                                            type="email"
                                            value={userEmail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                            placeholder="Email Address"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                        <button type="submit" className="px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors shadow-lg">Save</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white mb-5">
                            <Layout className="w-5 h-5 text-indigo-500" />
                            Branding
                        </h2>
                        <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                            <form onSubmit={handleBrandingUpdate} className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="relative group cursor-pointer" onClick={() => appLogoInputRef.current?.click()}>
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 flex items-center justify-center p-2">
                                        {appLogo ? <img src={appLogo} alt="Logo" className="w-full h-full object-contain" /> : <Zap className="w-8 h-8 text-slate-300" />}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="w-5 h-5 text-white" />
                                    </div>
                                    <input type="file" ref={appLogoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </div>
                                <div className="flex-1 w-full flex gap-3">
                                    <input
                                        type="text"
                                        value={appName}
                                        onChange={(e) => setAppName(e.target.value)}
                                        placeholder="Application Name"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                    <button type="submit" className="px-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors shadow-lg">Update</button>
                                </div>
                            </form>
                        </div>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white mb-5">
                            <Zap className="w-5 h-5 text-amber-500" />
                            Unit Price
                        </h2>
                        <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Rate Per Unit (PKR)</label>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    value={tempRate}
                                    onChange={(e) => setTempRate(parseFloat(e.target.value) || 0)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                />
                                <button onClick={handleRateChange} className="px-8 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors shadow-lg">Save</button>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white mb-5">
                            <Palette className="w-5 h-5 text-purple-500" />
                            Theme
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => onThemeChange('light')}
                                className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 transition-all ${currentTheme === 'light'
                                    ? 'border-slate-900 dark:border-white bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md'
                                    : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-400 hover:border-slate-300'
                                    }`}
                            >
                                <Sun className="w-5 h-5" />
                                <span className="font-bold text-sm">Light Mode</span>
                            </button>
                            <button
                                onClick={() => onThemeChange('dark')}
                                className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 transition-all ${currentTheme === 'dark'
                                    ? 'border-slate-900 dark:border-white bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md'
                                    : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-400 hover:border-slate-300'
                                    }`}
                            >
                                <Moon className="w-5 h-5" />
                                <span className="font-bold text-sm">Dark Mode</span>
                            </button>
                        </div>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white mb-5">
                            <Download className="w-5 h-5 text-emerald-500" />
                            Native Database Tools
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleExportBackup}
                                className="flex items-center justify-center gap-3 py-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all font-bold text-sm"
                            >
                                <Download className="w-5 h-5" />
                                Export .db File
                            </button>
                            <button
                                onClick={handleRestoreBackup}
                                className="flex items-center justify-center gap-3 py-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition-all font-bold text-sm"
                            >
                                <Upload className="w-5 h-5" />
                                Restore .db File
                            </button>
                        </div>
                    </section>

                    <section className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button onClick={() => setIsAboutOpen(!isAboutOpen)} className="w-full flex items-center justify-between text-slate-500 hover:text-slate-800 transition-colors">
                            <div className="flex items-center gap-2.5">
                                <Info className="w-5 h-5" />
                                <span className="text-lg font-bold">About MeraMeter Desktop</span>
                            </div>
                            {isAboutOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        <AnimatePresence>
                            {isAboutOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="pt-4 pb-2 text-sm text-slate-500 space-y-2 pl-8">
                                        <p className="font-semibold text-slate-900 dark:text-white">Professional Utility Ledger Platform</p>
                                        <p>Version 2.0.0 (Desktop Edition)</p>
                                        <p>Native SQLite Integration • Gemini-1.5 AI Scan</p>
                                        <p>© {new Date().getFullYear()} MeraMeter Pakistan.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
