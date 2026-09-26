import { useState, useEffect, useCallback } from "react";
import { Lock, Unlock, Delete, X, ShieldCheck, LogOut, User } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export interface StaffPinAccount {
  id: string;
  name: string;
  role: "owner" | "cashier";
  roleLabel: string;
  pin: string;
  email?: string;
}

export const DEMO_STAFF_PIN_ACCOUNTS: StaffPinAccount[] = [
  {
    id: "staff-1",
    name: "Muhammad Afrizal",
    role: "owner",
    roleLabel: "Business Owner",
    pin: "8899",
    email: "owner@macmood.id",
  },
  {
    id: "staff-2",
    name: "Budi Santoso",
    role: "cashier",
    roleLabel: "Kasir Shift Pagi",
    pin: "1234",
    email: "budi.kasir@macmood.id",
  },
];

interface PosPinLockModalProps {
  isOpen: boolean;
  staff: StaffPinAccount;
  onSuccessUnlock: () => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

function PosPinLockModalContent({
  staff,
  onSuccessUnlock,
  onClose,
  canDismiss = false,
}: Omit<PosPinLockModalProps, "isOpen">) {
  const [enteredPin, setEnteredPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();
  const navigate = useNavigate();

  const validatePin = useCallback(
    (pin: string) => {
      if (pin === staff.pin) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccessUnlock();
          setIsSuccess(false);
          setEnteredPin("");
        }, 350);
      } else {
        setErrorMsg("PIN salah. Silakan coba lagi.");
        setTimeout(() => {
          setEnteredPin("");
        }, 600);
      }
    },
    [onSuccessUnlock, staff.pin]
  );

  // Handle number click
  const handleDigit = useCallback(
    (digit: string) => {
      if (enteredPin.length >= 4 || isSuccess) return;
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);
      setErrorMsg("");

      if (newPin.length === 4) {
        validatePin(newPin);
      }
    },
    [enteredPin, isSuccess, validatePin]
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

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      await router.invalidate();
      await navigate({ to: "/sign-in", replace: true });
    } catch {
      window.location.href = "/sign-in";
    } finally {
      setIsLoggingOut(false);
    }
  };

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

  const initials = staff.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
              ? "bg-brand-green-900 text-brand-yellow-400"
              : errorMsg
                ? "bg-brand-coral-500 text-white"
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

        {/* Active Authenticated Staff Card (1-User representation) */}
        <div className="mt-3 mb-4 w-full p-3 rounded-2xl bg-brand-cream-50 border border-brand-green-900/10 flex items-center gap-3 text-left">
          <div className="size-10 rounded-xl bg-brand-green-900 text-brand-yellow-400 font-display font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
            {initials || <User className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="font-extrabold text-sm text-brand-green-950 truncate">
                {staff.name}
              </p>
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                  staff.role === "owner"
                    ? "bg-brand-yellow-500/15 text-brand-yellow-700 border border-brand-yellow-500/30"
                    : "bg-brand-green-900/10 text-brand-green-950 border border-brand-green-900/20"
                }`}
              >
                {staff.role === "owner" ? "Owner" : "Kasir"}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 truncate">
              {staff.roleLabel}
            </p>
          </div>
        </div>

        {/* PIN Dots (Masked Display) */}
        <div className="flex items-center justify-center gap-3 mb-3 h-8">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <motion.div
                key={idx}
                animate={errorMsg ? { x: [-8, 8, -6, 6, 0] } : {}}
                transition={{ duration: 0.3 }}
                className={`size-4 rounded-full border-2 transition-all duration-150 ${
                  isSuccess
                    ? "bg-brand-green-800 border-brand-green-800 scale-110"
                    : errorMsg
                      ? "bg-brand-coral-500 border-brand-coral-600"
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
            <span className="text-xs font-bold text-brand-coral-600 animate-in fade-in">
              {errorMsg}
            </span>
          ) : isSuccess ? (
            <span className="text-xs font-bold text-brand-green-800 flex items-center justify-center gap-1">
              <ShieldCheck className="size-3.5" />
              Selamat bertugas, {staff.name.split(" ")[0]}!
            </span>
          ) : (
            <span className="text-[11px] text-neutral-500 font-medium">
              Masukkan 4 digit PIN otorisasi Anda
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

        {/* Switch Account / Logout footer */}
        <div className="mt-5 pt-3 border-t border-neutral-100 w-full flex items-center justify-between text-xs">
          <span className="text-neutral-400">Bukan {staff.name.split(" ")[0]}?</span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="text-amber-800 hover:text-amber-950 font-bold hover:underline cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="size-3.5" />
            <span>{isLoggingOut ? "Keluar..." : "Ganti Akun / Logout"}</span>
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

