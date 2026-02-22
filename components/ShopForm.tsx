
import React, { useState } from 'react';
import { Store, User, CreditCard, Phone, MapPin, Cpu, ArrowLeft, Save, Zap } from 'lucide-react';
import { Shop, Meter } from '../types';
import { nanoid } from 'nanoid';

interface Props {
  onSave: (shop: Shop, meter: Meter) => void;
  onCancel: () => void;
  editShop?: Shop | null;
  editMeter?: Meter | null;
}

const ShopForm: React.FC<Props> = ({ onSave, onCancel, editShop, editMeter }) => {
  const isEditMode = !!(editShop && editMeter);

  const [formData, setFormData] = useState({
    name: editShop?.name || '',
    ownerName: editShop?.ownerName || '',
    cnic: editShop?.cnic || '',
    phone: editShop?.phone || '',
    address: editShop?.address || '',
    meterSerial: editMeter?.serialNumber || '',
    initialReading: editMeter?.lastReading?.toString() || '0',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const shopId = isEditMode ? editShop!.id : nanoid();
    const meterId = isEditMode ? editMeter!.id : nanoid();

    const shop: Shop = {
      id: shopId,
      name: formData.name,
      ownerName: formData.ownerName,
      cnic: formData.cnic,
      phone: formData.phone,
      address: formData.address,
      meterId: meterId,
    };

    const meter: Meter = {
      id: meterId,
      serialNumber: formData.meterSerial,
      shopId: shopId,
      installDate: isEditMode ? editMeter!.installDate : new Date().toISOString(),
      lastReading: parseFloat(formData.initialReading) || 0,
    };

    onSave(shop, meter);
  };

  const inputClass = "w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white placeholder:font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all";
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors";

  return (

    <div className="p-4 md:p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onCancel} className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all active:scale-90">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">{isEditMode ? 'Edit Shop' : 'Add New Shop'}</h2>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{isEditMode ? 'Update Details' : 'Registration'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Shop & Owner Info</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group">
              <Store className={iconClass} />
              <input
                required
                type="text"
                placeholder="Shop Name"
                className={inputClass}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="relative group">
              <User className={iconClass} />
              <input
                required
                type="text"
                placeholder="Owner Name"
                className={inputClass}
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </div>

            <div className="relative group">
              <CreditCard className={iconClass} />
              <input
                required
                placeholder="CNIC (e.g. 42101-...)"
                className={inputClass}
                value={formData.cnic}
                onChange={e => setFormData({ ...formData, cnic: e.target.value })}
              />
            </div>

            <div className="relative group">
              <Phone className={iconClass} />
              <input
                required
                placeholder="Contact Number"
                className={inputClass}
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="relative group md:col-span-2">
              <MapPin className={iconClass} />
              <textarea
                required
                placeholder="Physical Location Address"
                className={`${inputClass} h-28 pt-4 resize-none`}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Meter Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="relative group">
              <Cpu className={iconClass} />
              <input
                required
                placeholder="Meter Serial Number (Barcode)"
                className={inputClass}
                value={formData.meterSerial}
                onChange={e => setFormData({ ...formData, meterSerial: e.target.value })}
              />
            </div>
            <div className="relative group">
              <Zap className={iconClass} />
              <input
                required
                type="number"
                step="0.1"
                placeholder="Meter Starting Reading (kWh)"
                className={inputClass}
                value={formData.initialReading}
                onChange={e => setFormData({ ...formData, initialReading: e.target.value })}
              />
            </div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 md:col-span-2">
              Note: The starting reading is crucial for accurate billing. If this is an existing meter, enter its current display value.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-mono"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-emerald-700"
          >
            <Save className="w-5 h-5" />
            Complete Registration
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShopForm;
