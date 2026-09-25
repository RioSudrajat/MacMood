import { useState, useEffect, useCallback } from "react";
import { Lock, Unlock, Delete, X, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export interface StaffPinAccount {
  id: string;
  name: string;
  role: "owner" | "cashier";
  roleLabel: string;
  pin: string;
}

export const DEMO_STAFF_PIN_ACCOUNTS: StaffPinAccount[] = [
  {
    id: "staff-1",
    name: "Muhammad Afrizal",
    role: "owner",
    roleLabel: "Business Owner",
    pin: "8899",
  },
  {
    id: "staff-2",
    name: "Budi Santoso",
    role: "cashier",
    roleLabel: "Kasir Shift Pagi",
    pin: "1234",
  },
  {
    id: "staff-3",
    name: "Siti Rahma",
    role: "cashier",
    roleLabel: "Kasir Shift Siang",
    pin: "5678",
  },
];

interface PosPinLockModalProps {
  isOpen: boolean;
  activeStaffName: string;
  onSuccessUnlock: (staff: StaffPinAccount) => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

function PosPinLockModalContent({
  activeStaffName,
  onSuccessUnlock,
  onClose,
  canDismiss = false,
}: Omit<PosPinLockModalProps, "isOpen">) {
  const [selectedStaff, setSelectedStaff] = useState<StaffPinAccount>(() => {
    return (
      DEMO_STAFF_PIN_ACCOUNTS.find((s) => s.name === activeStaffName) ||
      DEMO_STAFF_PIN_ACCOUNTS[1]
    );
  });
  const [enteredPin, setEnteredPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const validatePin = useCallback(
    (pin: string, staff: StaffPinAccount) => {
      if (pin === staff.pin) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccessUnlock(staff);
          setIsSuccess(false);
          setEnteredPin("");
        }, 400);
      } else {
        setErrorMsg("PIN salah. Silakan coba lagi.");
        setTimeout(() => {
          setEnteredPin("");
        }, 600);
      }
    },
    [onSuccessUnlock]
  );

  // Handle number click
  const handleDigit = useCallback(
    (digit: string) => {
      if (enteredPin.length >= 4 || isSuccess) return;
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);
      setErrorMsg("");

      if (newPin.length === 4) {
        validatePin(newPin, selectedStaff);
      }
    },
    [enteredPin, isSuccess, selectedStaff, validatePin]
  );

  const handleDelete = useCallback(() => {
    if (enteredPin.length > 0) {
      setEnteredPin((prev) => prev.slice(0, -1));
      setErrorMsg("");
    }
  }, [enteredPin.length]);

  const handleClear = useCallback(() => {
    setEnteredPin("");
    setErrorMsg("");
  }, []);

  // Keyboard numeric listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape" && canDismiss && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canDismiss, handleDelete, handleDigit, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 flex flex-col items-center text-center relative select-none">
        {/* Dismiss Button (if allowed) */}
        {canDismiss && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 size-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer transition-colors"
            title="Tutup Layar Kunci"
          >
            <X className="size-4" />
          </button>
        )}

        {/* Lock Icon Badge */}
        <div
          className={`size-14 rounded-2xl flex items-center justify-center mb-3 shadow-md transition-colors duration-300 ${
            isSuccess
              ? "bg-emerald-600 text-white"
              : errorMsg
                ? "bg-red-500 text-white"
                : "bg-brand-green-900 text-brand-yellow-400"
          }`}
        >
          {isSuccess ? (
            <Unlock className="size-7 animate-bounce" />
          ) : (
            <Lock className="size-7" />
          )}
        </div>

        <h3 className="font-display font-black text-xl text-brand-green-950">
          {isSuccess ? "Layar Terbuka!" : "Layar Kasir Terkunci"}
        </h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Pilih profil staf & masukkan 4-digit PIN untuk melayani pesanan
        </p>

        {/* Staff Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-brand-cream-100/80 rounded-2xl border border-brand-green-900/10 mb-5 w-full justify-center">
          {DEMO_STAFF_PIN_ACCOUNTS.map((staff) => {
            const isSelected = selectedStaff.id === staff.id;
            return (
              <button
                key={staff.id}
                type="button"
                onClick={() => {
                  setSelectedStaff(staff);
                  setEnteredPin("");
                  setErrorMsg("");
                }}
                className={`flex-1 flex flex-col items-center py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-green-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
                }`}
              >
                <span className="text-xs font-extrabold truncate max-w-[90px]">
                  {staff.name.split(" ")[0]}
                </span>
                <span
                  className={`text-[9px] font-semibold uppercase tracking-wider truncate max-w-[90px] ${
                    isSelected ? "text-brand-yellow-300" : "text-neutral-400"
                  }`}
                >
                  {staff.role === "owner" ? "Owner" : "Kasir"}
                </span>
              </button>
            );
          })}
        </div>

        {/* PIN Dots (Masked Display) */}
        <div className="flex items-center justify-center gap-3 mb-4 h-8">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <motion.div
                key={idx}
                animate={errorMsg ? { x: [-8, 8, -6, 6, 0] } : {}}
                transition={{ duration: 0.3 }}
                className={`size-4 rounded-full border-2 transition-all duration-150 ${
                  isSuccess
                    ? "bg-emerald-500 border-emerald-500 scale-110"
                    : errorMsg
                      ? "bg-red-400 border-red-500"
                      : isFilled
                        ? "bg-brand-green-900 border-brand-green-900 scale-110"
                        : "bg-white border-neutral-300"
                }`}
              />
            );
          })}
        </div>

        {/* Error / Helper Message */}
        <div className="h-5 mb-2">
          {errorMsg ? (
            <span className="text-xs font-bold text-red-600 animate-in fade-in">
              {errorMsg}
            </span>
          ) : isSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
              <ShieldCheck className="size-3.5" />
              Selamat bertugas, {selectedStaff.name.split(" ")[0]}!
            </span>
          ) : (
            <span className="text-[11px] text-neutral-400">
              Demo PIN: <strong className="text-neutral-600 font-mono">{selectedStaff.pin}</strong>
            </span>
          )}
        </div>

        {/* On-Screen Touch Numpad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-neutral-50 hover:bg-brand-cream-100 active:scale-95 text-brand-green-950 font-display font-black text-lg border border-neutral-200 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer"
            title="Hapus Semua"
          >
            C
          </button>

          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="h-12 rounded-2xl bg-neutral-50 hover:bg-brand-cream-100 active:scale-95 text-brand-green-950 font-display font-black text-lg border border-neutral-200 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-700 font-bold transition-all flex items-center justify-center cursor-pointer"
            title="Hapus Satu Karakter"
          >
            <Delete className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PosPinLockModal(props: PosPinLockModalProps) {
  if (!props.isOpen) return null;
  return <PosPinLockModalContent {...props} />;
}
