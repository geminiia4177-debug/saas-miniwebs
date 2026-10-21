/**
 * CENTRALIZED URL RESOLVER FOR MINIWEBS SAAS
 * 
 * Guarantees a single source of truth for all public web URLs,
 * custom domains, QR codes, preview links and employee access URLs.
 */

export interface UrlOptions {
  path?: string;
  mesa?: number | string;
  token?: string;
  preview?: boolean;
}

export function getBaseAppDomain(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_DOMAIN) {
    return process.env.NEXT_PUBLIC_APP_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
  return "saas-miniwebs.vercel.app";
}

export function getPublicDomain(
  biz?: { subdomain?: string | null; customDomain?: string | null } | null
): string {
  if (!biz) return getBaseAppDomain();
  if (biz.customDomain && biz.customDomain.trim()) {
    return biz.customDomain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
  const sub = biz.subdomain?.toLowerCase().trim() || "demo";
  return `${sub}.${getBaseAppDomain()}`;
}

export function getPublicUrl(
  biz?: { id?: string | null; subdomain?: string | null; customDomain?: string | null } | null,
  options?: UrlOptions
): string {
  const domain = getPublicDomain(biz);
  const cleanPath = options?.path
    ? options.path.startsWith("/")
      ? options.path
      : `/${options.path}`
    : "";

  const params = new URLSearchParams();

  if (options?.mesa !== undefined && options?.mesa !== null && options?.mesa !== "") {
    params.set("mesa", String(options.mesa));
  }
  if (options?.token) {
    params.set("token", options.token);
  }
  if (options?.preview) {
    params.set("preview", "true");
  }

  const qs = params.toString() ? `?${params.toString()}` : "";
  return `https://${domain}${cleanPath}${qs}`;
}

export function sanitizeHttpUrl(input?: string | null, fallback = ""): string {
  if (typeof input !== "string") return fallback;
  const trimmed = input.trim();
  if (!trimmed) return fallback;

  // Relative path starting with / but not protocol-relative //
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  // Reject dangerous pseudo-protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed);
    if (["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    if (/^(https?|mailto|tel):/i.test(trimmed)) {
      return trimmed;
    }
  }

  return fallback;
}

export function sanitizeEmbedUrl(
  input?: string | null,
  allowedHosts: string[] = ["www.google.com", "maps.google.com", "open.spotify.com"]
): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  try {
    const parsed = new URL(input.trim());
    if (parsed.protocol !== "https:") return null;
    if (allowedHosts.includes(parsed.hostname)) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function isSafeExternalImageUrl(input?: string | null): boolean {
  if (typeof input !== "string" || !input.trim()) return false;
  try {
    const parsed = new URL(input.trim());
    if (parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();

    // Reject localhost and loopback/link-local/metadata
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "169.254.169.254"
    ) {
      return false;
    }

    // Reject private IP ranges
    if (
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return false;
    }

    // Validate hostname ends with allowed domains
    const allowedSuffixes = ["ibb.co", "unsplash.com", "pollinations.ai", "supabase.co"];
    const isAllowed = allowedSuffixes.some(
      (suffix) => host === suffix || host.endsWith("." + suffix)
    );

    return isAllowed;
  } catch {
    return false;
  }
}

export function sanitizeCssToken(input?: string | null, fallback = ""): string {
  return String(input || fallback).replace(/[<>{};"'`\\]/g, "").trim();
}

