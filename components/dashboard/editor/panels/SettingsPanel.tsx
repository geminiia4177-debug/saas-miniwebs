import React from "react";
import { Biz, DEFAULT_HOURS } from "@/lib/constants";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { MessageSquare, Phone, MapPin, Share2, Bot, Clock } from "lucide-react";

export interface SettingsPanelProps {
  biz: Biz;
  setBiz: (fnOrObj: any) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  biz,
  setBiz,
  showToast,
}) => {
  const layout = biz.layoutConfig || {};

  const updateLayoutField = (field: string, val: any) => {
    setBiz((prev: any) => ({
      ...prev,
      layoutConfig: {
        ...(prev?.layoutConfig || {}),
        [field]: val,
      },
    }));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ── 1. WHATSAPP & CONTACTO ── */}
      <section className="p-4 rounded-xl bg-surface-2 border border-border-default space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
              Contacto y WhatsApp
            </h3>
          </div>
          <HelpTooltip
            title="Canal de Notificaciones"
            description="A este número llegarán todos los pedidos de la tienda y turnos agendados por tus clientes."
          />
        </div>

        <Field
          label="Número de WhatsApp"
          hint="Incluí código de país (ej. +54 9 11... o +52 1...)"
          required
        >
          <Input
            value={biz.whatsapp || (biz as any).phone || layout.whatsapp || ""}
            onChange={(e) => {
              const val = e.target.value;
              setBiz((prev: any) => ({
                ...prev,
                whatsapp: val,
                phone: val,
                layoutConfig: { ...(prev?.layoutConfig || {}), whatsapp: val },
              }));
            }}
            placeholder="+54 9 11 2345-6789"
          />
        </Field>

        <Field label="Dirección física del local" hint="Se muestra en el pie de página y en el mapa">
          <Input
            value={biz.address || layout.address || ""}
            onChange={(e) => {
              const val = e.target.value;
              setBiz((prev: any) => ({
                ...prev,
                address: val,
                layoutConfig: { ...(prev?.layoutConfig || {}), address: val },
              }));
            }}
            placeholder="Av. Corrientes 1234, CABA"
          />
        </Field>
      </section>

      {/* ── 2. REDES SOCIALES ── */}
      <section className="p-4 rounded-xl bg-surface-2 border border-border-default space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
              Redes Sociales
            </h3>
          </div>
        </div>

        <Field label="Usuario de Instagram">
          <Input
            value={layout.instagram || (biz as any).instagram || ""}
            onChange={(e) => updateLayoutField("instagram", e.target.value)}
            placeholder="@tunegocio"
          />
        </Field>

        <Field label="Página de Facebook">
          <Input
            value={layout.facebook || (biz as any).facebook || ""}
            onChange={(e) => updateLayoutField("facebook", e.target.value)}
            placeholder="facebook.com/tunegocio"
          />
        </Field>

        <Field label="Usuario de TikTok">
          <Input
            value={layout.tiktok || (biz as any).tiktok || ""}
            onChange={(e) => updateLayoutField("tiktok", e.target.value)}
            placeholder="@tunegocio.tiktok"
          />
        </Field>
      </section>

      {/* ── 3. ASISTENTE VIRTUAL IA ── */}
      <section className="p-4 rounded-xl bg-surface-2 border border-border-default space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
              Asistente Virtual (Chatbot)
            </h3>
          </div>
          <Switch
            checked={layout.chatbotEnabled !== false}
            onChange={(c) => updateLayoutField("chatbotEnabled", c)}
            size="sm"
          />
        </div>

        {layout.chatbotEnabled !== false && (
          <Field label="Nombre del Asistente">
            <Input
              value={layout.chatbotName || "Asistente Virtual"}
              onChange={(e) => updateLayoutField("chatbotName", e.target.value)}
              placeholder="Ej: Sofía de Tienda Moda"
            />
          </Field>
        )}
      </section>

      {/* ── 4. HORARIOS ── */}
      <section className="p-4 rounded-xl bg-surface-2 border border-border-default space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
              Horarios de Atención
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          {["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"].map(
            (day) => {
              const currentHours = layout.hours?.[day] || DEFAULT_HOURS[day] || {
                open: true,
                from: "09:00",
                to: "19:00",
              };

              return (
                <div
                  key={day}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-1 border border-border-subtle text-xs"
                >
                  <span className="capitalize font-medium text-fg w-24">{day}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={currentHours.from || "09:00"}
                      onChange={(e) => {
                        const updated = {
                          ...(layout.hours || {}),
                          [day]: { ...currentHours, from: e.target.value },
                        };
                        updateLayoutField("hours", updated);
                      }}
                      className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-fg text-xs"
                    />
                    <span className="text-fg-subtle">a</span>
                    <input
                      type="time"
                      value={currentHours.to || "19:00"}
                      onChange={(e) => {
                        const updated = {
                          ...(layout.hours || {}),
                          [day]: { ...currentHours, to: e.target.value },
                        };
                        updateLayoutField("hours", updated);
                      }}
                      className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-default text-fg text-xs"
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>
    </div>
  );
};
