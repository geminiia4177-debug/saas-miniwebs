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

  // Chatbot config
  chatbotEnabled?: boolean;
  chatbotName?: string;

  [key: string]: any; // fallback
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
  backgroundType?: "color" | "gradient" | "image";
  backgroundImageUrl?: string;
  buttonStyle?: "rounded" | "square" | "pill";
  instagram?: string;
  whatsapp?: string;
  facebook?: string;
  tiktok?: string;
  tagline?: string;
  paymentData?: {
    cbu?: string;
    alias?: string;
    titular?: string;
  };
}

export interface ToastType {
  msg: string;
  type: "success" | "error" | "info";
}
