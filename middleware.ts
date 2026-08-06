import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Si la ruta ya empieza con /api, /_next, etc., la ignoramos
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/_next") || url.pathname.startsWith("/_static")) {
    return NextResponse.next();
  }

  const hostname = req.headers.get("host") || "";

  // 1. Detectamos si es el dominio principal de la plataforma
  const isLocalBase = hostname === "localhost:3000";
  const isProdBase = hostname === "saas-miniwebs.com" || hostname === "www.saas-miniwebs.com" || hostname === "saas-miniwebs.vercel.app";
  // Vercel project domain suele tener 3 partes (ej: mi-proyecto.vercel.app)
  const isVercelBase = hostname.endsWith(".vercel.app") && hostname.split('.').length === 3;

  // Si estamos en la página principal o panel admin de la plataforma
  if (isLocalBase || isProdBase || isVercelBase) {
    // Si intenta acceder al dashboard, verificamos cambio de contraseña
    if (url.pathname.startsWith("/dashboard") && url.pathname !== "/dashboard/force-password-change") {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token?.forcePasswordChange) {
        return NextResponse.redirect(new URL("/dashboard/force-password-change", req.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Si es un subdominio de localhost (ej: juan.localhost:3000)
  if (hostname.endsWith(".localhost:3000")) {
    const subdomain = hostname.replace(".localhost:3000", "");
    return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));
  }

  // 3. Si es un subdominio de Vercel (ej: juan.mi-proyecto.vercel.app)
  if (hostname.endsWith(".vercel.app") && hostname.split('.').length > 3) {
    const subdomain = hostname.split('.')[0];
    return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));
  }

  // 4. Si es un dominio personalizado (ej: www.peluqueriajuan.com)
  // Reescribimos hacia /[subdomain] usando el hostname completo
  return NextResponse.rewrite(new URL(`/${hostname}${url.pathname}`, req.url));
}

// Esto evita que el proxy rompa imágenes o archivos del sistema
export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};
