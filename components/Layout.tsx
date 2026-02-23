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
  isOnline: boolean;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  isOnline,
  onLogout,
}) => {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  // Dynamic Branding
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

  // Sync branding changes
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

  // Apply theme
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

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">

        {/* Branding Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">

            {/* Logo / Image */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center overflow-hidden shadow-md">
              {appLogo ? (
                <img
                  src={appLogo}
                  alt="App Logo"
                  className="w-full h-full object-contain"
                />
              ) : userImage ? (
                <img
                  src={userImage}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Zap className="w-6 h-6 text-white" />
              )}
            </div>

            {/* App Name + User */}
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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
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

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>

        {/* Status */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div
            className={`flex items-center gap-2 text-xs font-medium ${isOnline ? "text-emerald-500" : "text-red-500"
              }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"
                }`}
            />
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        <main className="flex-1 p-6">
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
    </div>
  );
};

// Default Icon
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