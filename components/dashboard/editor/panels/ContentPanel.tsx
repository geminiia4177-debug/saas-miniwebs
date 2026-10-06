import React from "react";
import { Biz, Section } from "@/lib/constants";
import ConfiguradorTienda from "@/components/dashboard/cartuchos/ConfiguradorTienda";
import ConfiguradorMenu from "@/components/dashboard/cartuchos/ConfiguradorMenu";
import ConfiguradorTaller from "@/components/dashboard/cartuchos/ConfiguradorTaller";
import ConfiguradorBarberia from "@/components/dashboard/cartuchos/ConfiguradorBarberia";
import { DropZone } from "../DropZone";
import { uploadToImgBB } from "@/lib/utils/upload";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AIAssistButton } from "@/components/ui/AIAssistButton";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Video,
  Play,
  ExternalLink,
  Phone,
  MapPin,
  Mail,
  Clock,
  Share2,
  Upload,
  ShoppingBag,
  Image as ImageIcon,
} from "lucide-react";
import { extractYouTubeId } from "@/components/ui/VideoSection";

export interface ContentPanelProps {
  biz: Biz;
  setBiz: (fnOrObj: any) => void;
  sections: Section[];
  setSections: (fnOrVal: any) => void;
  activeSection: Section | null;
  onBackToSections: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void;
}

