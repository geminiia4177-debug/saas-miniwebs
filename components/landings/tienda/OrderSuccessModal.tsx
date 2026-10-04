import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { StorePayment } from "@/lib/types";
import { formatPrice } from "./tiendaTypes";
import { Check, MessageSquare, ExternalLink } from "lucide-react";

export interface OrderSuccessModalProps {
  orderSuccess: any | null;
  paymentMethod: string;
  pagosConfig: StorePayment;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  orderSuccess,
  paymentMethod,
  pagosConfig,
  onClose,
}) => {
  useEffect(() => {
    if (orderSuccess) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [orderSuccess]);

  if (!orderSuccess) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0F172A] border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl text-center animate-scaleIn">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-black text-white mb-1">
          ¡Pedido Registrado con Éxito!
        </h3>
        <p className="text-xs text-slate-300 mb-4">
          Ticket #{orderSuccess.id ? String(orderSuccess.id).slice(-6).toUpperCase() : "NUEVO"}
        </p>

        {/* Summary Card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left text-xs space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">Total:</span>
            <span className="font-bold text-white tabular-nums">
              {formatPrice(Number(orderSuccess.total || 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Entrega:</span>
            <span className="font-bold text-white capitalize">{orderSuccess.type || orderSuccess.deliveryType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Estado:</span>
            <span className="font-bold text-emerald-400">Pendiente de confirmación</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Le enviamos una notificación automática al vendedor. También podés abrir WhatsApp para coordinar directamente:
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {orderSuccess.whatsappUrl ? (
            <a
              href={orderSuccess.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar Pedido por WhatsApp</span>
            </a>
          ) : null}

          {/* Payment Gateway Links */}
          {paymentMethod === "mercadopago" && pagosConfig.mercadoPago?.paymentLink && (
            <a
              href={pagosConfig.mercadoPago.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Pagar con Mercado Pago</span>
            </a>
          )}
          {paymentMethod === "stripe" && pagosConfig.stripe?.paymentLink && (
            <a
              href={pagosConfig.stripe.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Pagar con Tarjeta (Stripe)</span>
            </a>
          )}
          {paymentMethod === "paypal" && pagosConfig.paypal?.meLink && (
            <a
              href={pagosConfig.paypal.meLink}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Pagar con PayPal</span>
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Volver a la Tienda
          </button>
        </div>
      </div>
    </div>
  );
};
