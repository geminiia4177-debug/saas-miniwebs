import React from "react";
import { StoreShipping, StorePayment } from "@/lib/types";
import { formatPrice } from "./tiendaTypes";
import { X, Check, Loader2, CreditCard } from "lucide-react";

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryType: "ENVIO" | "RETIRO";
  enviosConfig: StoreShipping;
  pagosConfig: StorePayment;
  merchantAddress?: string;
  cartGrandTotal: number;
  primaryColor: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  // Form values & handlers
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  addressStreet: string;
  setAddressStreet: (v: string) => void;
  addressCity: string;
  setAddressCity: (v: string) => void;
  addressNotes: string;
  setAddressNotes: (v: string) => void;
  checkoutNotes: string;
  setCheckoutNotes: (v: string) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  deliveryType,
  enviosConfig,
  pagosConfig,
  merchantAddress,
  cartGrandTotal,
  primaryColor,
  isSubmitting,
  onSubmit,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  addressStreet,
  setAddressStreet,
  addressCity,
  setAddressCity,
  addressNotes,
  setAddressNotes,
  checkoutNotes,
  setCheckoutNotes,
  paymentMethod,
  setPaymentMethod,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-scaleIn my-auto max-h-[95vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-white">Finalizar Pedido</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Completa tus datos para coordinar el pedido por WhatsApp
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Customer Info */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              1. Tus Datos
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Sofía Martínez"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp / Celular *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 2345 6789"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              2. Entrega ({deliveryType === "ENVIO" ? "Envío a Domicilio" : "Retiro en Local"})
            </p>

            {deliveryType === "ENVIO" ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Calle, Número y Piso / Dpto *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    placeholder="Ej: Av. San Martín 1420, Piso 3 Dpto B"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Ciudad / Localidad
                    </label>
                    <input
                      type="text"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      placeholder="Ej: Córdoba"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Indicaciones de Entrega
                    </label>
                    <input
                      type="text"
                      value={addressNotes}
                      onChange={(e) => setAddressNotes(e.target.value)}
                      placeholder="Timbre negro, entre calles..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
                <p className="font-bold text-white mb-1">📍 Dirección de Retiro:</p>
                <p>{enviosConfig.direccionRetiro || merchantAddress || "Coordinamos punto de entrega por WhatsApp."}</p>
                {enviosConfig.horarioRetiro && (
                  <p className="text-slate-400 mt-1">⏰ Horario: {enviosConfig.horarioRetiro}</p>
                )}
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              3. Método de Pago
            </p>

            <div className="space-y-2">
              {/* A acordar con el vendedor */}
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === "acordar"
                    ? "bg-indigo-600/15 border-indigo-500"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="acordar"
                  checked={paymentMethod === "acordar"}
                  onChange={() => setPaymentMethod("acordar")}
                  className="mt-1 accent-indigo-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-white">A acordar con el vendedor (Efectivo / Transferencia)</p>
                  <p className="text-slate-400 mt-0.5">
                    {pagosConfig.instruccionesAcordar ||
                      "Coordinas los detalles de pago y envío de comprobante directamente por WhatsApp."}
                  </p>
                </div>
              </label>

              {/* Mercado Pago */}
              {pagosConfig.mercadoPago?.enabled && (
                <label
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "mercadopago"
                      ? "bg-sky-600/15 border-sky-500"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="mercadopago"
                    checked={paymentMethod === "mercadopago"}
                    onChange={() => setPaymentMethod("mercadopago")}
                    className="mt-1 accent-sky-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">Mercado Pago</p>
                      <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-bold">
                        Tarjetas / Débito / Saldo MP
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      Pagas de forma segura mediante enlace de pago o alias de Mercado Pago.
                    </p>
                  </div>
                </label>
              )}

              {/* Stripe */}
              {pagosConfig.stripe?.enabled && (
                <label
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "stripe"
                      ? "bg-purple-600/15 border-purple-500"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === "stripe"}
                    onChange={() => setPaymentMethod("stripe")}
                    className="mt-1 accent-purple-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-white">Tarjeta de Crédito / Débito (Stripe)</p>
                    <p className="text-slate-400 mt-0.5">
                      Cobro internacional o local con tarjeta.
                    </p>
                  </div>
                </label>
              )}

              {/* PayPal */}
              {pagosConfig.paypal?.enabled && (
                <label
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "paypal"
                      ? "bg-blue-600/15 border-blue-500"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === "paypal"}
                    onChange={() => setPaymentMethod("paypal")}
                    className="mt-1 accent-blue-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-white">PayPal</p>
                    <p className="text-slate-400 mt-0.5">
                      Paga con tu cuenta o tarjeta a través de PayPal.
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Order Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas adicionales (Opcional)
            </label>
            <textarea
              value={checkoutNotes}
              onChange={(e) => setCheckoutNotes(e.target.value)}
              placeholder="Aclaraciones sobre el pedido, horario preferido de entrega..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Total & Submit */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex justify-between items-center text-sm font-bold text-white mb-4">
              <span>Total a Pagar:</span>
              <span className="text-xl font-black text-white tabular-nums">
                {formatPrice(cartGrandTotal)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, #8B5CF6)`,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando Pedido...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Pedido</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
