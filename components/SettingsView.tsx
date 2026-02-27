import React, { useState, useRef, useEffect } from 'react';
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
    ShieldQuestion
} from 'lucide-react';
import { SecurityQuestion } from '../types';

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

    // Security Questions State
    const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
    const [isSavingQuestions, setIsSavingQuestions] = useState(false);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const { dbService } = await import('../services/dbService');
                const questions = await dbService.getAll<SecurityQuestion>('security_questions');
                if (questions.length === 0) {
                    // Initialize with empty questions if none exist
                    setSecurityQuestions([
                        { id: '1', question: '', answer: '' },
                        { id: '2', question: '', answer: '' }
                    ]);
                } else {
                    setSecurityQuestions(questions);
                }
            } catch (err) {
                console.error('Failed to fetch security questions:', err);
            }
        };
        fetchQuestions();
    }, []);

    // User Profile State
    const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Admin User');
    const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || 'admin@merameter.com');
    const [userImage, setUserImage] = useState(localStorage.getItem('userImage') || '');
    const profileImageInputRef = useRef<HTMLInputElement>(null);

    // Platform Branding State
    const [appName, setAppName] = useState(localStorage.getItem('appName') || 'MeraMeter');
    const [appLogo, setAppLogo] = useState(localStorage.getItem('appLogo') || '');
    const appLogoInputRef = useRef<HTMLInputElement>(null);

    // About Section State
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
        localStorage.setItem('billingRate', tempRate.toString());
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
            const settings = await dbService.getAll('settings');
            const security_questions = await dbService.getAll('security_questions');

            const data = {
                exportDate: new Date().toISOString(),
                shops: JSON.stringify(shops),
                meters: JSON.stringify(meters),
                readings: JSON.stringify(readings),
                invoices: JSON.stringify(invoices),
                settings: JSON.stringify(settings),
                security_questions: JSON.stringify(security_questions),
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

    const handleSaveSecurityQuestions = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingQuestions(true);
        try {
            const { dbService } = await import('../services/dbService');
            for (const q of securityQuestions) {
                if (q.question.trim() && q.answer.trim()) {
                    await dbService.put('security_questions', q);
                }
            }
            setPasswordMessage({ type: 'success', text: 'Security questions updated' });
        } catch (err) {
            setPasswordMessage({ type: 'error', text: 'Failed to save security questions' });
        } finally {
            setIsSavingQuestions(false);
            setTimeout(() => setPasswordMessage(null), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-6 lg:p-8 font-sans transition-colors duration-300">
            {/* Toast */}
            <AnimatePresence>
                {passwordMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-0 left-1/2 z-50 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border backdrop-blur-md ${passwordMessage.type === 'success'
                            ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                            : 'bg-red-500/90 text-white border-red-400/50'
                            }`}
                    >
                        {passwordMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <p className="text-sm font-bold tracking-wide">{passwordMessage.text}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your application preferences</p>
                    </div>
                    <button
                        onClick={() => window.history.back()}
                        className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                    {/* Left Column */}
                    <div className="xl:col-span-7 space-y-6">

                        {/* Profile Card */}
                        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Settings</h2>
                            </div>
                            <div className="p-6 md:p-8">
                                <form onSubmit={handleProfileUpdate} className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex-shrink-0 mx-auto md:mx-0">
                                        <div
                                            className="relative group cursor-pointer w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-inner"
                                            onClick={() => profileImageInputRef.current?.click()}
                                        >
                                            {userImage ? (
                                                <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <Upload className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-center text-slate-400 mt-3 font-medium">Tap to change</p>
                                        <input type="file" ref={profileImageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </div>

                                    <div className="flex-1 w-full space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                            <input
                                                type="text"
                                                value={userName}
                                                onChange={(e) => setUserName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                placeholder="Admin User"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                            <input
                                                type="email"
                                                value={userEmail}
                                                onChange={(e) => setUserEmail(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                placeholder="admin@example.com"
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <button type="submit" className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </section>

                        {/* Branding Card */}
                        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <Layout className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Branding</h2>
                            </div>
                            <div className="p-6 md:p-8">
                                <form onSubmit={handleBrandingUpdate} className="flex flex-col md:flex-row gap-8 items-center">
                                    <div
                                        className="relative group cursor-pointer w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-slate-50 dark:bg-slate-800/50"
                                        onClick={() => appLogoInputRef.current?.click()}
                                    >
                                        {appLogo ? (
                                            <img src={appLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <Zap className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="w-6 h-6 text-white" />
                                        </div>
                                        <input type="file" ref={appLogoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </div>

                                    <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Application Name</label>
                                            <input
                                                type="text"
                                                value={appName}
                                                onChange={(e) => setAppName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                                placeholder="MeraMeter"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 h-[50px]">
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </section>

                        {/* Theme Card */}
                        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h2>
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => onThemeChange('light')}
                                        className={`group relative flex items-center p-4 rounded-2xl border-2 transition-all duration-200 ${currentTheme === 'light'
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-full mr-4 ${currentTheme === 'light' ? 'bg-white text-purple-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <Sun className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <span className={`block font-bold ${currentTheme === 'light' ? 'text-purple-900 dark:text-purple-100' : 'text-slate-600 dark:text-slate-400'}`}>Light Mode</span>
                                            <span className="text-xs text-slate-500">Clean & bright interface</span>
                                        </div>
                                        {currentTheme === 'light' && <div className="absolute top-4 right-4 text-purple-500"><CheckCircle2 className="w-5 h-5" /></div>}
                                    </button>

                                    <button
                                        onClick={() => onThemeChange('dark')}
                                        className={`group relative flex items-center p-4 rounded-2xl border-2 transition-all duration-200 ${currentTheme === 'dark'
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-full mr-4 ${currentTheme === 'dark' ? 'bg-slate-800 text-purple-400 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <Moon className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <span className={`block font-bold ${currentTheme === 'dark' ? 'text-purple-900 dark:text-purple-100' : 'text-slate-600 dark:text-slate-400'}`}>Dark Mode</span>
                                            <span className="text-xs text-slate-500">Easy on the eyes</span>
                                        </div>
                                        {currentTheme === 'dark' && <div className="absolute top-4 right-4 text-purple-500"><CheckCircle2 className="w-5 h-5" /></div>}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <div className="xl:col-span-5 space-y-6">

                        {/* Unit Price Card */}
                        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Billing Configuration</h2>
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 mb-6 border border-amber-100 dark:border-amber-900/30">
                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Current Rate</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-slate-900 dark:text-white">{ratePerUnit.toFixed(2)}</span>
                                        <span className="text-sm font-bold text-slate-500">PKR / kWh</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Update Rate</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="number"
                                                value={tempRate}
                                                onChange={(e) => setTempRate(parseFloat(e.target.value) || 0)}
                                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                            />
                                            <button onClick={handleRateChange} className="px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20 active:scale-95">
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Password Card */}
                        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security</h2>
                            </div>
                            <div className="p-6 md:p-8">
                                <form onSubmit={handlePasswordChange} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-10"
                                                placeholder="••••••••"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-10"
                                                placeholder="••••••••"
                                            />
                                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors">
                                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] mt-2">
                                        Update Password
                                    </button>
                                </form>
                            </div>
                        </section>

                        {/* Security Questions Card */}
                        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                    <ShieldQuestion className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recovery Questions</h2>
                            </div>
                            <div className="p-6 md:p-8">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                                    Set security questions to help you recover your password if you forget it.
                                </p>
                                <form onSubmit={handleSaveSecurityQuestions} className="space-y-6">
                                    {securityQuestions.map((sq, index) => (
                                        <div key={sq.id} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                                                    {index + 1}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {index + 1}</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">The Question</label>
                                                    <input
                                                        type="text"
                                                        value={sq.question}
                                                        onChange={(e) => {
                                                            const newQuestions = [...securityQuestions];
                                                            newQuestions[index].question = e.target.value;
                                                            setSecurityQuestions(newQuestions);
                                                        }}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                        placeholder="e.g., What was your first pet's name?"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">The Answer</label>
                                                    <input
                                                        type="text"
                                                        value={sq.answer}
                                                        onChange={(e) => {
                                                            const newQuestions = [...securityQuestions];
                                                            newQuestions[index].answer = e.target.value;
                                                            setSecurityQuestions(newQuestions);
                                                        }}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                        placeholder="Answer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        disabled={isSavingQuestions}
                                        type="submit"
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                                    >
                                        {isSavingQuestions ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <ShieldQuestion className="w-5 h-5" />
                                                Save Security Questions
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </section>

                        {/* Backup Card */}
                        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl text-cyan-600 dark:text-cyan-400">
                                    <Download className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Management</h2>
                            </div>
                            <div className="p-6 md:p-8 space-y-4">
                                <button
                                    onClick={handleExportData}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-cyan-500 transition-colors">
                                            <Download className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-bold text-slate-900 dark:text-white">Export Data</span>
                                            <span className="text-xs text-slate-500">Download JSON backup</span>
                                        </div>
                                    </div>
                                </button>

                                <div className="relative">
                                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportData} />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-blue-500 transition-colors">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-bold text-slate-900 dark:text-white">Restore Data</span>
                                                <span className="text-xs text-slate-500">Import from JSON file</span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* About Section */}
                        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <button
                                onClick={() => setIsAboutOpen(!isAboutOpen)}
                                className="w-full p-6 flex items-center justify-between text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Info className="w-5 h-5 text-slate-400" />
                                    <span className="font-bold">About System</span>
                                </div>
                                {isAboutOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </button>
                            <AnimatePresence>
                                {isAboutOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden bg-slate-50 dark:bg-slate-800/30"
                                    >
                                        <div className="p-6 pt-0 text-sm text-slate-500 dark:text-slate-400 space-y-2 border-t border-slate-100 dark:border-slate-800 mt-2 pt-4">
                                            <p className="font-bold text-slate-900 dark:text-white">MeraMeter Utility Billing System</p>
                                            <p>Version 1.2.0 (Stable)</p>
                                            <p>© {new Date().getFullYear()} All rights reserved.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;