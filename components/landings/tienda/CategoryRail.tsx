import React from "react";
import { ArrowUpDown, X } from "lucide-react";

export type SortOption = "featured" | "price-asc" | "price-desc" | "name";

export interface CategoryRailProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  totalProductsCount: number;
  filteredCount: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchQuery: string;
  onClearFilters: () => void;
}

export const CategoryRail: React.FC<CategoryRailProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  totalProductsCount,
  filteredCount,
  sortBy,
  onSortChange,
  searchQuery,
  onClearFilters,
}) => {
  return (
    <div className="space-y-4 pb-6 border-b border-white/5">
      {/* Horizontal Category Scroll & Sort Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Categories Rail */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === "all"
                ? "bg-white text-slate-900 shadow-lg scale-105"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            Todos ({totalProductsCount})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 capitalize cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-white text-slate-900 shadow-lg scale-105"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="font-medium">Ordenar:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-[#111827] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="featured">Destacados</option>
            <option value="price-asc">Menor Precio</option>
            <option value="price-desc">Mayor Precio</option>
            <option value="name">Nombre (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Filter Info & Reset Button */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Mostrando <b>{filteredCount}</b> productos
          {selectedCategory !== "all" && ` en ${selectedCategory}`}
          {searchQuery && ` para "${searchQuery}"`}
        </span>
        {(selectedCategory !== "all" || searchQuery) && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
