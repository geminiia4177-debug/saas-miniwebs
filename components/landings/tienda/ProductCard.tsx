import React from "react";
import { StoreProduct } from "@/lib/types";
import { COLOR_HEX_MAP, formatPrice } from "./tiendaTypes";
import { Plus, ImageOff, Eye } from "lucide-react";

export interface ProductCardProps {
  product: StoreProduct;
  primaryColor: string;
  onOpenDetail: (p: StoreProduct) => void;
  onQuickAdd: (p: StoreProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  primaryColor,
  onOpenDetail,
  onQuickAdd,
}) => {
  const hasTalles = (product.talles || product.sizes || []).length > 0;
  const hasColores = (product.colores || product.colors || []).length > 0;
  const hasVariants = hasTalles || hasColores;
  const priceNum = Number(product.precio || product.price || 0);
  const img = product.imagen || product.imageUrl || (product.imagenes && product.imagenes[0]);

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className="group relative bg-[#0E1526] hover:bg-[#121B30] rounded-3xl border border-white/5 hover:border-indigo-500/40 p-3.5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
    >
      {/* ── Image Container ── */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 mb-3 border border-white/5">
        {img ? (
          <img
            src={img}
            alt={product.nombre || product.name || "Producto"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-white/5">
            <ImageOff className="w-8 h-8 text-slate-600" />
            <span className="text-[10px] mt-2 font-medium">Sin imagen</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {product.destacado && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/90 text-slate-950 shadow-md backdrop-blur-md">
              ⭐ Destacado
            </span>
          )}
          {product.stock !== undefined && product.stock !== null && product.stock <= 5 && product.stock > 0 && (
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-red-500/80 text-white shadow-md">
              ¡Últimos {product.stock}!
            </span>
          )}
        </div>

        {/* Quick View Hover Hint */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            <span>Ver opciones</span>
          </span>
        </div>
      </div>

      {/* ── Product Info ── */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {product.categoria && (
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1 block truncate">
              {product.categoria}
            </span>
          )}
          <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
            {product.nombre || product.name}
          </h4>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {product.descripcion || product.description || "Producto de alta calidad y confección superior."}
          </p>
        </div>

        {/* Talles & Colores previews */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          {hasTalles && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Talles:</span>
              {(product.talles || product.sizes || []).slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300"
                >
                  {t}
                </span>
              ))}
              {(product.talles || product.sizes || []).length > 5 && (
                <span className="text-[10px] text-slate-500">+{(product.talles || product.sizes || []).length - 5}</span>
              )}
            </div>
          )}

          {hasColores && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Colores:</span>
              {(product.colores || product.colors || []).slice(0, 4).map((c) => {
                const hex = COLOR_HEX_MAP[c.toLowerCase().trim()] || "#6366F1";
                return (
                  <span
                    key={c}
                    title={c}
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
            </div>
          )}

          {/* Price & Add Action */}
          <div className="flex items-center justify-between pt-2 mt-1">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Precio</span>
              <span className="text-lg font-black text-white tabular-nums">
                {formatPrice(priceNum)}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hasVariants) {
                  onOpenDetail(product);
                } else {
                  onQuickAdd(product);
                }
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-lg flex items-center gap-1.5 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, #8B5CF6)`,
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
