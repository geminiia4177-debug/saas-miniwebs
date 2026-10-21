import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Si la ruta ya empieza con /api, /_next, etc., la ignoramos
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/_next") || url.pathname.startsWith("/_static")) {
    return NextResponse.next();
  }

  // 1. Proteger /dashboard y /admin si se exige cambio de contraseña
  if (
    (url.pathname.startsWith("/dashboard") && url.pathname !== "/dashboard/force-password-change") ||
    (url.pathname.startsWith("/admin") && url.pathname !== "/dashboard/force-password-change")
  ) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.forcePasswordChange) {
      return NextResponse.redirect(new URL("/dashboard/force-password-change", req.url));
    }
  }

  const hostname = req.headers.get("host") || "";
  const hostNoPort = hostname.split(":")[0];

  const rootDomains = [
    "localhost",
    "saas-miniwebs.com",
    "saas-miniwebs.vercel.app",
    process.env.NEXT_PUBLIC_APP_DOMAIN,
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(":")[0],
  ].filter(Boolean) as string[];

  // 2. Si es dominio raíz exacto o con www
  const isExactRoot = rootDomains.some(
    (rd) => hostNoPort === rd || hostNoPort === `www.${rd}`
  );
  if (isExactRoot) {
    return NextResponse.next();
  }

  // 3. Si termina en .${rootDomain} (ej: barberia.saas-miniwebs.com o barberia.localhost)
  for (const rd of rootDomains) {
    if (hostNoPort.endsWith(`.${rd}`)) {
      const subdomain = hostNoPort.slice(0, -(rd.length + 1));
      if (subdomain && subdomain !== "www") {
        return NextResponse.rewrite(
          new URL(`/${subdomain}${url.pathname}${url.search}`, req.url)
        );
      }
    }
  }

  // 4. Si es subdominio de Vercel con más de 3 segmentos (ej: barberia.mi-proyecto.vercel.app)
  if (hostNoPort.endsWith(".vercel.app") && hostNoPort.split(".").length > 3) {
    const subdomain = hostNoPort.split(".")[0];
    return NextResponse.rewrite(
      new URL(`/${subdomain}${url.pathname}${url.search}`, req.url)
    );
  }

  // 5. Dominio personalizado real (ej: www.mipeluqueria.com)
  return NextResponse.rewrite(
    new URL(`/${hostNoPort}${url.pathname}${url.search}`, req.url)
  );
}

// Esto evita que el proxy rompa imágenes o archivos del sistema
export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};
