import React from "react";
import { StoreShipping } from "@/lib/types";
import { CartItem, formatPrice } from "./tiendaTypes";
import { ShoppingBag, X, Check, Trash2, Truck, Store, Plus, Minus, ArrowRight } from "lucide-react";

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  cartTotalQty: number;
  cartSubtotal: number;
  shippingCost: number;
  cartGrandTotal: number;
  deliveryType: "ENVIO" | "RETIRO";
  onDeliveryTypeChange: (type: "ENVIO" | "RETIRO") => void;
  enviosConfig: StoreShipping;
  primaryColor: string;
  freeShippingNeeded: number;
  onUpdateQty: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onStartCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  cartTotalQty,
  cartSubtotal,
  shippingCost,
  cartGrandTotal,
  deliveryType,
  onDeliveryTypeChange,
  enviosConfig,
  primaryColor,
  freeShippingNeeded,
  onUpdateQty,
  onRemoveItem,
  onStartCheckout,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0F172A] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl animate-slideLeft"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cart Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#111A2E]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-black text-white">Tu Carrito</h3>
            <span className="text-xs bg-white/10 text-white font-bold px-2 py-0.5 rounded-full">
              {cartTotalQty}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        {enviosConfig.envioGratisDesde ? (
          <div className="px-5 py-3 bg-indigo-950/30 border-b border-indigo-500/20 text-xs">
            {freeShippingNeeded > 0 ? (
              <div>
                <div className="flex justify-between font-medium text-indigo-300 mb-1.5">
                  <span>¡Te faltan <b>{formatPrice(freeShippingNeeded)}</b> para envío gratis!</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (cartSubtotal / Number(enviosConfig.envioGratisDesde)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check className="w-4 h-4" />
                <span>¡Felicitaciones! Tienes ENVÍO GRATIS 🎉</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-600">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-white mb-1">Tu carrito está vacío</p>
              <p className="text-xs text-slate-400 mb-4">
                Agrega productos de la tienda para comenzar tu pedido.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Ver Productos
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartKey}
                className="flex gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/5 relative group"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/5">
                  {item.imagen ? (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ShoppingBag className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start pr-6">
                      <h4 className="text-sm font-bold text-white truncate">
                        {item.nombre}
                      </h4>
                    </div>
                    <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                      {item.talle && (
                        <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                          Talle: {item.talle}
                        </span>
                      )}
                      {item.color && (
                        <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                          Color: {item.color}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-black text-white tabular-nums">
                      {formatPrice(item.precio * item.qty)}
                    </span>
                    <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.cartKey, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-white/20 text-xs font-bold cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.cartKey, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-white/20 text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.cartKey)}
                  className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-white/10 bg-[#111A2E] space-y-4">
            {/* Delivery Type Option */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Forma de Entrega
              </label>
              <div className="grid grid-cols-2 gap-2">
                {enviosConfig.permitirEnvio !== false && (
                  <button
                    type="button"
                    onClick={() => onDeliveryTypeChange("ENVIO")}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      deliveryType === "ENVIO"
                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Truck className={`w-3.5 h-3.5 ${deliveryType === "ENVIO" ? "text-indigo-400" : ""}`} />
                      <span>Envío a domicilio</span>
                    </div>
                    <span className="text-[10px] block font-normal text-slate-400">
                      {shippingCost === 0 ? "¡Envío Gratis!" : formatPrice(shippingCost)}
                    </span>
                  </button>
                )}

                {enviosConfig.permitirRetiro !== false && (
                  <button
                    type="button"
                    onClick={() => onDeliveryTypeChange("RETIRO")}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      deliveryType === "RETIRO"
                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Store className={`w-3.5 h-3.5 ${deliveryType === "RETIRO" ? "text-indigo-400" : ""}`} />
                      <span>Retiro en Local</span>
                    </div>
                    <span className="text-[10px] block font-normal text-emerald-400">
                      Gratis
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Price Summary */}
            <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-white/5">
              <div className="flex justify-between">
                <span>Subtotal productos:</span>
                <span className="font-bold text-white tabular-nums">{formatPrice(cartSubtotal)}</span>
              </div>
              {deliveryType === "ENVIO" && (
                <div className="flex justify-between">
                  <span>Costo de envío:</span>
                  <span className={`tabular-nums ${shippingCost === 0 ? "text-emerald-400 font-bold" : "font-bold text-white"}`}>
                    {shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                <span>Total:</span>
                <span className="tabular-nums">{formatPrice(cartGrandTotal)}</span>
              </div>
            </div>

            {/* Start Checkout CTA */}
            <button
              type="button"
              onClick={onStartCheckout}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, #8B5CF6)`,
              }}
            >
              <span>Iniciar Pedido</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
