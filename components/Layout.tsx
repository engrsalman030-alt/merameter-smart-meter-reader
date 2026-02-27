// Layout.tsx
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Camera,
  Store,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: "admin" | "reader" | "shops" | "invoices" | "settings";
  onTabChange: (
    tab: "admin" | "reader" | "shops" | "invoices" | "settings"
  ) => void;
  onLogout?: () => void;
  onOfflineToggle?: (enabled: boolean) => void;
  isOfflineMode?: boolean;
  allShops?: any[];
  ratePerUnit?: number;
  onRateChange?: (rate: number) => void;
  isOnline?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  const [appName, setAppName] = useState(
    localStorage.getItem("appName") || "Alim Traders"
  );
  const [appLogo, setAppLogo] = useState(
    localStorage.getItem("appLogo") || ""
  );
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || "Admin"
  );
  const [userImage, setUserImage] = useState(
    localStorage.getItem("userImage") || ""
  );

  useEffect(() => {
    const updateBranding = () => {
      setAppName(localStorage.getItem("appName") || "Alim Traders");
      setAppLogo(localStorage.getItem("appLogo") || "");
      setUserName(localStorage.getItem("userName") || "Admin");
      setUserImage(localStorage.getItem("userImage") || "");
    };
    window.addEventListener("storage", updateBranding);
    return () => window.removeEventListener("storage", updateBranding);
  }, []);

  useEffect(() => {
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [currentTheme]);

  const navItems = [
    { id: "admin", label: "Home", icon: LayoutDashboard },
    { id: "reader", label: "Scan", icon: Camera },
    { id: "shops", label: "Shops", icon: Store },
    { id: "invoices", label: "Bills", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  const currentYear = new Date().getFullYear();

  return (
    // ✅ h-screen + overflow-hidden locks the outer wrapper to the viewport and prevents scrolling
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col md:flex-row">

      {/* ✅ Sidebar — fixed height, never scrolls with page content */}
      <aside className="hidden md:flex flex-col w-72 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0">

        {/* Branding Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center overflow-hidden shadow-md">
              {appLogo ? (
                <img src={appLogo} alt="App Logo" className="w-full h-full object-contain" />
              ) : userImage ? (
                <img src={userImage} alt="User" className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {appName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {userName}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ Navigation — grows to fill space, scrolls internally if needed */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* ✅ Logout — pinned above footer, never scrolls away */}
        <div className="flex-shrink-0 px-4 pb-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ✅ Main Content — scrolls independently, leaves room for mobile footer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ✅ Mobile Bottom Navigation Bar — fixed to viewport, not inside scrollable area */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-2 shadow-2xl shadow-black/10 dark:shadow-black/40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all ${isActive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 dark:text-slate-500"
                }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? "bg-emerald-50 dark:bg-emerald-900/30" : ""}`}>
                <Icon className="w-5 h-5" />
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

const Zap = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default Layout;