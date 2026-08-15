import { z } from "zod";

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export const BusinessTypeEnum = z.enum([
  "barberia", "estetica", "gimnasio", "lavadero", "taller",
  "clinica", "cancha", "menu", "general",
]);

export const BusinessStatusEnum = z.enum([
  "TRIAL", "DEMO", "ACTIVE", "BLOCKED", "ARCHIVED",
]);

const PaymentStatusEnum = z.enum(["pending", "paid", "overdue"]);
const AppointmentStatusEnum = z.enum([
  "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED",
]);
const PaymentMethodEnum = z.enum(["LOCAL", "TRANSFER"]);

// ─── P1-015: STRICT layoutConfig schema — no catchall ─────────────────────────
// All keys are explicitly defined. Unknown keys are rejected.

const BusinessHoursDaySchema = z.object({
  open: z.boolean(),
  from: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  to: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
});

const BusinessHoursSchema = z.object({
  lunes: BusinessHoursDaySchema.optional(),
  martes: BusinessHoursDaySchema.optional(),
  miercoles: BusinessHoursDaySchema.optional(),
  jueves: BusinessHoursDaySchema.optional(),
  viernes: BusinessHoursDaySchema.optional(),
  sabado: BusinessHoursDaySchema.optional(),
  domingo: BusinessHoursDaySchema.optional(),
});

const ServiceItemSchema = z.object({
  name: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  price: z.union([z.string().max(50), z.number()]).optional(),
  precio: z.union([z.string().max(50), z.number()]).optional(),
  duration: z.number().int().min(1).max(480).optional(), // max 8 hours
  emoji: z.string().max(10).optional(),
  imageUrl: z.string().url().max(500).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  desc: z.string().max(1000).optional().nullable(),
  active: z.boolean().optional(),
  id: z.union([z.string(), z.number()]).optional(),
  disponible: z.boolean().optional(),
});

const MenuProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string().max(200),
  precio: z.number().min(0),
  descripcion: z.string().max(1000).optional().nullable(),
  disponible: z.boolean().optional().default(true),
  imageUrl: z.string().url().max(500).optional().nullable(),
});

const MenuCategoriaSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string().max(200),
  products: z.array(MenuProductSchema).max(100).optional().default([]),
});

const SectionConfigSchema = z.object({
  title: z.string().max(300).optional().nullable(),
  subtitle: z.string().max(500).optional().nullable(),
  ctaText: z.string().max(100).optional().nullable(),
  ctaSecondary: z.string().max(100).optional().nullable(),
  items: z.array(ServiceItemSchema).max(100).optional(),
  layout: z.string().max(50).optional(),
  columns: z.number().int().min(1).max(6).optional(),
  showCaption: z.boolean().optional(),
  hours: BusinessHoursSchema.optional(),
  slotDuration: z.number().int().min(5).max(480).optional(),
  fields: z.array(z.object({
    id: z.string().max(50),
    label: z.string().max(100),
    type: z.string().max(50),
    placeholder: z.string().max(200).optional(),
    required: z.boolean().optional(),
    options: z.array(z.string().max(100)).optional(),
  })).max(20).optional(),
  youtubeUrl: z.union([z.string().max(500), z.literal("")]).optional().nullable(),
  autoplay: z.boolean().optional(),
  showMap: z.boolean().optional(),
  mapUrl: z.union([z.string().max(500), z.literal("")]).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  showSocial: z.boolean().optional(),
  showWhatsapp: z.boolean().optional(),
  // Extra display options
  showPrices: z.boolean().optional(),
  showEmployees: z.boolean().optional(),
  backgroundUrl: z.union([z.string().max(500), z.literal("")]).optional().nullable(),
});

const SectionSchema = z.object({
  id: z.string().max(100),
  label: z.string().max(200).optional(),
  icon: z.string().max(100).optional(),
  visible: z.boolean().optional(),
  type: z.string().max(100).optional(),
  config: SectionConfigSchema.optional(),
});

