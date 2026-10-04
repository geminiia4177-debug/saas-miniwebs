import React from "react";
import { StoreProduct } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { PackageOpen, MessageCircle, SearchX } from "lucide-react";

export interface ProductGridProps {
  products: StoreProduct[];
  filteredProducts: StoreProduct[];
  primaryColor: string;
  isUsingDemoProducts: boolean;
  storeName: string;
  merchantPhone: string;
  onOpenDetail: (p: StoreProduct) => void;
  onQuickAdd: (p: StoreProduct) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  filteredProducts,
  primaryColor,
  isUsingDemoProducts,
  storeName,
  merchantPhone,
  onOpenDetail,
  onQuickAdd,
}) => {
  const cleanPhone = merchantPhone.replace(/\D/g, "");

  // 1. Truly Empty Store (D10: Public visitors see friendly empty state with direct WhatsApp CTA)
  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-[#0E1526] rounded-3xl border border-white/5 p-8 max-w-xl mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <PackageOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Catálogo en preparación</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          Estamos actualizando nuestros productos y promociones para brindarte la mejor experiencia. Escribinos directamente por WhatsApp para consultar disponibilidad y pedidos.
        </p>
        {cleanPhone && (
          <a
            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `¡Hola! Estoy visitando la tienda de ${storeName} y quería consultar los productos disponibles.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg active:scale-95"
          >
            <MessageCircle className="w-4 h-4 text-white" />
            <span>Consultar por WhatsApp</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── DEMO NOTICE (Preview Mode Only) ── */}
      {isUsingDemoProducts && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">🛠️</span>
            <span>
              <strong>Modo Vista Previa:</strong> Mostrando productos de demostración. Los visitantes públicos no verán estos productos ficticios. Agregá tus productos en la pestaña Tienda del Editor.
            </span>
          </div>
        </div>
      )}

      {/* ── Search / Filter No Results State ── */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/5 p-8">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No se encontraron productos</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Intenta cambiar tu búsqueda o selecciona otra categoría para ver los productos disponibles.
          </p>
        </div>
      ) : (
        /* ── Grid of Products ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              primaryColor={primaryColor}
              onOpenDetail={onOpenDetail}
              onQuickAdd={onQuickAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
};
