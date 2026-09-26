import { useState, useCallback, useEffect } from "react";
import { Lock, Unlock, Store, ArrowRight, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import type { BranchOutlet } from "./types";

interface AdminPosAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: BranchOutlet[];
  ownerPin?: string;
}

function AdminPosAccessModalContent({
  onClose,
  branches = [],
  ownerPin = "8899",
}: Omit<AdminPosAccessModalProps, "isOpen">) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"pin" | "branch">("pin");
  const [enteredPin, setEnteredPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || "branch-1");

  const validatePin = useCallback(
    (pin: string) => {
      if (pin === ownerPin) {
        setIsVerifying(true);
        setErrorMsg("");
        setTimeout(() => {
          setIsVerifying(false);
          setStep("branch");
        }, 400);
      } else {
        setErrorMsg("PIN Owner tidak valid. Akses ditolak.");
        setTimeout(() => {
          setEnteredPin("");
        }, 700);
      }
    },
    [ownerPin]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (enteredPin.length >= 4 || isVerifying) return;
      const next = enteredPin + digit;
      setEnteredPin(next);
      setErrorMsg("");

      if (next.length === 4) {
        validatePin(next);
      }
    },
    [enteredPin, isVerifying, validatePin]
  );

  const handleDelete = useCallback(() => {
    if (enteredPin.length > 0) {
      setEnteredPin((prev) => prev.slice(0, -1));
      setErrorMsg("");
    }
  }, [enteredPin.length]);

  const handleProceedToPos = () => {
    onClose();
    if (typeof window !== "undefined") {
      localStorage.setItem("macmood_current_branch", selectedBranchId);
    }
    navigate({
      to: "/app",
    });
  };

  // Keyboard numeric listener for PIN
  useEffect(() => {
    if (step !== "pin") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDelete, handleDigit, onClose, step]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-sm w-full p-6 flex flex-col items-center text-center relative select-none">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 size-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer transition-colors"
          title="Tutup"
        >
          <X className="size-4" />
        </button>

        {step === "pin" ? (
          <>
            {/* Lock Icon */}
            <div
              className={`size-14 rounded-2xl flex items-center justify-center mb-3 shadow-md transition-colors duration-300 ${
                isVerifying
                  ? "bg-brand-green-900 text-brand-yellow-400"
                  : errorMsg
                    ? "bg-brand-coral-600 text-white"
                    : "bg-brand-green-900 text-brand-yellow-400"
              }`}
            >
              {isVerifying ? (
                <Unlock className="size-7 animate-bounce" />
              ) : (
                <Lock className="size-7" />
              )}
            </div>

            <h3 className="font-display font-black text-xl text-brand-green-950">
              Otorisasi Akses Kasir POS
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Masukkan 4-digit PIN Owner untuk membuka operasional kasir
            </p>

            {/* Masked PIN Dots */}
            <div className="flex items-center justify-center gap-3 mb-3 h-8">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = enteredPin.length > idx;
                return (
                  <motion.div
                    key={idx}
                    animate={errorMsg ? { x: [-8, 8, -6, 6, 0] } : {}}
                    transition={{ duration: 0.3 }}
                    className={`size-4 rounded-full border-2 transition-all duration-150 ${
                      isVerifying
                        ? "bg-brand-green-900 border-brand-green-900 scale-110"
                        : errorMsg
                          ? "bg-brand-coral-600 border-brand-coral-600"
                          : isFilled
                            ? "bg-brand-green-900 border-brand-green-900 scale-110"
                            : "bg-white border-neutral-300"
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message Container (No leaked hint) */}
            <div className="h-5 mb-2 flex items-center justify-center">
              {errorMsg ? (
                <span className="text-xs font-bold text-brand-coral-600 flex items-center gap-1 animate-in fade-in">
                  <ShieldAlert className="size-3.5" />
                  {errorMsg}
                </span>
              ) : (
                <span className="text-[11px] text-neutral-400">
                  Gunakan PIN Owner terdaftar untuk melanjutkan
                </span>
              )}
            </div>

            {/* Keypad */}
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
                onClick={() => {
                  setEnteredPin("");
                  setErrorMsg("");
                }}
                className="h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer"
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
              >
                ←
              </button>
            </div>
          </>
        ) : (
          /* Step 2: Branch Selection */
          <div className="w-full flex flex-col items-center">
            <div className="size-14 rounded-2xl bg-brand-green-900 text-brand-yellow-400 flex items-center justify-center mb-3 shadow-md">
              <Store className="size-7" />
            </div>

            <h3 className="font-display font-black text-xl text-brand-green-950">
              Pilih Cabang Kasir
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Pilih cabang operasional yang ingin dibuka di Kasir POS
            </p>

            <div className="w-full space-y-2 mb-6">
              {branches.map((b) => {
                const isSelected = selectedBranchId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranchId(b.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand-green-900 border-brand-green-900 text-white shadow-sm"
                        : "bg-brand-cream-50 hover:bg-brand-cream-100 border-neutral-200 text-brand-green-950"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">{b.name}</h4>
                      <p
                        className={`text-[11px] truncate max-w-[200px] ${
                          isSelected ? "text-brand-cream-200" : "text-neutral-500"
                        }`}
                      >
                        {b.address}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="size-4 text-brand-yellow-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleProceedToPos}
              className="w-full py-3 px-4 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-yellow-400 font-display font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Buka POS Kasir</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminPosAccessModal(props: AdminPosAccessModalProps) {
  if (!props.isOpen) return null;
  return <AdminPosAccessModalContent {...props} />;
}
