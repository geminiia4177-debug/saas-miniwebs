import { z } from "zod";

const BusinessTypeEnum = z.enum(["barberia", "estetica", "gimnasio", "lavadero", "taller", "clinica", "cancha", "menu", "general"]);
const BusinessStatusEnum = z.enum(["TRIAL", "DEMO", "ACTIVE", "BLOCKED", "ARCHIVED"]);
const PaymentStatusEnum = z.enum(["pending", "paid", "overdue"]);

export const businessSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  subdomain: z.string().min(3, "El subdominio debe tener al menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  email: z.string().email("Debe ser un email válido").optional().nullable(),
  customDomain: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  type: BusinessTypeEnum.optional().default("general"),
  status: BusinessStatusEnum.optional().default("TRIAL"),
  paymentAmount: z.union([z.string(), z.number()]).optional().default(0).transform(val => Number(val)),
  paymentStatus: PaymentStatusEnum.optional().default("pending"),
});

export const ownerBusinessUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  subdomain: z.string().regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones").optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  type: BusinessTypeEnum.optional(),
  accentColor: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  // SEC-P1-001 Fix: Use record for layoutConfig to avoid arbitrary deep prototype pollution
  layoutConfig: z.record(z.string(), z.any()).optional(),
  customDomain: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
});

export const adminBusinessUpdateSchema = ownerBusinessUpdateSchema.extend({
  status: BusinessStatusEnum.optional(),
  paymentAmount: z.union([z.string(), z.number()]).optional().transform(val => val !== undefined ? Number(val) : undefined),
  paymentStatus: PaymentStatusEnum.optional(),
  demoExpiresAt: z.string().datetime({ offset: true }).optional().nullable().transform(val => val ? new Date(val) : undefined),
  nextPayment: z.string().datetime({ offset: true }).optional().nullable().transform(val => val ? new Date(val) : undefined),
  paymentData: z.record(z.string(), z.unknown()).optional(),
});

const AppointmentStatusEnum = z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
const PaymentMethodEnum = z.enum(["LOCAL", "TRANSFER"]);

// SEC-P1-003 Fix: Split appointment schema to prevent clients from setting status/paymentReference
export const publicAppointmentCreateSchema = z.object({
  businessId: z.string().min(1, "businessId es requerido"),
  clientName: z.string().min(2, "Nombre requerido"),
  clientPhone: z.string().min(6, "Teléfono requerido"),
  clientEmail: z.string().email("Email inválido").optional().nullable(),
  date: z.string().or(z.date()).transform(val => new Date(val)),
  serviceName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  patente: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  paymentMethod: PaymentMethodEnum.optional().default("LOCAL"),
});

export const adminAppointmentUpdateSchema = publicAppointmentCreateSchema.extend({
  status: AppointmentStatusEnum.optional(),
  paymentReference: z.string().optional().nullable(),
});

// Legacy support
export const appointmentSchema = adminAppointmentUpdateSchema;
