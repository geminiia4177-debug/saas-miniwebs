export type FlyerFontFamily =
  | "inter"
  | "bebas"
  | "anton"
  | "cinzel"
  | "playfair"
  | "orbitron"
  | "montserrat"
  | "russo";

export interface FontOption {
  id: FlyerFontFamily;
  name: string;
  category: string;
  description: string;
  sample: string;
}

export const FLYER_FONTS: FontOption[] = [
  { id: "inter", name: "Inter", category: "Moderno & Limpio", description: "Limpio, tecnológico y universal", sample: "MODERNO" },
  { id: "bebas", name: "Bebas Neue", category: "Impacto Comercial", description: "Alto, condensado y agresivo para ofertas", sample: "OFERTA" },
  { id: "anton", name: "Anton", category: "Extrema Fuerza", description: "Grueso, contundente y cartel urbano", sample: "IMPACTO" },
  { id: "cinzel", name: "Cinzel", category: "Épico / Prestigio", description: "Serif clásico para barberías, samuráis y lujo", sample: "PRESTIGIO" },
  { id: "playfair", name: "Playfair", category: "Lujo & Elegancia", description: "Editorial fino para salones, spas y moda", sample: "ELEGANCIA" },
  { id: "orbitron", name: "Orbitron", category: "Futurista / Cyber", description: "Geométrico sci-fi para anime, gaming y tech", sample: "CYBER" },
  { id: "montserrat", name: "Montserrat", category: "Geométrico Urbano", description: "Moderno, vanguardista y equilibrado", sample: "URBANO" },
  { id: "russo", name: "Russo One", category: "Bloque Deportivo", description: "Robusto para gimnasios, autos y potencia", sample: "POTENCIA" },
];
