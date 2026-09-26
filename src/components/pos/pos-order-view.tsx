import { useState, useMemo } from "react";
import type {
  Product,
  CartItem,
  ProductCategory,
  PaymentMethod,
} from "./types";
import type { PromoVoucher } from "@/components/admin/types";
import { INITIAL_PROMOS } from "@/components/admin/mock-data";
import { formatRupiah } from "./format";
import { PosCheckoutModal } from "./pos-checkout-modal";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  RotateCcw,
  X,
  Tag,
  Ticket,
  AlertCircle,
} from "lucide-react";

interface PosOrderViewProps {
  products: Product[];
  promos?: PromoVoucher[];
  onOrderComplete: (orderData: {
    items: {
      productId: string;
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
      notes?: string;
    }[];
    subtotal: number;
    discount?: number;
    promoCode?: string;
    promoName?: string;
    tax: number;
    total: number;
    paymentMethod: PaymentMethod;
    amountTendered: number;
    change: number;
  }) => void;
}

export function PosOrderView({
  products,
  promos = INITIAL_PROMOS,
  onOrderComplete,
}: PosOrderViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Promo & Voucher States
  const [appliedPromo, setAppliedPromo] = useState<PromoVoucher | null>(null);
  const [manualDiscountPercent, setManualDiscountPercent] = useState<number>(0);
  const [manualDiscountAmount, setManualDiscountAmount] = useState<number>(0);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoInputCode, setPromoInputCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [discountTab, setDiscountTab] = useState<"PROMO" | "MANUAL">("PROMO");

  // Filtered Menu
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCategory =
        selectedCategory === "all" || prod.category === selectedCategory;
      const matchSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    );
  }, [cart]);

  // Discount Calculation
  const discount = useMemo(() => {
    if (subtotal === 0) return 0;
    if (appliedPromo) {
      if (subtotal < appliedPromo.minOrderAmount) return 0;
      if (appliedPromo.discountType === "PERCENTAGE") {
        const raw = Math.round((subtotal * appliedPromo.discountValue) / 100);
        return appliedPromo.maxDiscount
          ? Math.min(raw, appliedPromo.maxDiscount)
          : raw;
      }
      return Math.min(appliedPromo.discountValue, subtotal);
    }
    if (manualDiscountPercent > 0) {
      return Math.min(
        subtotal,
        Math.round((subtotal * manualDiscountPercent) / 100),
      );
    }
    if (manualDiscountAmount > 0) {
      return Math.min(subtotal, manualDiscountAmount);
    }
    return 0;
  }, [subtotal, appliedPromo, manualDiscountPercent, manualDiscountAmount]);

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = useMemo(() => {
    return Math.round(taxableAmount * 0.1);
  }, [taxableAmount]);

  const total = taxableAmount + tax;
  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1, notes: "" }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const updateNotes = (productId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, notes } : item,
      ),
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    handleRemoveDiscount();
  };

  // Promo Handlers
  const handleApplyPromoCode = (codeToApply: string) => {
    setPromoError("");
    const cleanCode = codeToApply.trim().toUpperCase();
    const found = promos.find(
      (p) => p.code.toUpperCase() === cleanCode && p.isActive,
    );

    if (!found) {
      setPromoError(
        "Kode voucher promo tidak ditemukan atau sedang tidak aktif.",
      );
      return;
    }
    if (subtotal < found.minOrderAmount) {
      setPromoError(
        `Minimal belanja ${formatRupiah(found.minOrderAmount)} untuk memakai kode ini (kurang ${formatRupiah(found.minOrderAmount - subtotal)}).`,
      );
      return;
    }
    if (found.usedCount >= found.quota) {
      setPromoError("Kuota penggunaan voucher promo ini sudah habis.");
      return;
    }

    setAppliedPromo(found);
    setManualDiscountPercent(0);
    setManualDiscountAmount(0);
    setIsPromoModalOpen(false);
    setPromoInputCode("");
  };

  const handleApplyManualDiscount = (
    type: "PERCENT" | "FIXED",
    val: number,
  ) => {
    setAppliedPromo(null);
    if (type === "PERCENT") {
      setManualDiscountPercent(val);
      setManualDiscountAmount(0);
    } else {
      setManualDiscountAmount(val);
      setManualDiscountPercent(0);
    }
    setIsPromoModalOpen(false);
  };

  const handleRemoveDiscount = () => {
    setAppliedPromo(null);
    setManualDiscountPercent(0);
    setManualDiscountAmount(0);
  };

  const handleCheckoutSubmit = (
    method: PaymentMethod,
    amountTendered: number,
    change: number,
  ) => {
    const itemsSnapshot = cart.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      quantity: i.quantity,
      price: i.product.price,
      subtotal: i.product.price * i.quantity,
      notes: i.notes.trim() || undefined,
    }));

    onOrderComplete({
      items: itemsSnapshot,
      subtotal,
      discount: discount > 0 ? discount : undefined,
      promoCode:
        appliedPromo?.code ||
        (manualDiscountPercent > 0
          ? `MANUAL-${manualDiscountPercent}%`
          : manualDiscountAmount > 0
            ? `MANUAL-RP`
            : undefined),
      promoName:
        appliedPromo?.name ||
        (discount > 0 ? "Diskon Manual Kasir" : undefined),
      tax,
      total,
      paymentMethod: method,
      amountTendered,
      change,
    });

    setIsCheckoutOpen(false);
    setIsMobileCartOpen(false);
    clearCart();
  };

  const activeVouchers = useMemo(() => {
    return promos.filter((p) => p.isActive);
  }, [promos]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Catalog & Search */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-brand-cream-50">
        {/* Search & Category Filter */}
        <div className="space-y-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu Mac & Cheese, katsu, kentang, atau minuman..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-brand-green-900/10 bg-white text-xs sm:text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-green-800/20 focus:border-brand-green-800 transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "Semua Menu" },
              { id: "mac", label: "Mac & Cheese" },
              { id: "sides", label: "Add-on" },
              { id: "drinks", label: "Minuman" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as ProductCategory)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-brand-green-900 text-brand-yellow-400 shadow-xs"
                    : "bg-white text-neutral-600 hover:bg-brand-cream-100 border border-brand-green-900/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Cards Display */}
        {selectedCategory === "all" && !searchQuery ? (
          <div className="space-y-8 pb-20 lg:pb-6">
            {/* 1. Menu Utama Section */}
            {filteredProducts.filter((p) => p.category === "mac").length >
              0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-brand-green-900/10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧀</span>
                    <h3 className="font-display font-black text-base text-brand-green-950">
                      Menu Utama · Signature Mac & Cheese
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-brand-green-900 bg-brand-cream-100 px-2.5 py-0.5 rounded-full border border-brand-green-900/15">
                    {
                      filteredProducts.filter((p) => p.category === "mac")
                        .length
                    }{" "}
                    Pilihan
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredProducts
                    .filter((p) => p.category === "mac")
                    .map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => prod.isAvailable && addToCart(prod)}
                        className={`group flex flex-col justify-between p-3 sm:p-4 rounded-3xl bg-white border border-brand-green-900/10 shadow-2xs hover:shadow-md transition-all text-left relative overflow-hidden select-none cursor-pointer ${
                          !prod.isAvailable
                            ? "opacity-60 grayscale cursor-not-allowed"
                            : "hover:-translate-y-0.5"
                        }`}
                      >
                        <div>
                          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-brand-cream-100 mb-3 relative">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {!prod.isAvailable && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-wider text-white px-2 py-1 rounded bg-brand-coral-600">
                                  Habis
                                </span>
                              </div>
                            )}
                            {prod.isAvailable && (
                              <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-xs text-[10px] font-bold text-neutral-700 shadow-2xs">
                                Sisa {prod.stock}
                              </span>
                            )}
                          </div>

                          <h3 className="font-display font-extrabold text-sm sm:text-base text-brand-green-950 line-clamp-1">
                            {prod.name}
                          </h3>
                          <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                            {prod.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100">
                          <span className="font-display font-extrabold text-sm sm:text-base text-brand-green-900">
                            {formatRupiah(prod.price)}
                          </span>
                          <span className="size-7 rounded-xl bg-brand-cream-100 group-hover:bg-brand-green-900 group-hover:text-brand-yellow-400 text-brand-green-900 flex items-center justify-center font-bold text-xs transition-colors">
                            +
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 2. Add-on & Camilan Section */}
            {filteredProducts.filter((p) => p.category === "sides").length >
              0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-brand-green-900/10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🍗</span>
                    <h3 className="font-display font-black text-base text-brand-green-950">
                      Add-on & Camilan Krispi
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-brand-green-900 bg-brand-cream-100 px-2.5 py-0.5 rounded-full border border-brand-green-900/15">
                    {
                      filteredProducts.filter((p) => p.category === "sides")
                        .length
                    }{" "}
                    Pilihan
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredProducts
                    .filter((p) => p.category === "sides")
                    .map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => prod.isAvailable && addToCart(prod)}
                        className={`group flex flex-col justify-between p-3 sm:p-4 rounded-3xl bg-white border border-brand-green-900/10 shadow-2xs hover:shadow-md transition-all text-left relative overflow-hidden select-none cursor-pointer ${
                          !prod.isAvailable
                            ? "opacity-60 grayscale cursor-not-allowed"
                            : "hover:-translate-y-0.5"
                        }`}
                      >
                        <div>
                          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-brand-cream-100 mb-3 relative">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {!prod.isAvailable && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-wider text-white px-2 py-1 rounded bg-brand-coral-600">
                                  Habis
                                </span>
                              </div>
                            )}
                            {prod.isAvailable && (
                              <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-xs text-[10px] font-bold text-neutral-700 shadow-2xs">
                                Sisa {prod.stock}
                              </span>
                            )}
                          </div>

                          <h3 className="font-display font-extrabold text-sm sm:text-base text-brand-green-950 line-clamp-1">
                            {prod.name}
                          </h3>
                          <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                            {prod.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100">
                          <span className="font-display font-extrabold text-sm sm:text-base text-brand-green-900">
                            {formatRupiah(prod.price)}
                          </span>
                          <span className="size-7 rounded-xl bg-brand-cream-100 group-hover:bg-brand-green-900 group-hover:text-brand-yellow-400 text-brand-green-900 flex items-center justify-center font-bold text-xs transition-colors">
                            +
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 3. Minuman Dingin Section */}
            {filteredProducts.filter((p) => p.category === "drinks").length >
              0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-brand-green-900/10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥤</span>
                    <h3 className="font-display font-black text-base text-brand-green-950">
                      Minuman Dingin & Segar
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-brand-green-900 bg-brand-cream-100 px-2.5 py-0.5 rounded-full border border-brand-green-900/15">
                    {
                      filteredProducts.filter((p) => p.category === "drinks")
                        .length
                    }{" "}
                    Pilihan
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredProducts
                    .filter((p) => p.category === "drinks")
                    .map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => prod.isAvailable && addToCart(prod)}
                        className={`group flex flex-col justify-between p-3 sm:p-4 rounded-3xl bg-white border border-brand-green-900/10 shadow-2xs hover:shadow-md transition-all text-left relative overflow-hidden select-none cursor-pointer ${
                          !prod.isAvailable
                            ? "opacity-60 grayscale cursor-not-allowed"
                            : "hover:-translate-y-0.5"
                        }`}
                      >
                        <div>
                          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-brand-cream-100 mb-3 relative">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {!prod.isAvailable && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-wider text-white px-2 py-1 rounded bg-brand-coral-600">
                                  Habis
                                </span>
                              </div>
                            )}
                            {prod.isAvailable && (
                              <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-xs text-[10px] font-bold text-neutral-700 shadow-2xs">
                                Sisa {prod.stock}
                              </span>
                            )}
                          </div>

                          <h3 className="font-display font-extrabold text-sm sm:text-base text-brand-green-950 line-clamp-1">
                            {prod.name}
                          </h3>
                          <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                            {prod.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100">
                          <span className="font-display font-extrabold text-sm sm:text-base text-brand-green-900">
                            {formatRupiah(prod.price)}
                          </span>
                          <span className="size-7 rounded-xl bg-brand-cream-100 group-hover:bg-brand-green-900 group-hover:text-brand-yellow-400 text-brand-green-900 flex items-center justify-center font-bold text-xs transition-colors">
                            +
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Single category or search query grid */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-20 lg:pb-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => prod.isAvailable && addToCart(prod)}
                className={`group flex flex-col justify-between p-3 sm:p-4 rounded-3xl bg-white border border-brand-green-900/10 shadow-2xs hover:shadow-md transition-all text-left relative overflow-hidden select-none cursor-pointer ${
                  !prod.isAvailable
                    ? "opacity-60 grayscale cursor-not-allowed"
                    : "hover:-translate-y-0.5"
                }`}
              >
                <div>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-brand-cream-100 mb-3 relative">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {!prod.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white px-2 py-1 rounded bg-brand-coral-600">
                          Habis
                        </span>
                      </div>
                    )}
                    {prod.isAvailable && (
                      <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-xs text-[10px] font-bold text-neutral-700 shadow-2xs">
                        Sisa {prod.stock}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-extrabold text-sm sm:text-base text-brand-green-950 line-clamp-1">
                    {prod.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                    {prod.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100">
                  <span className="font-display font-extrabold text-sm sm:text-base text-brand-green-900">
                    {formatRupiah(prod.price)}
                  </span>
                  <span className="size-7 rounded-xl bg-brand-cream-100 group-hover:bg-brand-green-900 group-hover:text-brand-yellow-400 text-brand-green-900 flex items-center justify-center font-bold text-xs transition-colors">
                    +
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart Summary Panel (Desktop) */}
      <div className="hidden lg:flex w-80 xl:w-96 flex-col border-l border-brand-green-900/10 bg-white h-full">
        {/* Cart Header */}
        <div className="p-4 border-b border-brand-green-900/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-brand-green-900" />
            <h3 className="font-display font-extrabold text-base text-brand-green-950">
              Pesanan Saat Ini
            </h3>
            {totalItemCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-green-900 text-brand-yellow-400">
                {totalItemCount}
              </span>
            )}
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-neutral-400 hover:text-brand-coral-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 p-6 space-y-2">
              <ShoppingBag className="size-10 text-neutral-300 stroke-1" />
              <p className="text-xs font-medium">Keranjang masih kosong</p>
              <p className="text-[11px] text-neutral-400 max-w-[200px]">
                Pilih menu di sebelah kiri untuk menambahkan pesanan pelanggan.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 rounded-xl bg-brand-cream-50/80 border border-brand-green-900/10 space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-bold text-xs sm:text-sm text-brand-green-950 truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {formatRupiah(item.product.price)}
                    </span>
                  </div>
                  <strong className="text-xs sm:text-sm font-display font-black text-brand-green-900">
                    {formatRupiah(item.product.price * item.quantity)}
                  </strong>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="size-7 flex items-center justify-center hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                      aria-label="Kurangi kuantitas"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-display text-neutral-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="size-7 flex items-center justify-center hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                      aria-label="Tambah kuantitas"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    className="text-neutral-400 hover:text-brand-coral-600 p-1 transition-colors cursor-pointer"
                    aria-label="Hapus item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {/* Order Item Notes */}
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => updateNotes(item.product.id, e.target.value)}
                  placeholder="Catatan pesanan (misal: Extra saus, pedas)..."
                  className="w-full text-[11px] px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-brand-green-800"
                />
              </div>
            ))
          )}
        </div>

        {/* Promo / Discount Section */}
        {cart.length > 0 && (
          <div className="px-4 py-2.5 bg-neutral-50/70 border-t border-neutral-100">
            {appliedPromo || discount > 0 ? (
              <div className="p-2.5 rounded-2xl bg-brand-cream-100 border border-brand-green-900/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="size-4 text-brand-green-900 shrink-0" />
                  <div className="truncate">
                    <span className="font-mono font-black text-xs text-brand-green-950 block truncate">
                      {appliedPromo ? appliedPromo.code : "DISKON MANUAL"}
                    </span>
                    <span className="text-[10px] text-brand-green-800 font-semibold block">
                      Potongan: -{formatRupiah(discount)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  className="p-1 rounded-md text-brand-green-900 hover:bg-brand-cream-200 transition-colors cursor-pointer shrink-0"
                  title="Hapus Promo"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPromoError("");
                  setIsPromoModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-600/40 hover:bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Ticket className="size-3.5" />
                <span>+ Gunakan Voucher / Diskon Promo</span>
              </button>
            )}
          </div>
        )}

        {/* Cart Pricing Summary & Checkout Button */}
        <div className="p-4 bg-brand-cream-50 border-t border-brand-green-900/10 space-y-3">
          <div className="space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal ({totalItemCount} item)</span>
              <span className="font-semibold text-neutral-800">
                {formatRupiah(subtotal)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>
                  Diskon {appliedPromo ? `(${appliedPromo.code})` : ""}
                </span>
                <span className="font-mono">-{formatRupiah(discount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Pajak Resto PB1 (10%)</span>
              <span className="font-semibold text-neutral-800">
                {formatRupiah(tax)}
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold text-neutral-900">
              <span className="font-display font-extrabold text-brand-green-950">
                Total Tagihan
              </span>
              <span className="font-display font-black text-lg text-brand-green-900">
                {formatRupiah(total)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-display font-extrabold text-sm shadow-md transition-all cursor-pointer"
          >
            <span>Bayar {formatRupiah(total)}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sticky Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-neutral-200 shadow-xl flex items-center justify-between gap-3 z-30">
        <div>
          <span className="text-[11px] text-neutral-500 font-medium block">
            {totalItemCount} item{" "}
            {discount > 0 ? `· Diskon ${formatRupiah(discount)}` : ""}
          </span>
          <strong className="font-display font-black text-lg text-brand-green-900">
            {formatRupiah(total)}
          </strong>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-800"
          >
            Keranjang ({totalItemCount})
          </button>
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-green-900 disabled:bg-neutral-300 text-white text-xs font-extrabold shadow-sm"
          >
            Bayar
          </button>
        </div>
      </div>

      {/* Mobile Cart Sheet/Drawer */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base text-brand-green-950">
                Keranjang Pesanan ({totalItemCount} item)
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="size-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 rounded-xl bg-brand-cream-50 border border-neutral-200 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-neutral-900">
                      {item.product.name}
                    </span>
                    <strong className="text-sm text-brand-green-900 font-display">
                      {formatRupiah(item.product.price * item.quantity)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="size-7 flex items-center justify-center text-neutral-700"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="size-7 flex items-center justify-center text-neutral-700"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="text-xs text-brand-coral-600 font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}

              {/* Promo section inside Mobile Drawer */}
              <div className="pt-2">
                {appliedPromo || discount > 0 ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-emerald-950 block">
                        {appliedPromo ? appliedPromo.code : "Diskon Manual"}
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        Potongan: -{formatRupiah(discount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="p-1 rounded text-emerald-700"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPromoModalOpen(true);
                      setPromoError("");
                    }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-emerald-600/40 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Ticket className="size-4" />
                    <span>+ Tambah Voucher / Diskon Promo</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 bg-brand-cream-100 border-t border-neutral-200 space-y-2">
              <div className="space-y-1 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Diskon</span>
                    <span>-{formatRupiah(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>PB1 (10%)</span>
                  <span>{formatRupiah(tax)}</span>
                </div>
              </div>
              <div className="flex justify-between text-base font-black font-display text-neutral-900 pt-1 border-t border-neutral-200">
                <span>Total Bayar</span>
                <span className="text-brand-green-900">
                  {formatRupiah(total)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3 rounded-xl bg-brand-green-900 text-white font-extrabold text-sm shadow-md"
              >
                Lanjut ke Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilih Voucher / Diskon Kasir */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-brand-green-950 text-white flex items-center justify-between">
              <div>
                <span className="text-brand-yellow-400 text-[10px] font-black uppercase tracking-widest block">
                  Diskon Kasir
                </span>
                <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                  Pilih Promo & Voucher
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Tab: Voucher Promo vs Manual Kasir */}
            <div className="p-4 border-b border-neutral-200 flex gap-2 bg-neutral-50">
              <button
                type="button"
                onClick={() => setDiscountTab("PROMO")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  discountTab === "PROMO"
                    ? "bg-white text-emerald-950 shadow-2xs border border-neutral-200"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Voucher Promo Aktif
              </button>
              <button
                type="button"
                onClick={() => setDiscountTab("MANUAL")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  discountTab === "MANUAL"
                    ? "bg-white text-emerald-950 shadow-2xs border border-neutral-200"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Diskon Manual (Staff/Owner)
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {discountTab === "PROMO" ? (
                <>
                  {/* Input Kode Voucher Manual */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Ketik Kode Voucher Promo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInputCode}
                        onChange={(e) =>
                          setPromoInputCode(e.target.value.toUpperCase())
                        }
                        placeholder="MISAL: MACMOOD10"
                        className="flex-1 h-10 px-3 rounded-xl border border-neutral-300 font-mono font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyPromoCode(promoInputCode)}
                        className="px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Terapkan
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                        <AlertCircle className="size-3 shrink-0" />
                        <span>{promoError}</span>
                      </p>
                    )}
                  </div>

                  {/* Quick Select Voucher Cards */}
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                      Daftar Kupon Siap Pakai ({activeVouchers.length})
                    </span>

                    <div className="space-y-2.5">
                      {activeVouchers.map((v) => {
                        const isEligible = subtotal >= v.minOrderAmount;
                        return (
                          <div
                            key={v.id}
                            onClick={() => handleApplyPromoCode(v.code)}
                            className={`p-3 rounded-2xl border transition-all text-left flex items-start justify-between gap-3 cursor-pointer ${
                              isEligible
                                ? "border-emerald-600/30 bg-emerald-50/40 hover:bg-emerald-50 hover:shadow-2xs"
                                : "border-neutral-200 bg-neutral-50 opacity-60 hover:opacity-80"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-mono font-black text-xs text-brand-green-950 bg-white px-2 py-0.5 rounded border border-emerald-600/20">
                                  {v.code}
                                </span>
                                <span className="font-bold text-xs text-emerald-800 truncate">
                                  {v.discountType === "PERCENTAGE"
                                    ? `${v.discountValue}% OFF`
                                    : formatRupiah(v.discountValue)}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-600 leading-snug truncate">
                                {v.name}
                              </p>
                              <span className="text-[10px] text-neutral-400 block mt-1">
                                Min. belanja {formatRupiah(v.minOrderAmount)} ·
                                Sisa kuota: {v.quota - v.usedCount}
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={!isEligible}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEligible) handleApplyPromoCode(v.code);
                              }}
                              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl shrink-0 transition-colors cursor-pointer ${
                                isEligible
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                  : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                              }`}
                            >
                              {isEligible
                                ? "Gunakan"
                                : `Kurang ${formatRupiah(v.minOrderAmount - subtotal)}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Manual Discount */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-2">
                      Pilih Diskon Cepat Kasir
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[5, 10, 15, 20, 25, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() =>
                            handleApplyManualDiscount("PERCENT", pct)
                          }
                          className="h-10 rounded-xl border border-emerald-600/30 hover:bg-emerald-50 text-emerald-950 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {pct}% OFF
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-2">
                      Atau Potongan Nominal Langsung (Rp)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[5000, 10000, 15000, 20000].map((nom) => (
                        <button
                          key={nom}
                          type="button"
                          onClick={() =>
                            handleApplyManualDiscount("FIXED", nom)
                          }
                          className="h-10 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {formatRupiah(nom)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <PosCheckoutModal
          subtotal={subtotal}
          discount={discount}
          promoCode={
            appliedPromo?.code ||
            (manualDiscountPercent > 0
              ? `${manualDiscountPercent}%`
              : undefined)
          }
          tax={tax}
          total={total}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmit={handleCheckoutSubmit}
        />
      )}
    </div>
  );
}
