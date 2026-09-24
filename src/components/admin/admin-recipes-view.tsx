import { useState, useMemo } from "react";
import type { RawMaterial, ProductRecipe, RawMaterialCategory } from "./types";
import { formatRupiah } from "@/components/pos/format";
import {
  UtensilsCrossed,
  Search,
  Plus,
  Scale,
  Package,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  X,
  Edit2,
  Sparkles,
  Boxes,
} from "lucide-react";

interface AdminRecipesViewProps {
  recipes: ProductRecipe[];
  rawMaterials: RawMaterial[];
  onUpdateRecipe: (productId: string, updatedIngredients: ProductRecipe["ingredients"], notes?: string) => void;
  onRestockMaterial: (materialId: string, addedStock: number, newCostPerUnit?: number, notes?: string) => void;
  onAddNewMaterial: (material: Omit<RawMaterial, "id">) => void;
}

export function AdminRecipesView({
  recipes,
  rawMaterials,
  onUpdateRecipe,
  onRestockMaterial,
  onAddNewMaterial,
}: AdminRecipesViewProps) {
  const [subTab, setSubTab] = useState<"RECIPES" | "MATERIALS">("RECIPES");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Restock Modal State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [restockAmount, setRestockAmount] = useState<number>(1000);
  const [restockUnitCost, setRestockUnitCost] = useState<number>(0);
  const [restockSupplier, setRestockSupplier] = useState("");
  const [restockNotes, setRestockNotes] = useState("");

  // Edit Recipe Modal State
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<ProductRecipe | null>(null);
  const [tempIngredients, setTempIngredients] = useState<ProductRecipe["ingredients"]>([]);
  const [recipeNotes, setRecipeNotes] = useState("");

  // Add Material Modal State
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);
  const [newMatName, setNewMatName] = useState("");
  const [newMatCode, setNewMatCode] = useState("");
  const [newMatCategory, setNewMatCategory] = useState<RawMaterialCategory>("PASTA");
  const [newMatStock, setNewMatStock] = useState<number>(1000);
  const [newMatUnit, setNewMatUnit] = useState<"gram" | "ml" | "pcs">("gram");
  const [newMatThreshold, setNewMatThreshold] = useState<number>(500);
  const [newMatCost, setNewMatCost] = useState<number>(30);
  const [newMatSupplier, setNewMatSupplier] = useState("");

  // KPI Calculations
  const totalRawValue = useMemo(() => {
    return rawMaterials.reduce((sum, rm) => sum + rm.currentStock * rm.costPerUnit, 0);
  }, [rawMaterials]);

  const lowStockMaterialsCount = useMemo(() => {
    return rawMaterials.filter((rm) => rm.currentStock <= rm.minThreshold).length;
  }, [rawMaterials]);

  const avgGrossMargin = useMemo(() => {
    if (recipes.length === 0) return 0;
    const totalMargin = recipes.reduce((sum, r) => sum + r.grossMarginPercent, 0);
    return Math.round((totalMargin / recipes.length) * 10) / 10;
  }, [recipes]);

  // Filtered Recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchSearch =
        r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some((ing) => ing.materialName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = categoryFilter === "ALL" || r.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [recipes, searchQuery, categoryFilter]);

  // Filtered Raw Materials
  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.supplier.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "ALL" || m.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [rawMaterials, searchQuery, categoryFilter]);

  // Open Restock Modal
  const handleOpenRestock = (matId?: string) => {
    const target = matId ? rawMaterials.find((m) => m.id === matId) : rawMaterials[0];
    if (target) {
      setSelectedMaterialId(target.id);
      setRestockAmount(target.unit === "pcs" ? 100 : 1000);
      setRestockUnitCost(target.costPerUnit);
      setRestockSupplier(target.supplier);
    }
    setRestockNotes("");
    setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId || restockAmount <= 0) return;
    onRestockMaterial(selectedMaterialId, restockAmount, restockUnitCost, restockNotes);
    setIsRestockModalOpen(false);
  };

  // Open Recipe Edit Modal
  const handleOpenRecipeEdit = (recipe: ProductRecipe) => {
    setEditingRecipe(recipe);
    setTempIngredients([...recipe.ingredients]);
    setRecipeNotes(recipe.notes || "");
    setIsRecipeModalOpen(true);
  };

  const handleUpdateIngredientAmount = (materialId: string, amount: number) => {
    setTempIngredients((prev) =>
      prev.map((ing) => {
        if (ing.materialId === materialId) {
          return {
            ...ing,
            amount,
            subtotalCost: Math.round(amount * ing.costPerUnit),
          };
        }
        return ing;
      })
    );
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe) return;
    onUpdateRecipe(editingRecipe.productId, tempIngredients, recipeNotes);
    setIsRecipeModalOpen(false);
  };

  // Handle Add New Material
  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim() || !newMatCode.trim()) return;

    const catLabels: Record<RawMaterialCategory, string> = {
      PASTA: "Pasta Mentah",
      DAIRY_CHEESE: "Keju & Susu",
      PROTEIN: "Daging & Protein",
      SEASONING: "Bumbu & Minuman",
      PACKAGING: "Kemasan & Packaging",
    };

    onAddNewMaterial({
      code: newMatCode.trim().toUpperCase(),
      name: newMatName.trim(),
      category: newMatCategory,
      categoryLabel: catLabels[newMatCategory],
      currentStock: Number(newMatStock) || 0,
      unit: newMatUnit,
      minThreshold: Number(newMatThreshold) || 100,
      costPerUnit: Number(newMatCost) || 10,
      supplier: newMatSupplier.trim() || "Supplier Lokal",
      lastRestockDate: "Hari ini",
    });

    setIsNewMaterialModalOpen(false);
  };

  // Unit display helper (e.g. 14500 gram -> "14.5 kg", 5500 ml -> "5.5 L")
  const formatQuantity = (amount: number, unit: string) => {
    if (unit === "gram") {
      if (amount >= 1000) {
        return `${(amount / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg (${amount.toLocaleString("id-ID")} g)`;
      }
      return `${amount.toLocaleString("id-ID")} gram`;
    }
    if (unit === "ml") {
      if (amount >= 1000) {
        return `${(amount / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} L (${amount.toLocaleString("id-ID")} ml)`;
      }
      return `${amount.toLocaleString("id-ID")} ml`;
    }
    return `${amount.toLocaleString("id-ID")} ${unit}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-widest">
            <Sparkles className="size-4 text-emerald-600" />
            <span>Fase 2 · Operational Inventory & Recipe BOM</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-green-950 mt-1">
            Manajemen Resep & Bahan Baku Mentah
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl mt-0.5">
            Konversi takaran gramatur keju & makaroni, kalkulasi HPP otomatis per porsi menu, dan pantau batas kapasitas porsi berdasarkan stok bahan mentah.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenRestock()}
            className="h-10 px-3.5 rounded-xl border border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Boxes className="size-4 text-emerald-700" />
            <span>+ Belanja Bahan Mentah</span>
          </button>

          {subTab === "MATERIALS" && (
            <button
              type="button"
              onClick={() => setIsNewMaterialModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="size-4" />
              <span>+ Bahan Baku Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rata-rata Margin Resep</span>
            <TrendingUp className="size-4 text-emerald-600" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-emerald-700">
            {avgGrossMargin}%
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Rasio laba kotor di atas standar F&B (50%)
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Menu Terhubung Resep</span>
            <UtensilsCrossed className="size-4 text-blue-600" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-blue-900">
            {recipes.length}{" "}
            <span className="text-xs font-bold text-neutral-500 font-sans">menu katalog</span>
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            HPP terhitung otomatis per gram/ml
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bahan Menipis</span>
            <AlertTriangle className={`size-4 ${lowStockMaterialsCount > 0 ? "text-amber-600" : "text-emerald-600"}`} />
          </div>
          <div className={`font-display font-black text-2xl sm:text-3xl ${lowStockMaterialsCount > 0 ? "text-amber-900" : "text-brand-green-950"}`}>
            {lowStockMaterialsCount}{" "}
            <span className="text-xs font-bold text-neutral-500 font-sans">bahan mentah</span>
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            {lowStockMaterialsCount > 0 ? "Perlu restock untuk hindari limit porsi" : "Semua bahan baku dalam kuota aman"}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-brand-green-950 text-white shadow-xs">
          <div className="flex items-center justify-between text-brand-yellow-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Nilai Aset Bahan Dapur</span>
            <DollarSign className="size-4" />
          </div>
          <div className="font-display font-black text-xl sm:text-2xl text-white">
            {formatRupiah(totalRawValue)}
          </div>
          <span className="text-[11px] text-emerald-300 mt-1 block">
            {rawMaterials.length} jenis bahan mentah di outlet
          </span>
        </div>
      </div>

      {/* Sub-Tabs Switcher & Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-brand-green-900/10 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Tab Buttons */}
        <div className="flex items-center rounded-xl bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => {
              setSubTab("RECIPES");
              setCategoryFilter("ALL");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === "RECIPES"
                ? "bg-white text-emerald-950 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <UtensilsCrossed className="size-3.5 text-emerald-700" />
            <span>Resep Menu & HPP (BOM)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab("MATERIALS");
              setCategoryFilter("ALL");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === "MATERIALS"
                ? "bg-white text-emerald-950 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Scale className="size-3.5 text-emerald-700" />
            <span>Master Bahan Baku Mentah ({rawMaterials.length})</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={subTab === "RECIPES" ? "Cari resep menu..." : "Cari bahan baku, supplier..."}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            {subTab === "RECIPES" ? (
              <>
                <option value="mac">Mac & Cheese</option>
                <option value="sides">Sides & Katsu</option>
                <option value="drinks">Minuman</option>
              </>
            ) : (
              <>
                <option value="PASTA">Pasta Mentah</option>
                <option value="DAIRY_CHEESE">Keju & Susu</option>
                <option value="PROTEIN">Daging & Protein</option>
                <option value="SEASONING">Bumbu & Minuman</option>
                <option value="PACKAGING">Kemasan & Packaging</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: RESEP MENU & KALKULASI HPP (BOM) */}
      {/* ========================================================================= */}
      {subTab === "RECIPES" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.productId}
              className="rounded-3xl border border-brand-green-900/10 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Recipe Card Header */}
              <div className="p-5 border-b border-neutral-100 bg-neutral-50/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {recipe.category === "mac" ? "Mac & Cheese" : recipe.category === "sides" ? "Sides" : "Minuman"}
                    </span>
                    <h3 className="font-display font-extrabold text-lg sm:text-xl text-brand-green-950 mt-1">
                      {recipe.productName}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Harga Jual Menu
                    </span>
                    <span className="font-display font-black text-lg text-brand-green-900">
                      {formatRupiah(recipe.sellingPrice)}
                    </span>
                  </div>
                </div>

                {/* Financial Summary Badges */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-200/60">
                  <div className="p-2.5 rounded-xl bg-white border border-neutral-200">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">Total HPP Resep</span>
                    <span className="font-mono font-black text-sm text-neutral-900">
                      {formatRupiah(recipe.totalHpp)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-neutral-200">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">Laba Kotor / Porsi</span>
                    <span className="font-mono font-black text-sm text-emerald-700">
                      {formatRupiah(recipe.grossMarginAmount)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Margin Kotor</span>
                    <span className="font-display font-black text-sm text-emerald-800">
                      {recipe.grossMarginPercent}%
                    </span>
                  </div>
                </div>

                {/* Real-time Portions Limit Alert */}
                <div className="mt-3 p-2.5 rounded-xl bg-brand-cream-100 border border-brand-green-900/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-brand-green-950 font-bold">
                    <Package className="size-4 text-emerald-700 shrink-0" />
                    <span>Kapasitas Stok Bahan:</span>
                    <strong className="text-emerald-800 font-display font-black">
                      {recipe.maxPortionsAvailable} porsi
                    </strong>
                  </div>
                  <span className="text-[10px] text-neutral-500 italic truncate max-w-[180px]">
                    Limit: {recipe.limitingMaterialName}
                  </span>
                </div>
              </div>

              {/* Recipe Ingredients Breakdown Table */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center justify-between">
                    <span>Komposisi Bahan per Porsi (BOM)</span>
                    <span className="text-[10px] font-normal lowercase">{recipe.ingredients.length} item bahan</span>
                  </h4>

                  <div className="divide-y divide-neutral-100 text-xs">
                    {recipe.ingredients.map((ing) => (
                      <div key={ing.materialId} className="py-2 first:pt-0 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-neutral-800 block truncate">
                            {ing.materialName}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            @{formatRupiah(ing.costPerUnit)} / {ing.unit}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md font-bold text-[11px]">
                            {ing.amount} {ing.unit}
                          </span>
                          <span className="font-mono font-bold text-neutral-900 min-w-[70px] text-right">
                            {formatRupiah(ing.subtotalCost)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {recipe.notes && (
                    <p className="text-[11px] text-neutral-500 italic mt-3 pt-2 border-t border-neutral-100">
                      Catatan resep: {recipe.notes}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenRecipeEdit(recipe)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 hover:border-emerald-600/30 hover:bg-emerald-50 text-neutral-700 hover:text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="size-3.5" />
                    <span>Sesuaikan Takaran Resep</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MASTER STOK BAHAN BAKU MENTAH */}
      {/* ========================================================================= */}
      {subTab === "MATERIALS" && (
        <div className="rounded-3xl border border-brand-green-900/10 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Kode & Bahan Baku</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Stok Fisik Saat Ini</th>
                  <th className="py-3 px-4 text-center">Status Level</th>
                  <th className="py-3 px-4 text-right">Harga Modal / Satuan</th>
                  <th className="py-3 px-4 text-right">Total Nilai Bahan</th>
                  <th className="py-3 px-4">Supplier & Restock</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {filteredMaterials.map((mat) => {
                  const isLow = mat.currentStock <= mat.minThreshold;
                  const totalValue = mat.currentStock * mat.costPerUnit;

                  return (
                    <tr key={mat.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900">{mat.name}</div>
                        <span className="font-mono text-[10px] text-neutral-400">{mat.code}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                          {mat.categoryLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-sm text-neutral-900">
                          {formatQuantity(mat.currentStock, mat.unit)}
                        </span>
                        <span className="block text-[10px] text-neutral-400">
                          Batas min: {mat.minThreshold.toLocaleString("id-ID")} {mat.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isLow
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isLow ? <AlertTriangle className="size-3" /> : <CheckCircle2 className="size-3" />}
                          <span>{isLow ? "MENIPIS" : "AMAN"}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-neutral-900">
                          {formatRupiah(mat.costPerUnit)}
                        </span>
                        <span className="block text-[10px] text-neutral-400">per {mat.unit}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-800">
                          {formatRupiah(totalValue)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-neutral-700 font-medium truncate max-w-[160px]">{mat.supplier}</div>
                        <span className="text-[10px] text-neutral-400">Terakhir: {mat.lastRestockDate}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenRestock(mat.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-600/20 transition-colors cursor-pointer"
                        >
                          + Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BELANJA / RESTOCK BAHAN BAKU */}
      {/* ========================================================================= */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-green-950 text-white flex items-center justify-between">
              <div>
                <span className="text-brand-yellow-400 text-[10px] font-black uppercase tracking-widest block">
                  Inventory Restock
                </span>
                <h3 className="font-display font-extrabold text-lg text-white">
                  Catat Belanja Bahan Mentah
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Pilih Bahan Baku <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedMaterialId(id);
                    const mat = rawMaterials.find((m) => m.id === id);
                    if (mat) {
                      setRestockUnitCost(mat.costPerUnit);
                      setRestockSupplier(mat.supplier);
                      setRestockAmount(mat.unit === "pcs" ? 100 : 1000);
                    }
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code}) — Sisa: {m.currentStock.toLocaleString("id-ID")} {m.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Jumlah Masuk <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Satuan: {rawMaterials.find((m) => m.id === selectedMaterialId)?.unit || "gram"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Harga Modal / Unit (Rp)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockUnitCost}
                    onChange={(e) => setRestockUnitCost(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Total: {formatRupiah(restockAmount * restockUnitCost)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nama Supplier / Toko
                </label>
                <input
                  type="text"
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  placeholder="Contoh: PT Bogasari Flour Mills"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Catatan / No. Struk Faktur
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Misal: Faktur #INV-BOGA-0924"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Konfirmasi Masuk Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SESUAIKAN TAKARAN RESEP MENU (EDIT BOM) */}
      {/* ========================================================================= */}
      {isRecipeModalOpen && editingRecipe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="p-5 bg-brand-green-950 text-white flex items-center justify-between">
              <div>
                <span className="text-brand-yellow-400 text-[10px] font-black uppercase tracking-widest block">
                  Bill of Materials (BOM) Editor
                </span>
                <h3 className="font-display font-extrabold text-lg text-white">
                  Sesuaikan Resep: {editingRecipe.productName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecipeModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 rounded-2xl bg-brand-cream-100 border border-brand-green-900/10 flex justify-between items-center text-xs">
                <div>
                  <span className="text-neutral-500 font-bold block">Harga Jual:</span>
                  <span className="font-display font-black text-brand-green-950 text-base">
                    {formatRupiah(editingRecipe.sellingPrice)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-neutral-500 font-bold block">Kalkulasi HPP Baru:</span>
                  <span className="font-display font-black text-emerald-800 text-base">
                    {formatRupiah(tempIngredients.reduce((s, i) => s + i.subtotalCost, 0))}
                  </span>
                </div>
              </div>

              {/* Ingredients Inputs */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Takaran Bahan Baku per 1 Porsi Sajian
                </label>

                {tempIngredients.map((ing) => (
                  <div key={ing.materialId} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/60 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-neutral-900 text-xs block truncate">
                        {ing.materialName}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Biaya: {formatRupiah(ing.costPerUnit)} / {ing.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={ing.amount}
                        onChange={(e) => handleUpdateIngredientAmount(ing.materialId, Number(e.target.value))}
                        className="w-20 h-9 px-2 text-center rounded-lg border border-neutral-300 font-mono font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                      <span className="text-xs text-neutral-500 font-bold w-10">{ing.unit}</span>
                      <span className="font-mono font-bold text-xs text-emerald-800 min-w-[70px] text-right">
                        {formatRupiah(ing.subtotalCost)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Catatan SOP Racikan Dapur
                </label>
                <textarea
                  rows={2}
                  value={recipeNotes}
                  onChange={(e) => setRecipeNotes(e.target.value)}
                  placeholder="Catatan takaran atau instruksi porsi..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Simpan Resep & Update HPP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TAMBAH BAHAN BAKU MENTAH BARU */}
      {/* ========================================================================= */}
      {isNewMaterialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-green-950 text-white flex items-center justify-between">
              <div>
                <span className="text-brand-yellow-400 text-[10px] font-black uppercase tracking-widest block">
                  Master Bahan Baku
                </span>
                <h3 className="font-display font-extrabold text-lg text-white">
                  Tambah Bahan Baku Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMaterialModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Kode Bahan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatCode}
                    onChange={(e) => setNewMatCode(e.target.value.toUpperCase())}
                    placeholder="MISAL: RM-CHK-02"
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 font-mono font-bold text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Satuan Terkecil <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={newMatUnit}
                    onChange={(e) => setNewMatUnit(e.target.value as "gram" | "ml" | "pcs")}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="gram">gram (g)</option>
                    <option value="ml">mililiter (ml)</option>
                    <option value="pcs">pcs (buah)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nama Bahan Baku <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMatName}
                  onChange={(e) => setNewMatName(e.target.value)}
                  placeholder="Contoh: Saus BBQ Smokey Kemasan"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Kategori Bahan
                  </label>
                  <select
                    value={newMatCategory}
                    onChange={(e) => setNewMatCategory(e.target.value as RawMaterialCategory)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="PASTA">Pasta Mentah</option>
                    <option value="DAIRY_CHEESE">Keju & Susu</option>
                    <option value="PROTEIN">Daging & Protein</option>
                    <option value="SEASONING">Bumbu & Minuman</option>
                    <option value="PACKAGING">Kemasan & Packaging</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Harga Modal / Unit (Rp) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMatCost}
                    onChange={(e) => setNewMatCost(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Stok Awal ({newMatUnit}) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMatStock}
                    onChange={(e) => setNewMatStock(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Batas Peringatan Min.
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMatThreshold}
                    onChange={(e) => setNewMatThreshold(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Supplier / Pemasok
                </label>
                <input
                  type="text"
                  value={newMatSupplier}
                  onChange={(e) => setNewMatSupplier(e.target.value)}
                  placeholder="Nama supplier bahan..."
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewMaterialModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Simpan Bahan Mentah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