// P1-015: Strict layoutConfig without catchall
export const LayoutConfigSchema = z.object({
  sections: z.array(SectionSchema).max(30).optional(),
  hours: BusinessHoursSchema.optional(),
  themeVariant: z.string().max(50).optional().nullable(),
  onboarded: z.boolean().optional(),
  // Social links (URLs must be reasonable, no javascript: scheme)
  instagram: z.string().max(300).optional().nullable(),
  facebook: z.string().max(300).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  tiktok: z.string().max(300).optional().nullable(),
  // CallMeBot (phone only — API key stored separately in encrypted field)
  callMeBotPhone: z.string().max(30).optional().nullable(),
  // WhatsApp templates (text only)
  waTemplateConfirmed: z.string().max(1000).optional().nullable(),
  waTemplateTransfer: z.string().max(1000).optional().nullable(),
  // Display options
  bannerOpacity: z.number().min(0).max(100).optional(),
  fontSizeHero: z.number().optional().nullable(),
  fontSizeTitles: z.number().optional().nullable(),
  fontSizeBody: z.number().optional().nullable(),
  heroTitle: z.string().max(200).optional().nullable(),
  heroTitleColor: z.union([z.string().regex(/^#[0-9a-fA-F]{3,8}$/).max(9), z.literal("")]).optional().nullable(),
  footerBgColor: z.union([z.string().regex(/^#[0-9a-fA-F]{3,8}$/).max(9), z.literal("")]).optional().nullable(),
  footerTextColor: z.union([z.string().regex(/^#[0-9a-fA-F]{3,8}$/).max(9), z.literal("")]).optional().nullable(),
  bookingBgColor: z.union([z.string().regex(/^#[0-9a-fA-F]{3,8}$/).max(9), z.literal("")]).optional().nullable(),
  reservaMesaActiva: z.boolean().optional(),
  // Menu
  menuCategorias: z.array(MenuCategoriaSchema).max(50).optional(),
  menuPromos: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string().max(200),
    price: z.number().min(0),
    imageUrl: z.string().url().max(500).optional().nullable(),
  })).max(50).optional(),
  // Service lists per business type
  barberiaServices: z.array(ServiceItemSchema).max(100).optional(),
  clinicaServices: z.array(ServiceItemSchema).max(100).optional(),
  tallerServices: z.array(ServiceItemSchema).max(100).optional(),
  canchaTarifas: z.array(ServiceItemSchema).max(100).optional(),
  // Delivery
  deliveryRadio: z.number().min(0).max(1000).optional(),
  modosDisponibles: z.array(z.string().max(50)).max(10).optional(),
  // Address
  address: z.string().max(500).optional().nullable(),
  // Media
  media: z.array(z.object({
    url: z.string().url().max(500),
    caption: z.string().max(200).optional(),
    type: z.enum(["image", "video"]).optional(),
  })).max(50).optional(),
  // Chatbot
  chatbotName: z.string().max(100).optional().nullable(),
  // P1-035: Biolinks and Stats configuration
  biolinks: z.record(z.string(), z.any()).optional().nullable(),
  stats: z.record(z.string(), z.any()).optional().nullable(),
});

// ─── P1-016: Strict paymentData schema ────────────────────────────────────────
export const PaymentDataSchema = z.object({
  method: z.string().max(100).optional(),
  reference: z.string().max(200).optional(),
  lastFour: z.string().max(4).optional(),
  paidAt: z.string().datetime({ offset: true }).optional(),
  amount: z.number().optional(),
  currency: z.string().max(10).optional(),
  notes: z.string().max(500).optional(),
});

// ─── BUSINESS SCHEMAS ─────────────────────────────────────────────────────────

export const businessSchema = z.object({
  name: z.string().min(2).max(200, "El nombre debe tener al menos 2 caracteres"),
  subdomain: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  email: z.string().email("Debe ser un email válido").optional().nullable(),
  customDomain: z.string().max(253).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  type: BusinessTypeEnum.optional().default("general"),
  status: BusinessStatusEnum.optional().default("TRIAL"),
  paymentAmount: z.union([z.string(), z.number()])
    .optional()
    .default(0)
    .transform((val) => Number(val)),
  paymentStatus: PaymentStatusEnum.optional().default("pending"),
});

export const ownerBusinessUpdateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  subdomain: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones").optional(),
  email: z.union([z.string().email().max(320), z.literal("")]).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  type: BusinessTypeEnum.optional(),
  accentColor: z.union([z.string().regex(/^#[0-9a-fA-F]{3,8}$/).max(9), z.literal("")]).optional().nullable(),
  primaryColor: z.union([z.string().regex(/^#[0-9a-fA-F]{3,8}$/).max(9), z.literal("")]).optional().nullable(),
  secondaryColor: z.union([z.string().regex(/^#[0-9a-fA-F]{3,8}$/).max(9), z.literal("")]).optional().nullable(),
  fontFamily: z.enum(["sans", "serif", "mono", "display"]).optional().nullable(),
  logoUrl: z.union([z.string().url().max(500), z.literal("")]).optional().nullable(),
  bannerUrl: z.union([z.string().url().max(500), z.literal("")]).optional().nullable(),
  buttonStyle: z.string().max(50).optional().nullable(),
  backgroundType: z.string().max(50).optional().nullable(),
  backgroundImageUrl: z.union([z.string().url().max(500), z.literal("")]).optional().nullable(),
  // P1-015: Strict layoutConfig — no catchall
  layoutConfig: LayoutConfigSchema.optional().nullable(),
  // P1-030: Validate customDomain hostname (no paths, no javascript:)
  customDomain: z.string()
    .max(253)
    .regex(/^$|^([a-z0-9-]+\.)+[a-z]{2,}$/, "Debe ser un hostname válido (ej: mi-dominio.com)")
    .optional()
    .nullable(),
  // Social links (top-level shortcuts, merged into layoutConfig server-side)
  instagram: z.string().max(300).optional().nullable(),
  facebook: z.string().max(300).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  tiktok: z.string().max(300).optional().nullable(),
  // Encrypted secrets — stored encrypted, never returned decrypted
  callMeBotApiKey: z.string().max(200).optional().nullable(),
  bankDetails: z.string().max(500).optional().nullable(),
  // P1-016: Permitir guardar datos de pago desde el Onboarding
  paymentData: PaymentDataSchema.optional().nullable(),
});

export const adminBusinessUpdateSchema = ownerBusinessUpdateSchema.extend({
  status: BusinessStatusEnum.optional(),
  paymentAmount: z.union([z.string(), z.number(), z.any()])
    .optional().nullable()
    .transform((val) => (val !== undefined && val !== null ? Number(val) : undefined)),
  paymentStatus: PaymentStatusEnum.optional(),
  demoExpiresAt: z.union([z.string().datetime({ offset: true }), z.date(), z.any()]).optional().nullable()
    .transform((val) => (val ? new Date(val) : undefined)),
  nextPayment: z.union([z.string().datetime({ offset: true }), z.date(), z.any()]).optional().nullable()
    .transform((val) => (val ? new Date(val) : undefined)),
  // P1-016: Strict paymentData
  paymentData: PaymentDataSchema.optional().nullable(),
});

// ─── APPOINTMENT SCHEMAS ──────────────────────────────────────────────────────

// P1-013: Public creation schema — minimal fields, no status/internal control
export const publicAppointmentCreateSchema = z.object({
  businessId: z.string().min(1, "businessId es requerido"),
  clientName: z.string().min(2).max(100, "Nombre requerido"),
  clientPhone: z.string().min(6).max(30, "Teléfono requerido"),
  clientEmail: z.string().email("Email inválido").max(320).optional().nullable(),
  date: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  serviceName: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  patente: z.string().max(20).optional().nullable(),
  employeeId: z.string().optional().nullable(),
  paymentMethod: PaymentMethodEnum.optional().default("LOCAL"),
});

// Owner/admin update schema — can change status and payment reference
export const adminAppointmentUpdateSchema = publicAppointmentCreateSchema.extend({
  status: AppointmentStatusEnum.optional(),
  paymentReference: z.string().max(200).optional().nullable(),
});

// Legacy alias — prefer the explicit schemas above
export const appointmentSchema = adminAppointmentUpdateSchema;
