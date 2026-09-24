import { useState } from "react";
import type { OutletSettings, StaffAccount } from "./types";
import {
  Settings,
  Store,
  CreditCard,
  Users,
  ShieldCheck,
  KeyRound,
  Plus,
  CheckCircle2,
  Lock,
  UserCheck,
  Building,
  Save,
  X,
} from "lucide-react";

interface AdminSettingsViewProps {
  settings: OutletSettings;
  staffAccounts: StaffAccount[];
  onUpdateSettings: (newSettings: OutletSettings) => void;
  onAddStaff: (newStaff: Omit<StaffAccount, "id" | "lastLogin">) => void;
  onUpdateStaffPin: (staffId: string, newPin: string) => void;
  onToggleStaffStatus: (staffId: string) => void;
}

export function AdminSettingsView({
  settings,
  staffAccounts,
  onUpdateSettings,
  onAddStaff,
  onUpdateStaffPin,
  onToggleStaffStatus,
}: AdminSettingsViewProps) {
  const [activeSection, setActiveSection] = useState<"outlet" | "tax" | "staff">("outlet");

  // Form State for Settings
  const [outletForm, setOutletForm] = useState<OutletSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modal States
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffForPinReset, setStaffForPinReset] = useState<StaffAccount | null>(null);

  // Add Staff Form
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    email: "",
    role: "cashier" as "cashier" | "owner",
    pin: "",
  });

  // Pin Reset Form
  const [newPinInput, setNewPinInput] = useState("");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(outletForm);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name.trim() || !newStaffForm.pin) return;

    onAddStaff({
      name: newStaffForm.name,
      email: newStaffForm.email || `${newStaffForm.name.toLowerCase().replace(/\s+/g, ".")}@macmood.id`,
      role: newStaffForm.role,
      pin: newStaffForm.pin,
      isActive: true,
    });

    setIsAddStaffOpen(false);
    setNewStaffForm({ name: "", email: "", role: "cashier", pin: "" });
  };

  const handlePinResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForPinReset || !newPinInput) return;

    onUpdateStaffPin(staffForPinReset.id, newPinInput);
    setStaffForPinReset(null);
    setNewPinInput("");
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-green-800 uppercase tracking-widest mb-1">
            <Settings className="size-4" />
            <span>Konfigurasi & Hak Akses</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-brand-green-950">
            Pengaturan Outlet & Staf
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Konfigurasi profil cabang, tarif PB1 restoran, rekening QRIS, serta PIN login staf kasir.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
            <CheckCircle2 className="size-4" />
            <span>Pengaturan tersimpan!</span>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-green-900/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveSection("outlet")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "outlet"
              ? "bg-brand-green-900 text-white shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <Store className="size-3.5" />
          <span>Profil Cabang</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("tax")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "tax"
              ? "bg-brand-green-900 text-white shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <CreditCard className="size-3.5" />
          <span>Pajak (PB1) & QRIS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("staff")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "staff"
              ? "bg-brand-green-900 text-white shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <Users className="size-3.5" />
          <span>Akun Staf & Kasir ({staffAccounts.length})</span>
        </button>
      </div>

      {/* Section 1: Profil Outlet */}
      {activeSection === "outlet" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Building className="size-5 text-brand-green-900" />
            <h3 className="font-display font-extrabold text-base text-brand-green-950">
              Identitas & Lokasi Cabang Outlet
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Nama Outlet Cabang
              </label>
              <input
                type="text"
                required
                value={outletForm.name}
                onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Kode Cabang (Branch Code)
              </label>
              <input
                type="text"
                required
                value={outletForm.branchCode}
                onChange={(e) => setOutletForm({ ...outletForm, branchCode: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Alamat Lengkap Outlet
              </label>
              <textarea
                rows={2}
                required
                value={outletForm.address}
                onChange={(e) => setOutletForm({ ...outletForm, address: e.target.value })}
                className="w-full p-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Kota</label>
              <input
                type="text"
                required
                value={outletForm.city}
                onChange={(e) => setOutletForm({ ...outletForm, city: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">No. Kontak / WhatsApp Outlet</label>
              <input
                type="text"
                required
                value={outletForm.phone}
                onChange={(e) => setOutletForm({ ...outletForm, phone: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Zona Waktu Operasional</label>
              <select
                value={outletForm.timezone}
                onChange={(e) => setOutletForm({ ...outletForm, timezone: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-brand-green-800"
              >
                <option value="Asia/Jakarta (WIB)">Asia/Jakarta (WIB - UTC+7)</option>
                <option value="Asia/Makassar (WITA)">Asia/Makassar (WITA - UTC+8)</option>
                <option value="Asia/Jayapura (WIT)">Asia/Jayapura (WIT - UTC+9)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-neutral-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
            >
              <Save className="size-4" />
              <span>Simpan Profil Outlet</span>
            </button>
          </div>
        </form>
      )}

      {/* Section 2: Pajak & QRIS */}
      {activeSection === "tax" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <CreditCard className="size-5 text-brand-green-900" />
            <h3 className="font-display font-extrabold text-base text-brand-green-950">
              Pengaturan Pajak Restoran (PB1) & Merchant QRIS
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Tarif PB1 Restoran (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  required
                  value={outletForm.taxRate}
                  onChange={(e) => setOutletForm({ ...outletForm, taxRate: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-green-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold">
                  %
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Otomatis dihitung pada subtotal nota setiap transaksi kasir.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Service Charge (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={outletForm.serviceChargeRate}
                  onChange={(e) =>
                    setOutletForm({ ...outletForm, serviceChargeRate: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold">
                  %
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Opsional untuk layanan pesan-antar atau dine-in.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Nama Merchant QRIS
              </label>
              <input
                type="text"
                required
                value={outletForm.qrisMerchantName}
                onChange={(e) =>
                  setOutletForm({ ...outletForm, qrisMerchantName: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                NMID QRIS Nasional
              </label>
              <input
                type="text"
                required
                value={outletForm.qrisNmid}
                onChange={(e) => setOutletForm({ ...outletForm, qrisNmid: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Nama Bank Penampungan
              </label>
              <input
                type="text"
                required
                value={outletForm.bankName}
                onChange={(e) => setOutletForm({ ...outletForm, bankName: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Nomor Rekening Bank
              </label>
              <input
                type="text"
                required
                value={outletForm.bankAccount}
                onChange={(e) => setOutletForm({ ...outletForm, bankAccount: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-neutral-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
            >
              <Save className="size-4" />
              <span>Simpan Pajak & QRIS</span>
            </button>
          </div>
        </form>
      )}

      {/* Section 3: Akun Staf & PIN Kasir */}
      {activeSection === "staff" && (
        <div className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-brand-green-900" />
              <div>
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Daftar Akun Staf & Kasir
                </h3>
                <span className="text-[11px] text-neutral-500">
                  Kelola PIN cepat untuk otorisasi transaksi kasir dan buka/tutup shift.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddStaffOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-bold text-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="size-3.5 text-brand-yellow-400" />
              <span>Tambah Staf Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Nama Staf</th>
                  <th className="py-3 px-4">Role Akses</th>
                  <th className="py-3 px-4 text-center">PIN Cepat</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Login Terakhir</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans">
                {staffAccounts.map((staff) => (
                  <tr key={staff.id} className="hover:bg-brand-cream-50/50 transition-colors">
                    {/* Name & Email */}
                    <td className="py-3 px-4">
                      <strong className="font-display font-bold text-sm text-neutral-900 block">
                        {staff.name}
                      </strong>
                      <span className="text-[11px] text-neutral-500">{staff.email}</span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          staff.role === "owner"
                            ? "bg-brand-green-950 text-brand-yellow-400"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {staff.role === "owner" ? <ShieldCheck className="size-3" /> : <UserCheck className="size-3" />}
                        <span>{staff.role === "owner" ? "Business Owner" : "Kasir Outlet"}</span>
                      </span>
                    </td>

                    {/* PIN */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono bg-neutral-100 px-2 py-1 rounded text-neutral-700 font-bold">
                        ••••
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStaffStatus(staff.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          staff.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {staff.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {staff.lastLogin}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setStaffForPinReset(staff);
                          setNewPinInput("");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-bold text-[11px] cursor-pointer"
                      >
                        <KeyRound className="size-3 text-neutral-500" />
                        <span>Reset PIN</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-display font-extrabold text-base text-brand-green-950">
                Tambah Akun Staf Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  placeholder="Misal: Andi Pratama"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Alamat Email (Opsional)
                </label>
                <input
                  type="email"
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  placeholder="andi.kasir@macmood.id"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Role Jabatan</label>
                <select
                  value={newStaffForm.role}
                  onChange={(e) =>
                    setNewStaffForm({
                      ...newStaffForm,
                      role: e.target.value as "cashier" | "owner",
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-brand-green-800"
                >
                  <option value="cashier">Kasir Outlet</option>
                  <option value="owner">Business Owner / Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  PIN 4 Digit Kasir <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newStaffForm.pin}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, pin: e.target.value })}
                  placeholder="Contoh: 1234"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {staffForPinReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-brand-green-900" />
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Reset PIN Staf
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStaffForPinReset(null)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Ganti PIN cepat untuk <strong className="text-neutral-900">{staffForPinReset.name}</strong> ({staffForPinReset.email}).
            </p>

            <form onSubmit={handlePinResetSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Masukkan PIN Baru (4-6 Digit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffForPinReset(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Perbarui PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
