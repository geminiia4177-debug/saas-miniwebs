import { z } from "zod";

export const biolinksItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().catch("Enlace").default("Enlace"),
  url: z.string().catch("#").default("#"),
  icon: z.string().nullish().catch(""),
  thumbnail: z.string().nullish().catch(""),
  featured: z.boolean().catch(false).default(false),
  type: z.enum(["link", "spotify", "youtube"]).catch("link").default("link"),
  activeFrom: z.string().nullish().catch(null),
  activeUntil: z.string().nullish().catch(null),
  clicks: z.number().catch(0).default(0),
});

export const biolinksConfigSchema = z.object({
  active: z.boolean().catch(false).default(false),
  title: z.string().nullish().catch(""),
  subtitle: z.string().nullish().catch(""),
  coverUrl: z.string().nullish().catch(""),
  profileUrl: z.string().nullish().catch(""),
  textColorMode: z.enum(["auto", "light", "dark"]).catch("auto").default("auto"),
  fontFamily: z.string().catch("Inter").default("Inter"),
  socialPosition: z.enum(["top", "bottom"]).catch("top").default("top"),
  backgroundType: z.enum(["color", "dark", "image", "gradient", "light", "video"]).catch("dark").default("dark"),
  backgroundImageUrl: z.string().nullish().catch(""),
  buttonStyle: z.string().catch("rounded").default("rounded"),
  primaryColor: z.string().nullish().catch(""),
  secondaryColor: z.string().nullish().catch(""),
  titleColor: z.string().nullish().catch(""),
  showPoweredBy: z.boolean().catch(true).default(true),
  items: z.array(biolinksItemSchema).catch([]).default([]),
});

export function parseBiolinksConfig(config: any) {
  try {
    return biolinksConfigSchema.parse(config || {});
  } catch (error) {
    console.error("Biolinks Config Validation Error:", error);
    // Return safe defaults if pMXNing completely fails for some reason
    return biolinksConfigSchema.parse({});
  }
}
