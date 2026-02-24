import React, { useState, useRef } from 'react';
import {
    Store,
    User,
    Phone,
    MapPin,
    Cpu,
    Save,
    Zap,
    Image as ImageIcon,
    X,
} from 'lucide-react';
import { Shop, Meter } from '../types';
import { nanoid } from 'nanoid';

interface Props {
    onSave: (shop: Shop, meter: Meter) => void;
    onCancel: () => void;
    editShop?: Shop | null;
    editMeter?: Meter | null;
    isReadOnly?: boolean;
}

const ShopForm: React.FC<Props> = ({ onSave, onCancel, editShop, editMeter, isReadOnly = false }) => {
    const isEditMode = !!(editShop && editMeter);

    const [formData, setFormData] = useState({
        name: editShop?.name || '',
        ownerName: editShop?.ownerName || '',
        cnic: editShop?.cnic || '',
        phone: editShop?.phone || '',
        address: editShop?.address || '',
        shopNumber: editShop?.shopNumber || '',
        registrationDate: editShop?.registrationDate
            ? new Date(editShop.registrationDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        meterSerial: editMeter?.serialNumber || '',
        initialReadingBefore: editMeter?.initialReadingBefore?.toString() || editMeter?.lastReading?.toString() || '0',
        initialReadingAfter: editMeter?.initialReadingAfter?.toString() || '',
    });

    const [customerImage, setCustomerImage] = useState<string | null>(editShop?.customerImage || null);
    const [meterImage, setMeterImage] = useState<string | null>(editMeter?.meterImage || null);

    const customerFileRef = useRef<HTMLInputElement>(null);
    const meterFileRef = useRef<HTMLInputElement>(null);
    const customerCameraRef = useRef<HTMLInputElement>(null);
    const meterCameraRef = useRef<HTMLInputElement>(null);

    const compressImage = (dataUrl: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height = (height * MAX_WIDTH) / width;
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = dataUrl;
        });
    };

    const handleImageCapture = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string | null>>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const result = ev.target?.result as string;
            const compressed = await compressImage(result);
            setter(compressed);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const maskCnic = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 13);
        let masked = digits;
        if (digits.length > 5 && digits.length <= 12) {
            masked = `${digits.slice(0, 5)}-${digits.slice(5)}`;
        } else if (digits.length > 12) {
            masked = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
        }
        return masked;
    };

    const maskPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 15);
        let masked = digits;
        if (digits.length > 4) {
            masked = `${digits.slice(0, 4)}-${digits.slice(4)}`;
        }
        return masked;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cnicDigits = formData.cnic.replace(/\D/g, '');
        const phoneDigits = formData.phone.replace(/\D/g, '');

        if (cnicDigits.length !== 13) {
            alert("Invalid CNIC: Must be exactly 13 digits");
            return;
        }
        if (phoneDigits.length < 10) {
            alert("Invalid Phone number.");
            return;
        }

        const shopId = isEditMode ? editShop!.id : nanoid();
        const meterId = isEditMode ? editMeter!.id : nanoid();

        const shop: Shop = {
            id: shopId,
            name: formData.name,
            ownerName: formData.ownerName,
            cnic: formData.cnic,
            phone: formData.phone,
            address: formData.address,
            shopNumber: formData.shopNumber,
            customerImage: customerImage || undefined,
            registrationDate: new Date(formData.registrationDate).toISOString(),
        };

        const meter: Meter = {
            id: meterId,
            serialNumber: formData.meterSerial,
            shopId: shopId,
            installDate: isEditMode ? editMeter!.installDate : new Date().toISOString(),
            lastReading: parseFloat(formData.initialReadingBefore) || 0,
            meterImage: meterImage || undefined,
            initialReadingBefore: parseFloat(formData.initialReadingBefore) || 0,
            initialReadingAfter: formData.initialReadingAfter ? parseFloat(formData.initialReadingAfter) : undefined,
        };

        onSave(shop, meter);
    };

    const InputLabel = ({ children }: { children: React.ReactNode }) => (
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
            {children}
        </label>
    );

    const inputStyles = `w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white placeholder:font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`;

    const PhotoUpload = ({
        label,
        image,
        onClear,
        fileRef,
        cameraRef,
        onFileChange,
        icon: Icon
    }: any) => (
        <div className="flex flex-col gap-3">
            <InputLabel>{label}</InputLabel>
            <div className="relative group">
                {image ? (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                        <img src={image} alt="" className="w-full h-full object-cover" />
                        <button
                            onClick={onClear}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="w-full h-40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex gap-2">
                            {!isReadOnly && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => cameraRef.current?.click()}
                                        className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline"
                                    >
                                        Use Camera
                                    </button>
                                    <span className="text-[10px] text-slate-300">|</span>
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:underline"
                                    >
                                        Upload File
                                    </button>
                                </>
                            )}
                            {isReadOnly && (
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Viewing Only</span>
                            )}
                        </div>
                        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onFileChange} />
                        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {isReadOnly ? 'View Unit Record' : isEditMode ? 'Edit Unit Record' : 'Register New Unit'}
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                            {isReadOnly ? 'Read-only documentation of utility registry' : isEditMode ? `Updating shop profile #${editShop?.shopNumber}` : 'Full documentation for utility registry'}
                        </p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div className="space-y-8">
                            <section className="space-y-5">
                                <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Premises Details</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <InputLabel>Shop Number</InputLabel>
                                        <input
                                            readOnly={isReadOnly}
                                            className={inputStyles}
                                            placeholder="e.g. A-12"
                                            value={formData.shopNumber}
                                            onChange={e => setFormData({ ...formData, shopNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <InputLabel>Reg. Date</InputLabel>
                                        <input
                                            readOnly={isReadOnly}
                                            type="date"
                                            className={inputStyles}
                                            value={formData.registrationDate}
                                            onChange={e => setFormData({ ...formData, registrationDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <InputLabel>Shop Name</InputLabel>
                                        <input
                                            readOnly={isReadOnly}
                                            className={inputStyles}
                                            placeholder="Enter shop name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <InputLabel>Physical Address</InputLabel>
                                        <textarea
                                            readOnly={isReadOnly}
                                            className={`${inputStyles} h-20 resize-none py-3`}
                                            placeholder="Street, Block, Area..."
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Ownership Information</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <InputLabel>Legal Owner Full Name</InputLabel>
                                        <input
                                            readOnly={isReadOnly}
                                            className={inputStyles}
                                            placeholder="As per CNIC"
                                            value={formData.ownerName}
                                            onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel>Owner CNIC</InputLabel>
                                            <input
                                                readOnly={isReadOnly}
                                                className={inputStyles}
                                                placeholder="XXXXX-XXXXXXX-X"
                                                value={formData.cnic}
                                                onChange={e => setFormData({ ...formData, cnic: maskCnic(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel>Mobile Number</InputLabel>
                                            <input
                                                readOnly={isReadOnly}
                                                className={inputStyles}
                                                placeholder="03XX-XXXXXXX"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8 border-l border-slate-50 dark:border-slate-800 md:pl-12">
                            <section className="space-y-5">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Technical Configuration</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <InputLabel>Meter Serial Number</InputLabel>
                                        <input
                                            readOnly={isReadOnly}
                                            className={inputStyles}
                                            placeholder="Scan or enter hardware ID"
                                            value={formData.meterSerial}
                                            onChange={e => setFormData({ ...formData, meterSerial: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel>Current Reading (kWh)</InputLabel>
                                            <input
                                                readOnly={isReadOnly}
                                                type="number"
                                                step="0.1"
                                                className={inputStyles}
                                                value={formData.initialReadingBefore}
                                                onChange={e => setFormData({ ...formData, initialReadingBefore: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel>Reading After (Opt)</InputLabel>
                                            <input
                                                readOnly={isReadOnly}
                                                type="number"
                                                step="0.1"
                                                className={inputStyles}
                                                placeholder="Optional"
                                                value={formData.initialReadingAfter}
                                                onChange={e => setFormData({ ...formData, initialReadingAfter: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-purple-500" />
                                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Media Verification</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <PhotoUpload
                                        label="Customer Photo"
                                        image={customerImage}
                                        onClear={() => setCustomerImage(null)}
                                        fileRef={customerFileRef}
                                        cameraRef={customerCameraRef}
                                        onFileChange={(e) => handleImageCapture(e, setCustomerImage)}
                                        icon={User}
                                    />
                                    <PhotoUpload
                                        label="Meter Physical Photo"
                                        image={meterImage}
                                        onClear={() => setMeterImage(null)}
                                        fileRef={meterFileRef}
                                        cameraRef={meterCameraRef}
                                        onFileChange={(e) => handleImageCapture(e, setMeterImage)}
                                        icon={Zap}
                                    />
                                </div>
                            </section>
                        </div>
                    </div>
                </form>

                <div className="px-8 py-6 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/20 dark:bg-slate-800/30">
                    {isReadOnly ? (
                        <button
                            onClick={onCancel}
                            className="px-8 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg text-center"
                        >
                            Close Record
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onCancel}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                type="button"
                            >
                                Discard Changes
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-black dark:hover:bg-emerald-500 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                                type="button"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isEditMode ? 'Update Record' : 'Create Registry'}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopForm;
