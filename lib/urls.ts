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
