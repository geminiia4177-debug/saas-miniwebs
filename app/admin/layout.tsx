import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user?.forcePasswordChange) {
    redirect("/dashboard/force-password-change");
  }

  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <div className="min-h-screen bg-[#07090E]">{children}</div>;
}