// Layout.tsx
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Camera, Store, FileText, Settings, Wifi, WifiOff
} from 'lucide-react';
import { LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shop } from '../types';
import SettingsModal from './SettingsModal';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'admin' | 'reader' | 'shops' | 'invoices';
  onTabChange: (tab: 'admin' | 'reader' | 'shops' | 'invoices') => void;
  isOnline: boolean;
  onLogout: () => void;
  allShops: Shop[];
  ratePerUnit: number;
  onRateChange: (rate: number) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, isOnline, onLogout, allShops, ratePerUnit, onRateChange }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      handleThemeChange(savedTheme);
    }
  }, []);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navItems = [
    { id: 'admin', label: 'Home', icon: LayoutDashboard },
    { id: 'reader', label: 'Scan', icon: Camera },
    { id: 'shops', label: 'Shops', icon: Store },
    { id: 'invoices', label: 'Bills', icon: FileText },
  ] as const;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200/60 sticky top-0 h-screen z-40 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.02)] dark:bg-slate-900 dark:border-slate-800 transition-colors duration-500">
        <div className="p-8 pb-10 flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-2.5 rounded-2xl shadow-xl shadow-emerald-100 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer dark:shadow-emerald-900/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white">MeraMeter</h1>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full group flex items-center gap-4 px-5 py-4 rounded-[1.25rem] font-black text-[13px] uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${isActive
                  ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 dark:bg-emerald-600 dark:shadow-emerald-900/40'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-500 dark:hover:bg-slate-800/50 dark:hover:text-slate-300'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800 z-0 dark:from-emerald-600 dark:to-emerald-500"
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-emerald-400 dark:text-white' : 'text-slate-300 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400'}`} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-100 space-y-2 dark:border-slate-800">
            <button
              onClick={() => setShowSettings(true)}
              className="w-full group flex items-center gap-4 px-5 py-4 rounded-[1.25rem] font-black text-[13px] uppercase tracking-widest text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-300 dark:text-slate-500 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
            >
              <Settings className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 dark:text-slate-600 dark:group-hover:text-emerald-400" />
              <span>Settings</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full group flex items-center gap-4 px-5 py-4 rounded-[1.25rem] font-black text-[13px] uppercase tracking-widest text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 dark:text-slate-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <LogOut className="w-5 h-5 text-slate-300 group-hover:text-red-500 dark:text-slate-600 dark:group-hover:text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* STATUS */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/50">
          <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500 ${isOnline ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-red-50/50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile App Bar */}
        <header className="md:hidden bg-white/80 backdrop-blur-xl border-b border-slate-100 p-5 flex justify-between items-center sticky top-0 z-50 dark:bg-slate-900/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-black text-xl tracking-tighter text-slate-900 dark:text-white">MeraMeter</h1>
          </div>
          <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">{isOnline ? 'Cloud' : 'Local'}</span>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto w-full min-h-full pb-28 md:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Dock */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl rounded-[2rem] p-2.5 flex justify-around items-center z-50 shadow-2xl safe-area-bottom no-print dark:bg-slate-800/90">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-500'
                  }`}
              >
                {isActive && (
                  <motion.div layoutId="mobileNav" className="absolute inset-0 bg-emerald-600 rounded-2xl -z-10 shadow-lg shadow-emerald-900/40" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        ratePerUnit={ratePerUnit}
        onRateChange={onRateChange}
      />
    </div>
  );
};

// Internal icon
const Zap = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default Layout;
