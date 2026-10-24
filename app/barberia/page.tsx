import React from "react";
import BarberiaTemplate from "@/components/landings/BarberiaTemplate";

export const metadata = {
  title: "The Barber Club • 1924 | Barbería Clásica Americana",
  description: "Cortes de autor, navaja afilada y toalla caliente al estilo Siglo XX.",
};

const mockNegocio = {
  id: "demo",
  name: "The Barber Club",
  tagline: "Tradición, Navaja & Toalla Caliente",
  description: "Barbería clásica americana y speakeasy inspirada en los años 1920 a 1950. Cortes pulidos a tijera, afeitados con navaja recta y productos botánicos de época.",
  phone: "+54 11 4567-8900",
  whatsapp: "+5491145678900",
  email: "citas@thebarberclub.com",
  instagram: "thebarberclub1924",
  facebook: "thebarberclub1924",
  tiktok: "thebarberclub1924",
  address: "Av. Alvear 1924, Recoleta, Buenos Aires",
  mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.0168878894506!2d-58.3815598!3d-34.5910433!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccabb22e4c9e7%3A0x6b107e3b5e43a992!2sAv.%20Alvear%201924!5e0!3m2!1ses!2sar!4v1680000000000!5m2!1ses!2sar",
  accentColor: "#C8A96E",
  primaryColor: "#1A0F0A",
  secondaryColor: "#0F2F3A",
  layoutConfig: {
    heroTitle: "The Barber Club",
    heroText: "Reservá tu turno online en segundos. Asiento de cuero, navaja afilada, toalla caliente y el mejor corte tradicional de autor.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    barberiaServices: [
      {
        id: "srv-1",
        name: "Corte Clásico Tradicional",
        desc: "Corte a tijera y máquina con perfilado minucioso de patillas y cuello, toalla tibia y peinado con cera de abeja natural.",
        price: "4500",
        duration: 45,
        imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
        active: true,
      },
      {
        id: "srv-2",
        name: "Afeitado con Navaja & Toalla Caliente",
        desc: "Ritual clásico con tres toallas calientes al vapor de eucalipto, espuma montada a brocha de tejón y navaja recta esterilizada.",
        price: "3800",
        duration: 35,
        imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=80",
        active: true,
      },
      {
        id: "srv-3",
        name: "El Caballero Completo (Corte + Barba)",
        desc: "Servicio insignia de autor: corte integral, esculpido de barba, toalla caliente, aceite de cedro y masaje capilar.",
        price: "7200",
        duration: 60,
        imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop&q=80",
        active: true,
      },
      {
        id: "srv-4",
        name: "Esculpido & Perfilado de Barba",
        desc: "Definición de contornos a navaja, reducción de volumen y aplicación de bálsamo aromatizado con sándalo y clavo.",
        price: "3200",
        duration: 30,
        imageUrl: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=800&auto=format&fit=crop&q=80",
        active: true,
      },
    ],
    barberiaProducts: [
      {
        id: "prod-1",
        name: "Pomada Clásica Base Cera",
        description: "Fijación fuerte y brillo medio tradicional con aroma a tabaco dulce y vainilla.",
        price: "3400",
        imageUrl: "https://images.unsplash.com/photo-1598452963314-b09f397a5c48?w=800&auto=format&fit=crop&q=80",
        active: true,
      },
      {
        id: "prod-2",
        name: "Elixir Tónico para Barba",
        description: "Aceite puro de jojoba, argán y notas amaderadas de cedro. Suaviza e hidrata.",
        price: "4100",
        imageUrl: "https://images.unsplash.com/photo-1608248597359-bb6e42b8e3ad?w=800&auto=format&fit=crop&q=80",
        active: true,
      },
      {
        id: "prod-3",
        name: "Bálsamo Aftershave de Sándalo",
        description: "Calma la piel después del afeitado con extracto de hamamelis y aloe vera.",
        price: "3900",
        imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&auto=format&fit=crop&q=80",
        active: true,
      },
      {
        id: "prod-4",
        name: "Shampoo Botánico de Eucalipto",
        description: "Limpieza profunda y frescura estimulante para el cuero cabelludo.",
        price: "3600",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
        active: true,
      },
    ],
  },
};

const mockMedia = [
  { id: "m-1", type: "image", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80" },
  { id: "m-2", type: "image", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=80" },
  { id: "m-3", type: "image", url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop&q=80" },
  { id: "m-4", type: "image", url: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=800&auto=format&fit=crop&q=80" },
  { id: "m-5", type: "image", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80" },
  { id: "m-6", type: "image", url: "https://images.unsplash.com/photo-1593702295094-ada7554100c3?w=800&auto=format&fit=crop&q=80" },
];

const mockSections = [
  { id: "hero", visible: true },
  { id: "servicios", visible: true },
  { id: "productos", visible: true },
  { id: "galeria", visible: true },
  { id: "video", visible: true },
  { id: "booking", visible: true },
  { id: "contacto", visible: true },
];

export default function BarberiaLocalPreviewPage() {
  return (
    <BarberiaTemplate
      negocio={mockNegocio}
      media={mockMedia}
      businessId="demo"
      sections={mockSections}
    />
  );
}
