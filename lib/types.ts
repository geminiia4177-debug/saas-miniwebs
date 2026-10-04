export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumb?: string;
  name: string;
  size?: number;
  uploadedAt?: string;
}

export interface ServiceItem {
  id?: string;
  name: string;
  price: string;
  duration: number; // minutes
  emoji?: string;
  imageUrl?: string;
  description?: string;
}

export interface BookingField {
  id: string;
  label: string;
  type: "text" | "tel" | "email" | "select" | "textarea";
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select
}

export interface BusinessHours {
  [day: string]: { open: boolean; from: string; to: string };
}

export interface Section {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  config: Record<string, any>;
}

export interface Appointment {
  id: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  clientphone?: string;
  clientPhone?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

// Menu Specific
export interface MenuProduct {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
  emoji: string;
  tags?: string[];
  disponible: boolean;
  destacado: boolean;
}

export interface MenuCategory {
  id: string;
  nombre: string;
  emoji: string;
  imagen?: string;
  orden: number;
  products: MenuProduct[];
}

export interface LayoutConfig {
  fontSizeBody?: number;
  fontSizeHeadings?: number;
  bannerOpacity?: number;
  bannerHeight?: string;
  
  // Sections and Media (shared)
  sections?: Section[];
  media?: MediaItem[];
  
  // Barberia / Taller / General config
  hours?: BusinessHours;
  instagram?: string;
  whatsapp?: string;
  facebook?: string;
  tiktok?: string;
  
// Menu specific
  menuCategorias?: MenuCategory[];
  menuPromos?: any[];
  modosDisponibles?: ("local" | "delivery" | "llevar")[];
  deliveryRadio?: string;
  reservaMesaActiva?: boolean;

  // Tienda Virtual specific
  tiendaProductos?: StoreProduct[];
  tiendaCategorias?: string[];
  tiendaEnvios?: StoreShipping;
  tiendaPagos?: StorePayment;

  // Chatbot config
  chatbotEnabled?: boolean;
  chatbotName?: string;

  [key: string]: any; // fallback
}

// Tienda Virtual Models
export interface StoreProduct {
  id: string;
  nombre?: string;
  name?: string;
  precio?: number | string;
  price?: number | string;
  descripcion?: string | null;
  description?: string | null;
  categoria?: string | null;
  category?: string | null;
  imagen?: string | null;
  imageUrl?: string | null;
  imagenes?: string[];
  images?: string[];
  talles?: string[];
  sizes?: string[];
  colores?: string[];
  colors?: string[];
  stock?: number | null;
  destacado?: boolean;
  disponible?: boolean;
  active?: boolean;
}

export interface StoreShipping {
  permitirEnvio?: boolean;
  costoEnvio?: number;
  envioGratisDesde?: number | null;
  textoEnvio?: string | null;
  permitirRetiro?: boolean;
  direccionRetiro?: string | null;
  horarioRetiro?: string | null;
}

export interface StorePayment {
  acordarVendedor?: boolean;
  instruccionesAcordar?: string | null;
  mercadoPago?: {
    enabled?: boolean;
    paymentLink?: string | null;
    alias?: string | null;
  };
  stripe?: {
    enabled?: boolean;
    paymentLink?: string | null;
  };
  paypal?: {
    enabled?: boolean;
    meLink?: string | null;
  };
}

export interface Biz {
  id: string;
  name: string;
  subdomain: string;
  type?: string; 
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  bannerUrl?: string;
  phone?: string;
  status?: string;
  customDomain?: string;
  address?: string;
  mapUrl?: string;
  description?: string;
  layoutConfig?: LayoutConfig;
  publishedConfig?: LayoutConfig;
  backgroundType?: "color" | "gradient" | "image";
  backgroundImageUrl?: string;
  buttonStyle?: "rounded" | "square" | "pill";
  instagram?: string;
  whatsapp?: string;
  facebook?: string;
  tiktok?: string;
  tagline?: string;
  paymentData?: {
    country?: "MX" | "AR" | "OTHER";
    clabe?: string;
    bank?: string;
    cbu?: string;
    alias?: string;
    titular?: string;
  };
}

export interface ToastType {
  msg: string;
  type: "success" | "error" | "info";
}
