import React, { useState } from 'react';
import {
  X,
  Lock,
  Palette,
  Zap,
  Download,
  Upload,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  ratePerUnit: number;
  onRateChange: (rate: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  ratePerUnit,
  onRateChange,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tempRate, setTempRate] = useState(ratePerUnit);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (currentPassword !== 'admin123') {
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

    // Store new password in localStorage (in production, this would be a backend call)
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

      // Export all data as JSON
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
        }
      } catch (err) {
        setPasswordMessage({ type: 'error', text: 'Invalid backup file or corrupted data' });
        setTimeout(() => setPasswordMessage(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-10 md:pt-20 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 p-6 md:p-8 relative border dark:border-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-6 h-6 text-slate-600" />
        </button>

        {/* Header */}
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-8">Settings</h1>

        {/* Message Alert */}
        {passwordMessage && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${passwordMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50'
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/50'
              }`}
          >
            <div className="w-2 h-2 rounded-full" />
            <p className="font-bold">{passwordMessage.text}</p>
          </div>
        )}

        <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-4">
          {/* CHANGE PASSWORD */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Login Password</h2>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm transition-all"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm transition-all"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  Confirm Password
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm transition-all"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* ELECTRICITY RATE */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-amber-600" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Unit Price</h2>
            </div>
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  Rate Per Unit (PKR)
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={tempRate}
                    onChange={(e) => setTempRate(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm transition-all"
                    step="0.1"
                    min="0"
                  />
                  <button
                    onClick={handleRateChange}
                    className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition"
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Current rate: <span className="font-bold">Rs. {ratePerUnit.toFixed(2)}</span> per kWh</p>
              </div>
            </div>
          </div>

          {/* THEME */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Palette className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Theme</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onThemeChange('light')}
                className={`p-4 rounded-2xl border-2 transition-all font-bold ${currentTheme === 'light'
                  ? 'bg-slate-50 border-slate-800 text-slate-800 dark:bg-slate-800 dark:border-emerald-500 dark:text-emerald-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-500'
                  }`}
              >
                ☀️ Light Mode
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`p-4 rounded-2xl border-2 transition-all font-bold ${currentTheme === 'dark'
                  ? 'bg-slate-900 border-slate-300 text-white dark:bg-slate-800 dark:border-emerald-500 dark:text-emerald-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-500'
                  }`}
              >
                🌙 Dark Mode
              </button>
            </div>
          </div>


          {/* DATA EXPORT */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Download className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Backup & Restore</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleExportData}
                className="flex-1 p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800/50 rounded-2xl hover:bg-green-100 dark:hover:bg-green-900/30 transition font-bold text-green-700 dark:text-green-400 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                📥 Download Back-up
              </button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleImportData}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 p-4 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800/50 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                📤 Restore Backup
              </button>
            </div>
          </div>

          {/* ABOUT */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">About</h2>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400 font-bold">Application</p>
                <p className="text-slate-500 dark:text-slate-300">MeraMeter Smart Meter Reader</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400 font-bold">Version</p>
                <p className="text-slate-500 dark:text-slate-300">1.0.0</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400 font-bold">Last Updated</p>
                <p className="text-slate-500 dark:text-slate-300">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
