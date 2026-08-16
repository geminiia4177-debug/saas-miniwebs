import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Fraunces } from "next/font/google";
import PwaInstallPrompt from "@/components/ui/PwaInstallPrompt";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "SaaS MiniWebs — Crea tu página web con turnos",
  description: "La plataforma más fácil para crear una página web autogestionable para barberías, centros de estética y consultorios. Tus clientes sacan turno solos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MiniWebs",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#070b12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      {/* El atributo suppressHydrationWarning evita que las extensiones del navegador rompan la pantalla */}
      <body suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} font-sans min-h-full flex flex-col antialiased`}>
        {children}
        <PwaInstallPrompt />
        {/* Service Worker Registration */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('SW registered:', reg.scope); })
                    .catch(function(err) { console.log('SW registration failed:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}