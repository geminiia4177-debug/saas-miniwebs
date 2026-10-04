import React from "react";
import { formatPrice } from "./tiendaTypes";
import { ShoppingBag } from "lucide-react";

export interface FloatingCartButtonProps {
  cartTotalQty: number;
  cartGrandTotal: number;
  primaryColor: string;
  isVisible: boolean;
  onClick: () => void;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  cartTotalQty,
  cartGrandTotal,
  primaryColor,
  isVisible,
  onClick,
}) => {
  if (!isVisible || cartTotalQty <= 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 px-4 sm:hidden z-40 pointer-events-none flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto w-full max-w-sm flex items-center justify-between px-5 py-3.5 rounded-2xl text-white font-bold text-sm shadow-2xl transition-all active:scale-95 animate-bounce cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, #8B5CF6)`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-white text-slate-900 text-xs font-black flex items-center justify-center">
            {cartTotalQty}
          </span>
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4" />
            <span>Ver Carrito</span>
          </div>
        </div>
        <span className="font-black tabular-nums">{formatPrice(cartGrandTotal)}</span>
      </button>
    </div>
  );
};
