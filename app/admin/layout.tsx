import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. El patovica pide el DNI al entrar a la ruta /admin
  const session = await getServerSession(authOptions);

  // 2. Si no hay sesión, lo patea a la pantalla de login
  if (!session) {
    redirect("/api/auth/signin");
  }

  // 3. Si pasó el control, le mostramos tu hermoso panel (children)
  return (
    <>
      {/* Agregamos una mini pastilla flotante abajo a la izquierda para que puedas cerrar sesión sin romper tu diseño */}
      <div className="fixed bottom-6 left-6 z-[9999] bg-[#1c2130]/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 text-white text-xs shadow-2xl">
        <span className="opacity-70">👤 {session.user?.name}</span>
        <a href="/api/auth/signout" className="text-red-400 hover:text-red-300 font-bold ml-2 transition-colors">
          Cerrar Sesión
        </a>
      </div>
      
      {/* Acá adentro carga intacto tu page.tsx */}
      {children}
    </>
  );
}