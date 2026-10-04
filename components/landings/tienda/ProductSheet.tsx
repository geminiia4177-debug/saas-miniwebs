import React from "react";
import { StoreProduct } from "@/lib/types";
import { COLOR_HEX_MAP, formatPrice } from "./tiendaTypes";
import { X, ShoppingBag, Plus, Minus, ImageOff } from "lucide-react";

export interface ProductSheetProps {
  product: StoreProduct | null;
  primaryColor: string;
  selectedTalle: string | null;
  onSelectTalle: (t: string) => void;
  selectedColor: string | null;
  onSelectColor: (c: string) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: (p: StoreProduct, talle: string | null, color: string | null, qty: number) => void;
  onClose: () => void;
}

export const ProductSheet: React.FC<ProductSheetProps> = ({
  product,
  primaryColor,
  selectedTalle,
  onSelectTalle,
  selectedColor,
  onSelectColor,
  quantity,
  onQuantityChange,
  onAddToCart,
  onClose,
}) => {
  if (!product) return null;

  const sizes = product.talles || product.sizes || [];
  const colors = product.colores || product.colors || [];
  const priceNum = Number(product.precio || product.price || 0);
  const img = product.imagen || product.imageUrl || (product.imagenes && product.imagenes[0]);
  const maxStock = product.stock ?? 999;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-scaleIn max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Image */}
        <div className="md:w-1/2 aspect-square md:aspect-auto bg-slate-900 relative">
          {img ? (
            <img
              src={img}
              alt={product.nombre || product.name || "Producto"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-white/5">
              <ImageOff className="w-12 h-12 text-slate-600" />
              <span className="text-xs mt-2">Sin imagen</span>
            </div>
          )}
        </div>

        {/* Modal Content & Selectors */}
        <div className="p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div>
            {product.categoria && (
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 block">
                {product.categoria}
              </span>
            )}
            <h3 className="text-xl font-black text-white mb-2 leading-tight">
              {product.nombre || product.name}
            </h3>
            <div className="text-2xl font-black text-white mb-3 tabular-nums">
              {formatPrice(priceNum)}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {product.descripcion || product.description || "Sin descripción adicional."}
            </p>

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Selecciona tu Talle / Tamaño
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onSelectTalle(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedTalle === t
                          ? "bg-white text-slate-900 ring-2 ring-indigo-500 scale-105"
                          : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {colors.length > 0 && (
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Selecciona Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const isSelected = selectedColor === c;
                    const hex = COLOR_HEX_MAP[c.toLowerCase().trim()] || "#6366F1";
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onSelectColor(c)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/30 text-white border border-indigo-500 shadow-sm"
                            : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: hex }}
                        />
                        <span>{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Controls */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Cantidad
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10 font-bold cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-white text-sm tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(Math.min(maxStock, quantity + 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10 font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {product.stock ? (
                  <span className="text-xs text-slate-400">
                    {product.stock} disponibles
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Add CTA */}
          <button
            type="button"
            onClick={() => onAddToCart(product, selectedTalle, selectedColor, quantity)}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, #8B5CF6)`,
            }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              Agregar al Carrito • {formatPrice(priceNum * quantity)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
