import { StoreProduct, StoreShipping, StorePayment } from "@/lib/types";

export interface CartItem {
  id: string;
  cartKey: string;
  nombre: string;
  precio: number;
  imagen?: string | null;
  talle?: string | null;
  color?: string | null;
  qty: number;
}

export const COLOR_HEX_MAP: Record<string, string> = {
  negro: "#111111",
  black: "#111111",
  blanco: "#FFFFFF",
  white: "#FFFFFF",
  gris: "#888888",
  gray: "#888888",
  "gris plomo": "#4A4A4A",
  azul: "#2563EB",
  blue: "#2563EB",
  "azul marino": "#1E3A8A",
  navy: "#1E3A8A",
  rojo: "#DC2626",
  red: "#DC2626",
  verde: "#16A34A",
  green: "#16A34A",
  "verde militar": "#4D533C",
  "verde oliva": "#556B2F",
  beige: "#D4C5B9",
  marron: "#78350F",
  brown: "#78350F",
  rosa: "#F472B6",
  pink: "#F472B6",
  amarillo: "#EAB308",
  yellow: "#EAB308",
  naranja: "#F97316",
  orange: "#F97316",
  violeta: "#8B5CF6",
  purple: "#8B5CF6",
};

export const DEMO_PRODUCTS: StoreProduct[] = [
  {
    id: "demo-1",
    nombre: "Remera Oversize Heavyweight",
    precio: 18500,
    descripcion: "Algodón peinado 24/1 premium, corte relajado y costuras reforzadas para máxima durabilidad.",
    categoria: "Remeras",
    imagen: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    talles: ["S", "M", "L", "XL", "XXL"],
    colores: ["Negro", "Blanco", "Beige", "Verde Militar"],
    stock: 25,
    destacado: true,
    disponible: true,
  },
  {
    id: "demo-2",
    nombre: "Hoodie Streetwear",
    precio: 36000,
    descripcion: "Frisa invisible de primera calidad, capucha doble forrada y bolsillo canguro espacioso.",
    categoria: "Buzos",
    imagen: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    talles: ["S", "M", "L", "XL"],
    colores: ["Negro", "Gris", "Azul Marino"],
    stock: 14,
    destacado: true,
    disponible: true,
  },
  {
    id: "demo-3",
    nombre: "Pantalón Cargo Ripstop",
    precio: 32000,
    descripcion: "Tela técnica antidesgarro con 6 bolsillos funcionales y ajuste elástico en cintura.",
    categoria: "Pantalones",
    imagen: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
    talles: ["38", "40", "42", "44"],
    colores: ["Negro", "Verde Oliva", "Beige"],
    stock: 8,
    destacado: false,
    disponible: true,
  },
  {
    id: "demo-4",
    nombre: "Gorra Trucker Vintage",
    precio: 12500,
    descripcion: "Frente estructurado con bordado de alta definición y malla respirable con broche regulable.",
    categoria: "Accesorios",
    imagen: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80",
    colores: ["Negro", "Azul", "Marrón"],
    stock: 20,
    destacado: true,
    disponible: true,
  }
];

export function formatPrice(amount: number, locale = "es-AR"): string {
  return `$${amount.toLocaleString(locale)}`;
}
