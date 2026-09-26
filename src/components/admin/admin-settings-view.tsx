import { useState } from "react";
import type { OutletSettings, StaffAccount, BranchOutlet } from "./types";
import {
  Settings,
  Store,
  CreditCard,
  Users,
  ShieldCheck,
  KeyRound,
  Plus,
  CheckCircle2,
  UserCheck,
  Building,
  Save,
  X,
  MapPin,
  Edit2,
  LockKeyhole,
  Check,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { INITIAL_BRANCHES } from "./mock-data";

interface AdminSettingsViewProps {
  settings: OutletSettings;
  staffAccounts: StaffAccount[];
  branches?: BranchOutlet[];
  onUpdateSettings: (newSettings: OutletSettings) => void;
  onAddStaff: (newStaff: Omit<StaffAccount, "id" | "lastLogin">) => void;
  onUpdateStaffPin: (staffId: string, newPin: string) => void;
  onResetStaffPassword?: (staffId: string, newPass: string) => void;
  onUpdateStaffBranch?: (
    staffId: string,
    branchId: string,
    branchName: string,
  ) => void;
  onToggleStaffStatus: (staffId: string) => void;
  onAddBranch?: (newBranch: Omit<BranchOutlet, "id">) => void;
  onUpdateBranch?: (branchId: string, updates: Partial<BranchOutlet>) => void;
  onDeleteBranch?: (branchId: string) => void;
}

export function AdminSettingsView({
  settings,
  staffAccounts,
  branches = INITIAL_BRANCHES,
  onUpdateSettings,
  onAddStaff,
  onUpdateStaffPin,
  onResetStaffPassword,
  onUpdateStaffBranch,
  onToggleStaffStatus,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
}: AdminSettingsViewProps) {
  const [activeSection, setActiveSection] = useState<
    "outlet" | "branches" | "tax" | "staff"
  >("outlet");

  // Form State for Settings
  const [outletForm, setOutletForm] = useState<OutletSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Modal States
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffForPinReset, setStaffForPinReset] = useState<StaffAccount | null>(
    null,
  );
  const [staffForPasswordReset, setStaffForPasswordReset] =
    useState<StaffAccount | null>(null);
  const [staffForBranchAssignment, setStaffForBranchAssignment] =
    useState<StaffAccount | null>(null);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);

  // Add Staff Form
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    email: "",
    role: "cashier" as "cashier" | "owner",
    pin: "",
    branchId: branches[0]?.id || "branch-1",
  });

  // Pin & Password Reset Inputs
  const [newPinInput, setNewPinInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [selectedBranchForStaff, setSelectedBranchForStaff] = useState("");

  // Add Branch Form
  const [newBranchForm, setNewBranchForm] = useState({
    name: "",
    code: "",
    address: "",
    city: "Jakarta Selatan",
    phone: "0812-9988-1234",
    email: "",
    pin: "1234",
  });

  // Edit & Delete Branch States
  const [branchForEdit, setBranchForEdit] = useState<BranchOutlet | null>(null);
  const [editBranchForm, setEditBranchForm] = useState({
    name: "",
    code: "",
    address: "",
    city: "Jakarta Selatan",
    phone: "",
    email: "",
    pin: "",
    isActive: true,
  });
  const [branchForDelete, setBranchForDelete] = useState<BranchOutlet | null>(
    null,
  );

  const handleEditBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !branchForEdit ||
      !editBranchForm.name.trim() ||
      !editBranchForm.code.trim()
    )
      return;

    if (onUpdateBranch) {
      onUpdateBranch(branchForEdit.id, {
        name: editBranchForm.name,
        branchCode: editBranchForm.code.toUpperCase(),
        code: editBranchForm.code.toUpperCase(),
        address: editBranchForm.address,
        city: editBranchForm.city,
        phone: editBranchForm.phone,
        email: editBranchForm.email,
        pin: editBranchForm.pin,
        isActive: editBranchForm.isActive,
      });
    }

    setBranchForEdit(null);
    setSavedSuccess(
      `Informasi akun cabang ${editBranchForm.name} berhasil diperbarui!`,
    );
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleDeleteBranchConfirm = () => {
    if (!branchForDelete) return;
    if (branchForDelete.id === "branch-1") {
      setSavedSuccess("Cabang Pusat Induk (Flagship) tidak dapat dihapus!");
      setBranchForDelete(null);
      setTimeout(() => setSavedSuccess(null), 3000);
      return;
    }

    if (onDeleteBranch) {
      onDeleteBranch(branchForDelete.id);
    }

    setSavedSuccess(`Cabang ${branchForDelete.name} berhasil dihapus.`);
    setBranchForDelete(null);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(outletForm);
    setSavedSuccess("Pengaturan profil berhasil disimpan!");
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name.trim() || !newStaffForm.pin) return;

    const assignedBranch = branches.find((b) => b.id === newStaffForm.branchId);

    onAddStaff({
      name: newStaffForm.name,
      email:
        newStaffForm.email ||
        `${newStaffForm.name.toLowerCase().replace(/\s+/g, ".")}@macmood.id`,
      role: newStaffForm.role,
      pin: newStaffForm.pin,
      branchId: newStaffForm.branchId,
      branchName: assignedBranch?.name || "Cabang Pusat",
      isActive: true,
    });

    setIsAddStaffOpen(false);
    setNewStaffForm({
      name: "",
      email: "",
      role: "cashier",
      pin: "",
      branchId: branches[0]?.id || "branch-1",
    });
    setSavedSuccess("Akun staf baru berhasil ditambahkan!");
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handlePinResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForPinReset || !newPinInput) return;

    onUpdateStaffPin(staffForPinReset.id, newPinInput);
    setStaffForPinReset(null);
    setNewPinInput("");
    setSavedSuccess(`PIN kasir ${staffForPinReset.name} berhasil diperbarui.`);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForPasswordReset || !newPasswordInput) return;

    if (onResetStaffPassword) {
      onResetStaffPassword(staffForPasswordReset.id, newPasswordInput);
    }
    setStaffForPasswordReset(null);
    setNewPasswordInput("");
    setSavedSuccess(
      `Password akun ${staffForPasswordReset.name} berhasil di-reset.`,
    );
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleBranchAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForBranchAssignment || !selectedBranchForStaff) return;

    const targetBranch = branches.find((b) => b.id === selectedBranchForStaff);
    if (targetBranch && onUpdateStaffBranch) {
      onUpdateStaffBranch(
        staffForBranchAssignment.id,
        targetBranch.id,
        targetBranch.name,
      );
    }
    setStaffForBranchAssignment(null);
    setSavedSuccess(
      `Cabang penugasan ${staffForBranchAssignment.name} berhasil diubah.`,
    );
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchForm.name.trim() || !newBranchForm.code.trim()) return;

    if (onAddBranch) {
      onAddBranch({
        name: newBranchForm.name,
        branchCode: newBranchForm.code.toUpperCase(),
        code: newBranchForm.code.toUpperCase(),
        address: newBranchForm.address,
        city: newBranchForm.city,
        phone: newBranchForm.phone,
        email:
          newBranchForm.email ||
          `${newBranchForm.code.toLowerCase()}@macmood.id`,
        pin: newBranchForm.pin || "1234",
        isActive: true,
      });
    }

    setIsAddBranchOpen(false);
    setNewBranchForm({
      name: "",
      code: "",
      address: "",
      city: "Jakarta Selatan",
      phone: "0812-9988-1234",
      email: "",
      pin: "1234",
    });
    setSavedSuccess(`Akun cabang ${newBranchForm.name} berhasil ditambahkan!`);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-green-800 uppercase tracking-widest mb-1">
            <Settings className="size-4" />
            <span>Konfigurasi & Hak Akses Multi-Cabang</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-brand-green-950">
            Pengaturan Cabang, Pajak & Akun Kredensial
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Kelola profil outlet, penambahan cabang baru, konfigurasi PB1/QRIS,
            serta hak akses dan akun kasir cabang.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-brand-cream-100 text-brand-green-950 font-bold text-xs border border-brand-green-900/20 shadow-2xs">
            <CheckCircle2 className="size-4 text-brand-green-800" />
            <span>{savedSuccess}</span>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-green-900/10 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSection("outlet")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "outlet"
              ? "bg-brand-green-900 text-brand-yellow-400 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <Building className="size-3.5" />
          <span>Profil Kantor Pusat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("branches")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "branches"
              ? "bg-brand-green-900 text-brand-yellow-400 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <Store className="size-3.5" />
          <span>Manajemen Cabang ({branches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("tax")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "tax"
              ? "bg-brand-green-900 text-brand-yellow-400 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <CreditCard className="size-3.5" />
          <span>Pajak (PB1) & QRIS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("staff")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === "staff"
              ? "bg-brand-green-900 text-brand-yellow-400 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <Users className="size-3.5" />
          <span>Akun & Kredensial POS ({staffAccounts.length})</span>
        </button>
      </div>

      {/* Section 1: Profil Kantor Pusat */}
      {activeSection === "outlet" && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-6"
        >
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Building className="size-5 text-brand-green-900" />
            <div>
              <h3 className="font-display font-extrabold text-base text-brand-green-950">
                Identitas & Lokasi Kantor Pusat MacMood
              </h3>
              <p className="text-[11px] text-neutral-500">
                Profil badan usaha induk (Corporate HQ) yang memayungi seluruh
                outlet fisik MacMood.
              </p>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-brand-cream-100 border border-brand-green-900/15 flex items-start gap-3">
            <div className="size-9 rounded-xl bg-brand-green-950 text-brand-yellow-400 flex items-center justify-center shrink-0">
              <Building className="size-5" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-xs text-brand-green-950 uppercase tracking-wider">
                Entitas Bisnis Utama (Corporate Headquarters)
              </h4>
              <p className="text-xs text-neutral-600 mt-0.5">
                Profil ini merepresentasikan badan usaha induk{" "}
                <strong>
                  MacMood Indonesia (PT MacMood Kuliner Nusantara)
                </strong>
                . Kantor pusat mengawasi seluruh outlet fisik operasional (
                {branches.length} cabang aktif: Fatmawati, Margonda, dan Tebet).
                Pengaturan cabang individual dapat dikelola di tab{" "}
                <strong>Manajemen Cabang</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Nama Usaha / Brand
              </label>
              <input
                type="text"
                required
                value={outletForm.name}
                onChange={(e) =>
                  setOutletForm({ ...outletForm, name: e.target.value })
                }
                className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Kode Identitas Pusat
              </label>
              <input
                type="text"
                required
                value={outletForm.branchCode}
                onChange={(e) =>
                  setOutletForm({ ...outletForm, branchCode: e.target.value })
                }
                className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Alamat Kantor Pusat & Dapur Induk
              </label>
              <textarea
                rows={2}
                required
                value={outletForm.address}
                onChange={(e) =>
                  setOutletForm({ ...outletForm, address: e.target.value })
                }
                className="w-full p-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Kota
              </label>
              <input
                type="text"
                required
                value={outletForm.city}
                onChange={(e) =>
                  setOutletForm({ ...outletForm, city: e.target.value })
                }
                className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                No. Kontak / Hotline
              </label>
              <input
                type="text"
                required
                value={outletForm.phone}
                onChange={(e) =>
                  setOutletForm({ ...outletForm, phone: e.target.value })
                }
                className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Zona Waktu
              </label>
              <select
                value={outletForm.timezone}
                onChange={(e) =>
                  setOutletForm({ ...outletForm, timezone: e.target.value })
                }
                className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-brand-green-800"
              >
                <option value="Asia/Jakarta (WIB)">
                  Asia/Jakarta (WIB - UTC+7)
                </option>
                <option value="Asia/Makassar (WITA)">
                  Asia/Makassar (WITA - UTC+8)
                </option>
                <option value="Asia/Jayapura (WIT)">
                  Asia/Jayapura (WIT - UTC+9)
                </option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-neutral-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-extrabold text-xs shadow-xs cursor-pointer"
            >
              <Save className="size-4" />
              <span>Simpan Profil Pusat</span>
            </button>
          </div>
        </form>
      )}

      {/* Section 2: Manajemen Multi-Cabang */}
      {activeSection === "branches" && (
        <div className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Store className="size-5 text-brand-green-900" />
              <div>
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Daftar Cabang & Outlet Operasional
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Kelola titik gerai (POS), alamat gerai, PIC cabang, serta
                  lakukan penambahan, pengeditan, atau penghapusan cabang.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddBranchOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-bold text-xs cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <Plus className="size-3.5" />
              <span>+ Tambah Cabang Baru</span>
            </button>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-brand-cream-100 border border-brand-green-900/15 flex items-start gap-3">
            <div className="size-9 rounded-xl bg-brand-green-900 text-brand-yellow-400 flex items-center justify-center shrink-0">
              <Store className="size-5" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-xs text-brand-green-950 uppercase tracking-wider">
                Jaringan Outlet & Akun Cabang POS ({branches.length} Cabang
                Aktif)
              </h4>
              <p className="text-xs text-neutral-600 mt-0.5">
                Masing-masing cabang memiliki akun mandiri (email cabang & PIN
                kasir POS), kode unik gerai, alamat operasional, dan data
                penjualan terintegrasi. Gunakan tombol <strong>Edit</strong>{" "}
                untuk mengubah kredensial/info atau <strong>Hapus</strong> untuk
                menutup cabang non-pusat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-3xl border border-neutral-200/80 bg-neutral-50/50 hover:bg-brand-cream-50 hover:border-brand-green-900/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green-900 bg-brand-cream-100 px-2.5 py-0.5 rounded-full border border-brand-green-900/15">
                      {b.branchCode || b.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold ${b.isActive !== false ? "text-brand-green-800" : "text-neutral-500"}`}
                    >
                      <span
                        className={`size-2 rounded-full ${b.isActive !== false ? "bg-brand-green-900" : "bg-neutral-400"}`}
                      />
                      {b.isActive !== false
                        ? "Aktif Melayani"
                        : "Sementara Tutup"}
                    </span>
                  </div>

                  <h4 className="font-display font-black text-base text-brand-green-950">
                    {b.name}
                  </h4>
                  <p className="text-xs text-neutral-600 mt-1 flex items-start gap-1">
                    <MapPin className="size-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <span>
                      {b.address}, {b.city}
                    </span>
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-200/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Email Akun:</span>
                    <span className="font-mono text-neutral-900 font-semibold">
                      {b.email ||
                        `${(b.branchCode || "cabang").toLowerCase()}@macmood.id`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">PIN Kasir POS:</span>
                    <span className="font-mono bg-neutral-200/70 px-2 py-0.5 rounded text-neutral-800 font-bold">
                      {b.pin || "1234"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">No. Telepon:</span>
                    <span className="font-mono text-neutral-700">
                      {b.phone}
                    </span>
                  </div>

                  {/* Action Buttons: Edit and Delete */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200/50">
                    <button
                      type="button"
                      onClick={() => {
                        setBranchForEdit(b);
                        setEditBranchForm({
                          name: b.name,
                          code: b.branchCode || b.code || "",
                          address: b.address,
                          city: b.city,
                          phone: b.phone,
                          email:
                            b.email ||
                            `${(b.branchCode || "cabang").toLowerCase()}@macmood.id`,
                          pin: b.pin || "1234",
                          isActive: b.isActive !== false,
                        });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold border border-neutral-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit2 className="size-3 text-neutral-600" />
                      <span>Edit</span>
                    </button>

                    {b.id !== "branch-1" ? (
                      <button
                        type="button"
                        onClick={() => setBranchForDelete(b)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Trash2 className="size-3 text-red-500" />
                        <span>Hapus</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-neutral-400 font-semibold px-2 py-1 bg-neutral-100 rounded-lg">
                        Pusat (Protected)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Pajak & QRIS */}
      {activeSection === "tax" && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-6"
        >
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
                  onChange={(e) =>
                    setOutletForm({
                      ...outletForm,
                      taxRate: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-green-800"
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
                    setOutletForm({
                      ...outletForm,
                      serviceChargeRate: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold">
                  %
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Opsional untuk pesanan dine-in di restoran.
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
                  setOutletForm({
                    ...outletForm,
                    qrisMerchantName: e.target.value,
                  })
                }
                className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
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
                onChange={(e) =>
                  setOutletForm({ ...outletForm, qrisNmid: e.target.value })
                }
                className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
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
                onChange={(e) =>
                  setOutletForm({ ...outletForm, bankName: e.target.value })
                }
                className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
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
                onChange={(e) =>
                  setOutletForm({ ...outletForm, bankAccount: e.target.value })
                }
                className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-neutral-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-extrabold text-xs shadow-xs cursor-pointer"
            >
              <Save className="size-4" />
              <span>Simpan Pajak & QRIS</span>
            </button>
          </div>
        </form>
      )}

      {/* Section 4: Akun Staf & Penugasan Cabang */}
      {activeSection === "staff" && (
        <div className="bg-white p-6 rounded-3xl border border-brand-green-900/10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-brand-green-900" />
              <div>
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Daftar Akun Pengguna & Kredensial POS
                </h3>
                <span className="text-[11px] text-neutral-500">
                  Kelola akun login owner, akun operasional cabang, reset
                  password, dan reset PIN cepat POS.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddStaffOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-bold text-xs cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <Plus className="size-3.5" />
              <span>Tambah Akun Baru</span>
            </button>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-brand-cream-100 border border-brand-green-900/15 flex items-start gap-3">
            <div className="size-9 rounded-xl bg-brand-green-900 text-brand-yellow-400 flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-xs text-brand-green-950 uppercase tracking-wider">
                Hierarki Akun, Kredensial & Hak Akses
              </h4>
              <p className="text-xs text-neutral-600 mt-0.5">
                Akun terbagi menjadi Owner Admin (Muhammad Afrizal) untuk
                kendali manajerial global dan Akun Cabang (Fatmawati, Margonda,
                Tebet) untuk operasional kasir POS di masing-masing gerai.
                Seluruh data transaksi, shift laci, dan pengeluaran terisolasi
                rapi per akun cabang.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Nama Staf</th>
                  <th className="py-3 px-4">Role Akses</th>
                  <th className="py-3 px-4">Cabang Penugasan</th>
                  <th className="py-3 px-4 text-center">PIN Cepat</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Tindakan Keamanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans">
                {staffAccounts.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-brand-cream-50/50 transition-colors"
                  >
                    {/* Name & Email */}
                    <td className="py-3 px-4">
                      <strong className="font-display font-bold text-sm text-neutral-900 block">
                        {staff.name}
                      </strong>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {staff.email}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          staff.role === "owner"
                            ? "bg-brand-green-950 text-brand-yellow-400"
                            : "bg-brand-cream-100 text-brand-green-950 border border-brand-green-900/15"
                        }`}
                      >
                        {staff.role === "owner" ? (
                          <ShieldCheck className="size-3" />
                        ) : (
                          <UserCheck className="size-3" />
                        )}
                        <span>
                          {staff.role === "owner"
                            ? "Business Owner"
                            : "Kasir Cabang"}
                        </span>
                      </span>
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-medium ${staff.role === "owner" ? "text-brand-green-900 font-bold" : "text-brand-green-950"}`}
                        >
                          {staff.role === "owner"
                            ? "Akses Global (Semua Cabang)"
                            : staff.branchName || "MacMood Pusat - Fatmawati"}
                        </span>
                        {staff.role !== "owner" && (
                          <button
                            type="button"
                            onClick={() => {
                              setStaffForBranchAssignment(staff);
                              setSelectedBranchForStaff(
                                staff.branchId || branches[0]?.id || "branch-1",
                              );
                            }}
                            className="size-5 rounded-md hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer"
                            title="Ubah Cabang Penugasan"
                          >
                            <Edit2 className="size-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* PIN */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono bg-neutral-100 px-2 py-1 rounded-md text-neutral-700 font-bold">
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
                            ? "bg-brand-cream-200 text-brand-green-950"
                            : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {staff.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setStaffForPinReset(staff);
                            setNewPinInput("");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-bold text-[11px] cursor-pointer"
                          title="Reset PIN Cepat Kasir"
                        >
                          <KeyRound className="size-3 text-neutral-500" />
                          <span>Reset PIN</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setStaffForPasswordReset(staff);
                            setNewPasswordInput("");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-bold text-[11px] cursor-pointer"
                          title="Reset Password Login Akun"
                        >
                          <LockKeyhole className="size-3 text-neutral-500" />
                          <span>Reset Password</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ------------------------------------------------------------- */}

      {/* Modal: Tambah Cabang Baru */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Store className="size-5 text-brand-green-900" />
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Tambah Cabang Baru MacMood
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBranchOpen(false)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddBranchSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Nama Cabang / Outlet{" "}
                  <span className="text-brand-coral-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: MacMood Express - BSD"
                  value={newBranchForm.name}
                  onChange={(e) =>
                    setNewBranchForm({ ...newBranchForm, name: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Kode Cabang <span className="text-brand-coral-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BSD-04"
                    value={newBranchForm.code}
                    onChange={(e) =>
                      setNewBranchForm({
                        ...newBranchForm,
                        code: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-green-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Kota <span className="text-brand-coral-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tangerang Selatan"
                    value={newBranchForm.city}
                    onChange={(e) =>
                      setNewBranchForm({
                        ...newBranchForm,
                        city: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Alamat Lengkap Gerai{" "}
                  <span className="text-brand-coral-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jl. BSD Boulevard No. 12..."
                  value={newBranchForm.address}
                  onChange={(e) =>
                    setNewBranchForm({
                      ...newBranchForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Email Akun Cabang{" "}
                    <span className="text-brand-coral-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="bsd@macmood.id"
                    value={newBranchForm.email}
                    onChange={(e) =>
                      setNewBranchForm({
                        ...newBranchForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    PIN Akses POS (4 Digit){" "}
                    <span className="text-brand-coral-600">*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="1234"
                    value={newBranchForm.pin}
                    onChange={(e) =>
                      setNewBranchForm({
                        ...newBranchForm,
                        pin: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-brand-green-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  No. Telepon / WhatsApp{" "}
                  <span className="text-brand-coral-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0812-xxxx-xxxx"
                  value={newBranchForm.phone}
                  onChange={(e) =>
                    setNewBranchForm({
                      ...newBranchForm,
                      phone: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-4 py-2 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Simpan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Staf Baru */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/70 backdrop-blur-xs">
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
                  Nama Lengkap <span className="text-brand-coral-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStaffForm.name}
                  onChange={(e) =>
                    setNewStaffForm({ ...newStaffForm, name: e.target.value })
                  }
                  placeholder="Misal: Andi Pratama"
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Email Akun (Opsional)
                </label>
                <input
                  type="email"
                  value={newStaffForm.email}
                  onChange={(e) =>
                    setNewStaffForm({ ...newStaffForm, email: e.target.value })
                  }
                  placeholder="andi.kasir@macmood.id"
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Role Jabatan
                </label>
                <select
                  value={newStaffForm.role}
                  onChange={(e) =>
                    setNewStaffForm({
                      ...newStaffForm,
                      role: e.target.value as "cashier" | "owner",
                    })
                  }
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-brand-green-800"
                >
                  <option value="cashier">Kasir Outlet</option>
                  <option value="owner">Business Owner / Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Penugasan Cabang
                </label>
                <select
                  value={newStaffForm.branchId}
                  onChange={(e) =>
                    setNewStaffForm({
                      ...newStaffForm,
                      branchId: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-brand-green-800"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.branchCode || b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  PIN 4 Digit Kasir{" "}
                  <span className="text-brand-coral-600">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newStaffForm.pin}
                  onChange={(e) =>
                    setNewStaffForm({ ...newStaffForm, pin: e.target.value })
                  }
                  placeholder="••••"
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset PIN */}
      {staffForPinReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-brand-green-900" />
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
              Ganti PIN login cepat untuk{" "}
              <strong className="text-neutral-900">
                {staffForPinReset.name}
              </strong>{" "}
              ({staffForPinReset.email}).
            </p>

            <form onSubmit={handlePinResetSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Masukkan PIN Baru (4 Digit){" "}
                  <span className="text-brand-coral-600">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffForPinReset(null)}
                  className="px-4 py-2 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Perbarui PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {staffForPasswordReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <LockKeyhole className="size-4 text-brand-green-900" />
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Reset Password Staf
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStaffForPasswordReset(null)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Tetapkan kata sandi baru untuk login email akun{" "}
              <strong className="text-neutral-900">
                {staffForPasswordReset.name}
              </strong>
              .
            </p>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Password Baru <span className="text-brand-coral-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffForPasswordReset(null)}
                  className="px-4 py-2 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Atur Cabang Penugasan */}
      {staffForBranchAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-brand-green-900" />
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  Atur Cabang Penugasan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStaffForBranchAssignment(null)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Pilih cabang operasional tempat staf{" "}
              <strong className="text-neutral-900">
                {staffForBranchAssignment.name}
              </strong>{" "}
              ditugaskan:
            </p>

            <form onSubmit={handleBranchAssignmentSubmit} className="space-y-3">
              <div className="space-y-2">
                {branches.map((b) => {
                  const isSelected = selectedBranchForStaff === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBranchForStaff(b.id)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-brand-green-900 border-brand-green-900 text-white shadow-2xs"
                          : "bg-neutral-50 hover:bg-brand-cream-100 border-neutral-200 text-brand-green-950"
                      }`}
                    >
                      <div>
                        <strong className="text-xs block">{b.name}</strong>
                        <span
                          className={`text-[11px] ${isSelected ? "text-brand-cream-200" : "text-neutral-500"}`}
                        >
                          {b.address}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="size-4 text-brand-yellow-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffForBranchAssignment(null)}
                  className="px-4 py-2 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Tugaskan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Informasi Cabang */}
      {branchForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Store className="size-5 text-brand-green-900" />
                <div>
                  <h3 className="font-display font-extrabold text-base text-brand-green-950">
                    Edit Informasi Cabang
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    ID: {branchForEdit.id} · Kode:{" "}
                    {branchForEdit.branchCode || branchForEdit.code}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBranchForEdit(null)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleEditBranchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Nama Cabang Outlet{" "}
                    <span className="text-brand-coral-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editBranchForm.name}
                    onChange={(e) =>
                      setEditBranchForm({
                        ...editBranchForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Kode Cabang POS{" "}
                    <span className="text-brand-coral-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editBranchForm.code}
                    onChange={(e) =>
                      setEditBranchForm({
                        ...editBranchForm,
                        code: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono font-bold uppercase focus:outline-none focus:border-brand-green-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Email Akun Cabang{" "}
                    <span className="text-brand-coral-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editBranchForm.email}
                    onChange={(e) =>
                      setEditBranchForm({
                        ...editBranchForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    PIN Kasir POS (4 Digit){" "}
                    <span className="text-brand-coral-600">*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={editBranchForm.pin}
                    onChange={(e) =>
                      setEditBranchForm({
                        ...editBranchForm,
                        pin: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-brand-green-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Alamat Lengkap Gerai
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editBranchForm.address}
                    onChange={(e) =>
                      setEditBranchForm({
                        ...editBranchForm,
                        address: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Kota
                  </label>
                  <input
                    type="text"
                    required
                    value={editBranchForm.city}
                    onChange={(e) =>
                      setEditBranchForm({
                        ...editBranchForm,
                        city: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    No. Telepon Gerai
                  </label>
                  <input
                    type="text"
                    required
                    value={editBranchForm.phone}
                    onChange={(e) =>
                      setEditBranchForm({
                        ...editBranchForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-mono focus:outline-none focus:border-brand-green-800"
                  />
                </div>

                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBranchForm.isActive}
                      onChange={(e) =>
                        setEditBranchForm({
                          ...editBranchForm,
                          isActive: e.target.checked,
                        })
                      }
                      className="size-4 rounded text-brand-green-900 accent-brand-green-900"
                    />
                    <span className="text-xs font-bold text-neutral-800">
                      Cabang Aktif Melayani (Status Operasional Buka)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setBranchForEdit(null)}
                  className="px-4 py-2 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Hapus Cabang Operasional */}
      {branchForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="size-5" />
                <h3 className="font-display font-extrabold text-base text-neutral-900">
                  Hapus Cabang Outlet?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBranchForDelete(null)}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-600">
              <p>
                Apakah Anda yakin ingin menghapus cabang{" "}
                <strong>{branchForDelete.name}</strong> (
                {branchForDelete.branchCode || branchForDelete.code})?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] leading-relaxed">
                Staf kasir yang sebelumnya ditugaskan di cabang ini akan
                otomatis dialihkan ke MacMood Pusat - Fatmawati.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setBranchForDelete(null)}
                className="px-4 py-2 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteBranchConfirm}
                className="px-5 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
