import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  if (session.user?.forcePasswordChange) {
    redirect("/change-password");
  }

  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <div className="min-h-screen bg-[#07090E]">{children}</div>;
}