export const ContentPanel: React.FC<ContentPanelProps> = ({
  biz,
  setBiz,
  sections,
  setSections,
  activeSection,
  onBackToSections,
  showToast,
}) => {
  const bizType = (biz.type || "general").toLowerCase();

  // 1. Specialty Cartridge for Tienda Virtual
  if (bizType === "tienda" && !activeSection) {
    return (
      <div className="space-y-4 pb-20">
        <ConfiguradorTienda biz={biz} setBiz={setBiz} showToast={showToast} activeTab="tiendaProductos" />
      </div>
    );
  }

  // 2. Specialty Cartridge for Gastronomía / Menú
  if ((bizType === "menu" || bizType === "restaurante") && !activeSection) {
    return (
      <div className="space-y-4 pb-20">
        <ConfiguradorMenu biz={biz} setBiz={setBiz} showToast={showToast} activeTab="menuCategorias" />
      </div>
    );
  }

  // 3. Specialty Cartridge for Taller Mecánico / Lavadero
  if ((bizType === "taller" || bizType === "lavadero") && !activeSection) {
    return (
      <div className="space-y-4 pb-20">
        <ConfiguradorTaller biz={biz} setBiz={setBiz} showToast={showToast} activeTab="tallerServices" />
      </div>
    );
  }

  // 4. Specialty Cartridge for Barbería / Estética
  if ((bizType === "barberia" || bizType === "estetica") && !activeSection) {
    return (
      <div className="space-y-4 pb-20">
        <ConfiguradorBarberia biz={biz} setBiz={setBiz} />
      </div>
    );
  }

  // 4. Section-specific editor if a section was selected
  if (activeSection) {
    const sec = sections.find((s) => s.id === activeSection.id) || activeSection;
    const isHero = sec.id === "hero";
    const isServices = sec.id === "services";
    const isVideo = sec.id === "video";
    const isContact = sec.id === "contact" || sec.id === "contacto";
    const isProducts = sec.id === "products" || sec.id === "productos" || sec.id === "catalogo";
    const isGallery = sec.id === "gallery" || sec.id === "galeria";

    const updateConfig = (field: string, val: any) => {
      const updated = sections.map((s) => {
        if (s.id !== sec.id) return s;
        const newConfig = { ...(s.config || {}), [field]: val };
        const newLabel =
          field === "label"
            ? val
            : field === "title" && (!s.label || s.label === "Video Institucional" || s.label === "Video")
            ? val
            : s.label;
        return {
          ...s,
          label: newLabel,
          config: newConfig,
        };
      });

      setSections(updated);

      setBiz((prev: any) => {
        const extra: any = {};
        if (isHero && field === "title") extra.heroTitle = val;
        if (isHero && field === "subtitle") extra.heroSubtitle = val;
        if (isVideo && (field === "youtubeUrl" || field === "videoUrl")) {
          extra.videoUrl = val;
          extra.youtubeUrl = val;
        }
        if (isVideo && field === "title") {
          extra.videoTitle = val;
        }
        return {
          ...prev,
          layoutConfig: {
            ...(prev?.layoutConfig || {}),
            ...extra,
            sections: updated,
          },
        };
      });
    };

    return (
      <div className="space-y-5 pb-20">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToSections}
            className="gap-1.5 -ml-2 text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Secciones</span>
          </Button>
          <span className="text-xs font-semibold text-fg">{sec.label || sec.id}</span>
        </div>

        {isHero && (
          <div className="space-y-4">
            <Field
              label="Título de Portada"
              action={
                <AIAssistButton
                  businessId={biz.id}
                  fieldType="heroTitle"
                  currentText={sec.config?.title || biz.layoutConfig?.heroTitle || biz.name}
                  context={`Rubro: ${biz.type}`}
                  onSelect={(txt) => {
                    updateConfig("title", txt);
                    showToast?.("Título con IA aplicado ✓", "success");
                  }}
                  compact
                />
              }
            >
              <Input
                value={sec.config?.title || biz.layoutConfig?.heroTitle || biz.name}
                onChange={(e) => updateConfig("title", e.target.value)}
                placeholder="Título impactante"
              />
            </Field>

            <Field
              label="Subtítulo o Propuesta de Valor"
              action={
                <AIAssistButton
                  businessId={biz.id}
                  fieldType="heroSubtitle"
                  currentText={sec.config?.subtitle || biz.layoutConfig?.heroSubtitle || ""}
                  context={`Rubro: ${biz.type}. Título: ${sec.config?.title || biz.name}`}
                  onSelect={(txt) => {
                    updateConfig("subtitle", txt);
                    showToast?.("Subtítulo con IA aplicado ✓", "success");
                  }}
                  compact
                />
              }
            >
              <Input
                value={sec.config?.subtitle || biz.layoutConfig?.heroSubtitle || ""}
                onChange={(e) => updateConfig("subtitle", e.target.value)}
                placeholder="Una frase que describa tu diferencial"
              />
            </Field>

            <Field label="Texto del Botón Principal (CTA)">
              <Input
                value={sec.config?.ctaText || "Reservar Turno"}
                onChange={(e) => updateConfig("ctaText", e.target.value)}
                placeholder="Ej: Agendar Ahora"
              />
            </Field>
          </div>
        )}

        {isServices && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
                Servicios ({sec.config?.items?.length || 0})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const items = sec.config?.items || [];
                  updateConfig("items", [
                    ...items,
                    {
                      name: "Nuevo Servicio",
                      price: "$ 5.000",
                      duration: 30,
                      description: "Descripción del servicio",
                    },
                  ]);
                }}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </Button>
            </div>

            <div className="space-y-2.5">
              {(sec.config?.items || []).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface-2 border border-border-default space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.name || ""}
                      onChange={(e) => {
                        const items = [...sec.config.items];
                        items[idx] = { ...items[idx], name: e.target.value };
                        updateConfig("items", items);
                      }}
                      className="font-semibold text-xs text-fg bg-transparent border-b border-transparent focus:border-accent focus:outline-none w-full"
                      placeholder="Nombre del servicio"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const items = sec.config.items.filter((_: any, i: number) => i !== idx);
                        updateConfig("items", items);
                      }}
                      className="text-fg-subtle hover:text-danger p-1 transition-colors"
                      title="Eliminar servicio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.price || ""}
                      onChange={(e) => {
                        const items = [...sec.config.items];
                        items[idx] = { ...items[idx], price: e.target.value };
                        updateConfig("items", items);
                      }}
                      placeholder="Precio (ej: $ 5.000)"
                    />
                    <Input
                      value={item.duration ? `${item.duration} min` : ""}
                      onChange={(e) => {
                        const items = [...sec.config.items];
                        items[idx] = {
                          ...items[idx],
                          duration: parseInt(e.target.value) || 30,
                        };
                        updateConfig("items", items);
                      }}
                      placeholder="Duración (min)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isVideo && (
          <div className="space-y-4">
            <Field label="Nombre de la Sección (Menú y Navegación)">
              <Input
                value={sec.label || "Video Institucional"}
                onChange={(e) => updateConfig("label", e.target.value)}
                placeholder="Ej: Video Institucional, Nuestro Local, etc."
              />
            </Field>

            <Field label="Título del Video">
              <Input
                value={sec.config?.title || sec.label || "Video Institucional"}
                onChange={(e) => updateConfig("title", e.target.value)}
                placeholder="Ej: Conocé nuestro espacio"
              />
            </Field>

            <Field
              label="Descripción o Subtítulo"
              action={
                <AIAssistButton
                  businessId={biz.id}
                  fieldType="description"
                  currentText={sec.config?.description || ""}
                  context={`Sección de video para ${biz.name} (${biz.type})`}
                  onSelect={(txt) => {
                    updateConfig("description", txt);
                    showToast?.("Descripción con IA aplicada ✓", "success");
                  }}
                  compact
                />
              }
            >
              <textarea
                value={sec.config?.description || ""}
                onChange={(e) => updateConfig("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-border-default text-xs text-fg focus:border-accent focus:outline-none resize-none"
                placeholder="Breve texto que acompañe al video..."
              />
            </Field>

            <Field label="Enlace del Video (YouTube o Vimeo)">
              <div className="space-y-2">
                <Input
                  value={sec.config?.youtubeUrl || sec.config?.videoUrl || biz.layoutConfig?.videoUrl || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig("youtubeUrl", val);
                    updateConfig("videoUrl", val);
                  }}
                  placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                />
                <p className="text-[10px] text-fg-subtle">
                  Admite enlaces de YouTube (videos normales o shorts) y enlaces directos.
                </p>
              </div>
            </Field>

            {/* Video Preview */}
            {(() => {
              const currentUrl = sec.config?.youtubeUrl || sec.config?.videoUrl || biz.layoutConfig?.videoUrl || "";
              const ytId = extractYouTubeId(currentUrl);
              if (!currentUrl) return null;

              if (ytId) {
                return (
                  <div className="p-3 rounded-xl bg-surface-2 border border-border-default space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-success flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" />
                        <span>Video detectado ✓</span>
                      </span>
                      <a
                        href={`https://www.youtube.com/watch?v=${ytId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-fg-subtle hover:text-accent flex items-center gap-1 text-[11px]"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-border-subtle group">
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt="Preview video"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="p-2.5 rounded-xl bg-surface-2 border border-border-subtle text-[11px] text-fg-muted">
                  Ingresa un link válido de YouTube para visualizar la vista previa.
                </div>
              );
            })()}

            <div className="pt-2 border-t border-border-subtle">
              <label className="flex items-center gap-2 text-xs text-fg cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!sec.config?.autoplay}
                  onChange={(e) => updateConfig("autoplay", e.target.checked)}
                  className="rounded border-border-default text-accent focus:ring-accent"
                />
                <span>Reproducción automática (silenciada)</span>
              </label>
            </div>
          </div>
        )}

        {/* ── CONTACT SECTION EDITOR ── */}
        {isContact && (
          <div className="space-y-4">
            <Field label="Nombre de la Sección en el Menú">
              <Input
                value={sec.label || "Contacto"}
                onChange={(e) => updateConfig("label", e.target.value)}
                placeholder="Contacto / Ubicación"
              />
            </Field>

            <Field
              label="Título del Bloque"
              action={
                <AIAssistButton
                  businessId={biz.id}
                  fieldType="tagline"
                  currentText={sec.config?.title || "Visítanos o Escríbenos"}
                  context={`Rubro: ${biz.type}`}
                  onSelect={(txt) => {
                    updateConfig("title", txt);
                    showToast?.("Título con IA aplicado ✓", "success");
                  }}
                  compact
                />
              }
            >
              <Input
                value={sec.config?.title || "Visítanos o Escríbenos"}
                onChange={(e) => updateConfig("title", e.target.value)}
                placeholder="Título de contacto"
              />
            </Field>

            <Field label="Número de WhatsApp">
              <Input
                value={sec.config?.whatsapp || biz.whatsapp || (biz as any).phone || biz.layoutConfig?.whatsapp || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig("whatsapp", val);
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

            <Field label="Dirección Física / Local">
              <Input
                value={sec.config?.address || biz.address || biz.layoutConfig?.address || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig("address", val);
                  setBiz((prev: any) => ({
                    ...prev,
                    address: val,
                    layoutConfig: { ...(prev?.layoutConfig || {}), address: val },
                  }));
                }}
                placeholder="Av. Principal 1234, Centro"
              />
            </Field>

            <Field label="Email de Contacto">
              <Input
                type="email"
                value={sec.config?.email || (biz as any).email || biz.layoutConfig?.email || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig("email", val);
                  setBiz((prev: any) => ({
                    ...prev,
                    email: val,
                    layoutConfig: { ...(prev?.layoutConfig || {}), email: val },
                  }));
                }}
                placeholder="contacto@tunegocio.com"
              />
            </Field>

            <Field label="Horarios de Atención">
              <Input
                value={sec.config?.hours || biz.layoutConfig?.hours || "Lunes a Sábado de 09:00 a 20:00"}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig("hours", val);
                  setBiz((prev: any) => ({
                    ...prev,
                    layoutConfig: { ...(prev?.layoutConfig || {}), hours: val },
                  }));
                }}
                placeholder="Lun a Sáb 9:00 a 20:00"
              />
            </Field>

            <Field label="Link de Google Maps">
              <Input
                value={sec.config?.mapUrl || biz.layoutConfig?.mapUrl || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig("mapUrl", val);
                  setBiz((prev: any) => ({
                    ...prev,
                    layoutConfig: { ...(prev?.layoutConfig || {}), mapUrl: val },
                  }));
                }}
                placeholder="https://maps.google.com/..."
              />
            </Field>

            <div className="pt-2 border-t border-border-subtle space-y-2">
              <span className="text-[10px] font-bold uppercase text-fg-subtle tracking-wider">Redes Sociales</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-fg-subtle block mb-1">Instagram</label>
                  <Input
                    value={biz.layoutConfig?.instagram || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBiz((prev: any) => ({
                        ...prev,
                        layoutConfig: { ...(prev?.layoutConfig || {}), instagram: val },
                      }));
                    }}
                    placeholder="@tunegocio"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-fg-subtle block mb-1">Facebook</label>
                  <Input
                    value={biz.layoutConfig?.facebook || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBiz((prev: any) => ({
                        ...prev,
                        layoutConfig: { ...(prev?.layoutConfig || {}), facebook: val },
                      }));
                    }}
                    placeholder="facebook.com/..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUCTS SECTION EDITOR ── */}
        {isProducts && (
          <div className="space-y-4">
            <Field label="Nombre de la Sección en el Menú">
              <Input
                value={sec.label || "Productos"}
                onChange={(e) => updateConfig("label", e.target.value)}
                placeholder="Productos / Catálogo"
              />
            </Field>

            <div className="flex items-center justify-between pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
                Productos ({((sec.config?.items || biz.layoutConfig?.barberiaProducts || biz.layoutConfig?.products || [])).length})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentItems = sec.config?.items || biz.layoutConfig?.barberiaProducts || biz.layoutConfig?.products || [];
                  const newItem = {
                    id: `prod_${Date.now()}`,
                    name: "Nuevo Producto",
                    price: 2500,
                    desc: "Descripción del producto",
                    stock: 10,
                    imageUrl: "",
                  };
                  const updated = [...currentItems, newItem];
                  updateConfig("items", updated);
                  setBiz((prev: any) => ({
                    ...prev,
                    layoutConfig: {
                      ...(prev?.layoutConfig || {}),
                      barberiaProducts: updated,
                      products: updated,
                    },
                  }));
                }}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Producto</span>
              </Button>
            </div>

            <div className="space-y-3">
              {((sec.config?.items || biz.layoutConfig?.barberiaProducts || biz.layoutConfig?.products || [])).map((prod: any, idx: number) => (
                <div key={prod.id || idx} className="p-3.5 rounded-xl bg-surface-2 border border-border-default space-y-2.5">
                  <div className="flex items-start gap-3">
                    {/* Foto Producto */}
                    <div className="w-14 h-14 rounded-lg bg-surface-1 border border-border-default overflow-hidden relative group shrink-0 flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-fg-subtle opacity-40" />
                      )}
                      <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Upload className="w-4 h-4 text-white" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              showToast?.("Subiendo imagen...", "info");
                              try {
                                const url = await uploadToImgBB(e.target.files[0], biz.id);
                                const currentList = sec.config?.items || biz.layoutConfig?.barberiaProducts || biz.layoutConfig?.products || [];
                                const updated = currentList.map((item: any, i: number) => (i === idx || item.id === prod.id) ? { ...item, imageUrl: url } : item);
                                updateConfig("items", updated);
                                setBiz((prev: any) => ({
                                  ...prev,
                                  layoutConfig: {
                                    ...(prev?.layoutConfig || {}),
                                    barberiaProducts: updated,
                                    products: updated,
                                  },
                                }));
                                showToast?.("Imagen del producto subida ✓", "success");
                              } catch {
                                showToast?.("Error al subir foto", "error");
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Input
                        value={prod.name || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const currentList = sec.config?.items || biz.layoutConfig?.barberiaProducts || biz.layoutConfig?.products || [];
                          const updated = currentList.map((item: any, i: number) => (i === idx || item.id === prod.id) ? { ...item, name: val } : item);
                          updateConfig("items", updated);
                          setBiz((prev: any) => ({
                            ...prev,
                            layoutConfig: { ...(prev?.layoutConfig || {}), barberiaProducts: updated, products: updated },
                          }));
                        }}
                        placeholder="Nombre del producto"
                        className="font-bold text-xs"
                      />
                      <Input
                        value={prod.desc || prod.description || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const currentList = sec.config?.items || biz.layoutConfig?.barberiaProducts || biz.layoutConfig?.products || [];
                          const updated = currentList.map((item: any, i: number) => (i === idx || item.id === prod.id) ? { ...item, desc: val, description: val } : item);
                          updateConfig("items", updated);
                          setBiz((prev: any) => ({
                            ...prev,
                            layoutConfig: { ...(prev?.layoutConfig || {}), barberiaProducts: updated, products: updated },
                          }));
                        }}
                        placeholder="Descripción breve..."
                        className="text-[11px]"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentList = sec.config?.items || biz.layoutConfig?.barberiaProducts || biz.layoutConfig?.products || [];
                        const updated = currentList.filter((_: any, i: number) => i !== idx);
                        updateConfig("items", updated);
                        setBiz((prev: any) => ({
                          ...prev,
                          layoutConfig: { ...(prev?.layoutConfig || {}), barberiaProducts: updated, products: updated },
                        }));
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 h-auto shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border-subtle/50">
                    <div>
                      <label className="text-[9px] font-bold text-fg-subtle uppercase block mb-1">Precio ($)</label>
                      <Input
                        type="number"
                        value={prod.price || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const currentList = sec.config?.items || biz.layoutConfig?.barberiaProducts || biz.layoutConfig?.products || [];
                          const updated = currentList.map((item: any, i: number) => (i === idx || item.id === prod.id) ? { ...item, price: val } : item);
                          updateConfig("items", updated);
                          setBiz((prev: any) => ({
                            ...prev,
                            layoutConfig: { ...(prev?.layoutConfig || {}), barberiaProducts: updated, products: updated },
                          }));
                        }}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-fg-subtle uppercase block mb-1">Stock</label>
                      <Input
                        type="number"
                        value={prod.stock || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const currentList = sec.config?.items || biz.layoutConfig?.barberiaProducts || biz.layoutConfig?.products || [];
                          const updated = currentList.map((item: any, i: number) => (i === idx || item.id === prod.id) ? { ...item, stock: val } : item);
                          updateConfig("items", updated);
                          setBiz((prev: any) => ({
                            ...prev,
                            layoutConfig: { ...(prev?.layoutConfig || {}), barberiaProducts: updated, products: updated },
                          }));
                        }}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GALLERY SECTION EDITOR ── */}
        {isGallery && (
          <div className="space-y-4">
            <Field label="Nombre de la Sección en el Menú">
              <Input
                value={sec.label || "Galería"}
                onChange={(e) => updateConfig("label", e.target.value)}
                placeholder="Galería de Fotos"
              />
            </Field>

            <Field label="Título del Bloque">
              <Input
                value={sec.config?.title || "Nuestros Trabajos"}
                onChange={(e) => updateConfig("title", e.target.value)}
                placeholder="Título de la galería"
              />
            </Field>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-fg-subtle tracking-wider">Subir fotos a la galería</span>
              <DropZone
                compact
                onFiles={async (files) => {
                  showToast?.(`Subiendo ${files.length} foto(s)...`, "info");
                  for (const file of files) {
                    try {
                      const url = await uploadToImgBB(file, biz.id);
                      const currentMedia = biz.layoutConfig?.media || [];
                      const newItem = {
                        id: `m_${Date.now()}`,
                        type: "image",
                        url,
                        name: file.name,
                        size: file.size,
                        uploadedAt: new Date().toISOString(),
                      };
                      const updated = [newItem, ...currentMedia];
                      setBiz((prev: any) => ({
                        ...prev,
                        layoutConfig: {
                          ...(prev?.layoutConfig || {}),
                          media: updated,
                        },
                      }));
                      showToast?.("Foto agregada a la galería ✓", "success");
                    } catch {
                      showToast?.(`Error al subir ${file.name}`, "error");
                    }
                  }
                }}
              />
            </div>

            {/* Fotos actuales */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-fg block">
                Fotos ({((biz.layoutConfig?.media || [])).length})
              </span>
              <div className="grid grid-cols-3 gap-2">
                {((biz.layoutConfig?.media || [])).map((m: any, idx: number) => (
                  <div key={m.id || idx} className="relative aspect-square rounded-lg overflow-hidden group border border-border-default">
                    <img src={m.url} alt={m.name || "Foto"} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const current = biz.layoutConfig?.media || [];
                        const updated = current.filter((_: any, i: number) => i !== idx);
                        setBiz((prev: any) => ({
                          ...prev,
                          layoutConfig: { ...(prev?.layoutConfig || {}), media: updated },
                        }));
                      }}
                      className="absolute top-1 right-1 w-6 h-6 rounded bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GENERIC FALLBACK SECTION EDITOR ── */}
        {!isHero && !isServices && !isVideo && !isContact && !isProducts && !isGallery && (
          <div className="space-y-4">
            <Field label="Nombre de la Sección (Menú y Navegación)">
              <Input
                value={sec.label || ""}
                onChange={(e) => updateConfig("label", e.target.value)}
                placeholder="Nombre para el menú/navegación"
              />
            </Field>

            <Field label="Título de la Sección">
              <Input
                value={sec.config?.title || ""}
                onChange={(e) => updateConfig("title", e.target.value)}
                placeholder="Título del bloque"
              />
            </Field>

            <Field
              label="Descripción o Texto informativo"
              action={
                <AIAssistButton
                  businessId={biz.id}
                  fieldType="description"
                  currentText={sec.config?.description || ""}
                  context={`Sección: ${sec.label || sec.id}. Rubro: ${biz.type}`}
                  onSelect={(txt) => {
                    updateConfig("description", txt);
                    showToast?.("Descripción con IA aplicada ✓", "success");
                  }}
                  compact
                />
              }
            >
              <textarea
                value={sec.config?.description || ""}
                onChange={(e) => updateConfig("description", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-border-default text-xs text-fg focus:border-accent focus:outline-none resize-none"
                placeholder="Escribí el texto de este bloque..."
              />
            </Field>
          </div>
        )}
      </div>
    );
  }

  // 5. Default view if no section is active
  return (
    <div className="p-6 text-center space-y-3 bg-surface-2 rounded-xl border border-border-default">
      <p className="text-xs text-fg-muted">
        Seleccioná una sección en la pestaña <strong>Secciones</strong> para editar su contenido específico, o hacé clic directamente en el preview a la derecha.
      </p>
      <Button variant="outline" size="sm" onClick={onBackToSections}>
        Ir a Secciones
      </Button>
    </div>
  );
};
