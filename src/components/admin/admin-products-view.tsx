import { useState } from "react";
import type { AdminProduct } from "./types";
import { formatRupiah } from "@/components/pos/format";
import {
  Plus,
  Search,
  Layers,
  Edit2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Percent,
  X,
  Package,
} from "lucide-react";

interface AdminProductsViewProps {
  products: AdminProduct[];
  onAddProduct: (product: Omit<AdminProduct, "id" | "soldCount">) => void;
  onUpdateProduct: (id: string, updates: Partial<AdminProduct>) => void;
  onToggleAvailability: (id: string) => void;
}

export function AdminProductsView({
  products,
  onAddProduct,
  onUpdateProduct,
  onToggleAvailability,
}: AdminProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "unavailable">("all");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    category: "mac" as "mac" | "sides" | "drinks",
    categoryLabel: "Mac & Cheese",
    price: 20000,
    costPrice: 9000,
    description: "",
    image: "/assets/menu-super-mac-reference.png",
    isAvailable: true,
    trackStock: true,
    currentStock: 50,
    lowStockThreshold: 20,
  });

  const openAddModal = () => {
    setFormData({
      name: "",
      category: "mac",
      categoryLabel: "Mac & Cheese",
      price: 15000,
      costPrice: 7000,
      description: "",
      image: "/assets/menu-super-mac-reference.png",
      isAvailable: true,
      trackStock: true,
      currentStock: 40,
      lowStockThreshold: 20,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (prod: AdminProduct) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      categoryLabel: prod.categoryLabel,
      price: prod.price,
      costPrice: prod.costPrice,
      description: prod.description,
      image: prod.image,
      isAvailable: prod.isAvailable,
      trackStock: prod.trackStock,
      currentStock: prod.currentStock,
      lowStockThreshold: prod.lowStockThreshold,
    });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, {
        name: formData.name,
        category: formData.category,
        categoryLabel:
          formData.category === "mac"
            ? "Mac & Cheese"
            : formData.category === "sides"
              ? "Katsu & Kentang"
              : "Minuman Dingin",
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        description: formData.description,
        image: formData.image,
        isAvailable: formData.isAvailable,
        trackStock: formData.trackStock,
        currentStock: Number(formData.currentStock),
        lowStockThreshold: Number(formData.lowStockThreshold),
      });
      setEditingProduct(null);
    } else {
      onAddProduct({
        name: formData.name,
        category: formData.category,
        categoryLabel:
          formData.category === "mac"
            ? "Mac & Cheese"
            : formData.category === "sides"
              ? "Katsu & Kentang"
              : "Minuman Dingin",
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        description: formData.description,
        image: formData.image,
        isAvailable: formData.isAvailable,
        trackStock: formData.trackStock,
        currentStock: Number(formData.currentStock),
        lowStockThreshold: Number(formData.lowStockThreshold),
      });
      setIsAddModalOpen(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && p.isAvailable) ||
      (statusFilter === "unavailable" && !p.isAvailable);

    return matchSearch && matchCategory && matchStatus;
  });

  // Calculate Metrics
  const totalProducts = products.length;
  const availableCount = products.filter((p) => p.isAvailable).length;
  const unavailableCount = totalProducts - availableCount;
  const avgMargin =
    products.reduce((acc, p) => {
      const margin = p.price > 0 ? ((p.price - p.costPrice) / p.price) * 100 : 0;
      return acc + margin;
    }, 0) / (totalProducts || 1);

  // Form Margin Calculation
  const formMarginPercent =
    formData.price > 0 ? (((formData.price - formData.costPrice) / formData.price) * 100).toFixed(1) : "0";
  const formProfitNominal = Math.max(0, formData.price - formData.costPrice);

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-green-800 uppercase tracking-widest mb-1">
            <Layers className="size-4" />
            <span>Katalog Menu & Harga</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-brand-green-950">
            Daftar Menu Outlet
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Kelola varian menu, harga jual, margin HPP, serta status ketersediaan item secara langsung.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-extrabold text-xs shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="size-4 text-brand-yellow-400" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Mini Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Total Menu</span>
          <span className="font-display font-black text-2xl text-brand-green-950">
            {totalProducts}
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">Terdaftar di POS</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Menu Tersedia</span>
          <span className="font-display font-black text-2xl text-emerald-700">
            {availableCount}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
            Aktif di Kasir
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Menu Habis</span>
          <span className="font-display font-black text-2xl text-neutral-500">
            {unavailableCount}
          </span>
          <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
            Nonaktif sementara
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Rata-rata Margin</span>
          <span className="font-display font-black text-2xl text-brand-green-900">
            {avgMargin.toFixed(1)}%
          </span>
          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
            Margin Laba Kotor
          </span>
        </div>
      </div>

      {/* Filters & Search Control */}
      <div className="bg-white p-4 rounded-2xl border border-brand-green-900/10 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama menu atau deskripsi..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 bg-neutral-50/50"
          />
        </div>

        {/* Categories & Availability Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Chips */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            {[
              { id: "all", label: "Semua" },
              { id: "mac", label: "Mac & Cheese" },
              { id: "sides", label: "Sides" },
              { id: "drinks", label: "Minuman" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-white text-brand-green-950 shadow-2xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Dropdown/Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "available" | "unavailable")}
            className="h-9 px-3 rounded-xl border border-neutral-200 text-xs bg-white font-medium text-neutral-700 focus:outline-none focus:border-brand-green-800 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="available">Tersedia Saja</option>
            <option value="unavailable">Habis Saja</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-brand-green-900/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Menu & Gambar</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-right">HPP</th>
                <th className="py-3.5 px-4 text-right">Margin Laba</th>
                <th className="py-3.5 px-4 text-center">Lacak Stok</th>
                <th className="py-3.5 px-4 text-center">Status Buka</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {filteredProducts.map((prod) => {
                const marginPercent =
                  prod.price > 0 ? (((prod.price - prod.costPrice) / prod.price) * 100).toFixed(1) : "0";
                const profitNominal = prod.price - prod.costPrice;

                return (
                  <tr
                    key={prod.id}
                    className={`hover:bg-brand-cream-50/50 transition-colors ${
                      !prod.isAvailable ? "bg-neutral-50/60 opacity-75" : ""
                    }`}
                  >
                    {/* Menu & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="size-11 rounded-xl object-cover border border-neutral-200 bg-neutral-100 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <strong className="font-display font-bold text-sm text-neutral-900 block truncate">
                            {prod.name}
                          </strong>
                          <span className="text-[11px] text-neutral-500 truncate block max-w-xs">
                            {prod.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-medium text-[11px]">
                        {prod.categoryLabel}
                      </span>
                    </td>

                    {/* Harga Jual */}
                    <td className="py-3 px-4 text-right font-display font-extrabold text-neutral-900">
                      {formatRupiah(prod.price)}
                    </td>

                    {/* HPP */}
                    <td className="py-3 px-4 text-right font-mono text-neutral-600">
                      {formatRupiah(prod.costPrice)}
                    </td>

                    {/* Margin */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex flex-col items-end">
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold font-mono">
                          <TrendingUp className="size-3" />
                          {marginPercent}%
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          +{formatRupiah(profitNominal)}
                        </span>
                      </div>
                    </td>

                    {/* Track Stock Badge */}
                    <td className="py-3 px-4 text-center">
                      {prod.trackStock ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.currentStock <= prod.lowStockThreshold
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          <Package className="size-3" />
                          <span>{prod.currentStock} porsi</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-400 italic">Tanpa Kuota</span>
                      )}
                    </td>

                    {/* Availability Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleAvailability(prod.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                          prod.isAvailable
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                        }`}
                      >
                        {prod.isAvailable ? (
                          <>
                            <CheckCircle2 className="size-3" />
                            <span>Tersedia</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3" />
                            <span>Habis</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-brand-green-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Edit Menu"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredProducts.map((prod) => {
          const marginPercent =
            prod.price > 0 ? (((prod.price - prod.costPrice) / prod.price) * 100).toFixed(1) : "0";

          return (
            <div
              key={prod.id}
              className={`p-4 rounded-2xl bg-white border transition-all space-y-3 ${
                prod.isAvailable
                  ? "border-brand-green-900/10 shadow-2xs"
                  : "border-neutral-200 bg-neutral-50/60 opacity-80"
              }`}
            >
              <div className="flex items-start gap-3">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="size-16 rounded-xl object-cover border border-neutral-200 bg-neutral-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] uppercase font-bold text-neutral-500">
                      {prod.categoryLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleAvailability(prod.id)}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        prod.isAvailable
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {prod.isAvailable ? "Tersedia" : "Habis"}
                    </button>
                  </div>
                  <h4 className="font-display font-extrabold text-sm text-neutral-900 truncate">
                    {prod.name}
                  </h4>
                  <p className="text-[11px] text-neutral-500 line-clamp-1">{prod.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-center">
                <div className="bg-neutral-50 p-1.5 rounded-lg">
                  <span className="text-[9px] text-neutral-500 block">Harga</span>
                  <strong className="font-display font-bold text-xs text-brand-green-950">
                    {formatRupiah(prod.price)}
                  </strong>
                </div>
                <div className="bg-neutral-50 p-1.5 rounded-lg">
                  <span className="text-[9px] text-neutral-500 block">HPP</span>
                  <span className="font-mono text-xs text-neutral-700">
                    {formatRupiah(prod.costPrice)}
                  </span>
                </div>
                <div className="bg-emerald-50 p-1.5 rounded-lg">
                  <span className="text-[9px] text-emerald-800 block font-semibold">Margin</span>
                  <span className="font-bold text-xs text-emerald-700">+{marginPercent}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px]">
                  {prod.trackStock ? (
                    <span
                      className={`font-semibold ${
                        prod.currentStock <= prod.lowStockThreshold
                          ? "text-amber-600"
                          : "text-neutral-600"
                      }`}
                    >
                      Stok: <strong>{prod.currentStock} porsi</strong>
                    </span>
                  ) : (
                    <span className="text-neutral-400 italic">Tanpa lacak kuota</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(prod)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  <Edit2 className="size-3 text-neutral-500" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-green-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-brand-green-900/10 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-brand-green-900 text-brand-yellow-400 flex items-center justify-center font-display font-black text-xs">
                  {editingProduct ? <Edit2 className="size-4" /> : <Plus className="size-4" />}
                </div>
                <h3 className="font-display font-extrabold text-base text-brand-green-950">
                  {editingProduct ? "Edit Informasi Menu" : "Tambah Menu Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Nama Menu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: Spicy Truffle Mac"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800"
                />
              </div>

              {/* Category & Preset Image */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as "mac" | "sides" | "drinks",
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-brand-green-800"
                  >
                    <option value="mac">Mac & Cheese</option>
                    <option value="sides">Katsu & Kentang (Sides)</option>
                    <option value="drinks">Minuman Dingin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Template Gambar</label>
                  <select
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:border-brand-green-800"
                  >
                    <option value="/assets/menu-super-mac-reference.png">Super Mac (Katsu)</option>
                    <option value="/assets/menu-potato-mac-reference.png">Potato Mac (Kentang)</option>
                    <option value="/assets/menu-classic-mac-reference.png">Classic Mac (Original)</option>
                  </select>
                </div>
              </div>

              {/* Price & Cost Price (HPP) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Harga Jual (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-green-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    HPP / Modal Bahan (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-mono font-bold focus:outline-none focus:border-brand-green-800"
                  />
                </div>
              </div>

              {/* Live Margin Calculation Card */}
              <div className="p-3 rounded-xl bg-brand-cream-50 border border-brand-green-900/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Proyeksi Laba Kotor:</span>
                  <strong className="text-brand-green-950 font-bold">
                    {formatRupiah(formProfitNominal)} / porsi
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block text-[11px]">Estimasi Margin:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 font-mono">
                    <Percent className="size-3" />
                    {formMarginPercent}%
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Deskripsi Menu
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat keunikan rasa, saus, dan porsi..."
                  className="w-full p-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-brand-green-800 resize-none"
                />
              </div>

              {/* Stock Tracking Toggle */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-xs font-bold text-neutral-800 block">
                      Lacak Stok Porsi
                    </strong>
                    <span className="text-[11px] text-neutral-500">
                      Otomatis berkurang saat transaksi berhasil di kasir
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.trackStock}
                    onChange={(e) => setFormData({ ...formData, trackStock: e.target.checked })}
                    className="size-4 accent-brand-green-900 rounded cursor-pointer"
                  />
                </div>

                {formData.trackStock && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                        Stok Saat Ini (Porsi)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.currentStock}
                        onChange={(e) =>
                          setFormData({ ...formData, currentStock: Number(e.target.value) })
                        }
                        className="w-full h-8 px-2 rounded-lg border border-neutral-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                        Batas Minimum (Alert)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.lowStockThreshold}
                        onChange={(e) =>
                          setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })
                        }
                        className="w-full h-8 px-2 rounded-lg border border-neutral-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Availability Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200">
                <span className="text-xs font-bold text-neutral-700">Status Menu di POS</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    formData.isAvailable
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {formData.isAvailable ? "Tersedia (Buka)" : "Habis (Tutup)"}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  {editingProduct ? "Simpan Perubahan" : "Tambahkan ke Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
