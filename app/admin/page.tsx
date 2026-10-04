"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { AdminBusiness } from "./components/adminTypes";
import { MetricsHeader } from "./components/MetricsHeader";
import { ClientTable } from "./components/ClientTable";
import { ClientDetailSheet } from "./components/ClientDetailSheet";
import { NewClientDrawer } from "./components/NewClientDrawer";
import AdminSupport from "./AdminSupport";
import AdminAlerts from "./AdminAlerts";
import {
  Users,
  Plus,
  RefreshCw,
  LogOut,
  Bell,
  Headphones,
  Check,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function AdminPage() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [totalBusinesses, setTotalBusinesses] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"clients" | "support" | "alerts">("clients");

  // Drawers and Modals
  const [selectedBusiness, setSelectedBusiness] = useState<AdminBusiness | null>(null);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/businesses?limit=100");
      if (res.ok) {
        const data = await res.json();
        const bizList = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.businesses)
          ? data.businesses
          : [];
        setBusinesses(bizList);
        setTotalBusinesses(data.total ?? bizList.length);
      }
    } catch {
      showToast("Error al cargar negocios", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleCreateBusiness = async (clientData: any) => {
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "No se pudo crear el negocio");
    }
    await fetchBusinesses();
  };

  const handleSaveBusiness = async (id: string, updatedData: any) => {
    const res = await fetch(`/api/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al actualizar");
    }
    await fetchBusinesses();
    setSelectedBusiness((prev) => (prev && prev.id === id ? { ...prev, ...updatedData } : prev));
  };

  const handleAddNote = async (id: string, text: string) => {
    const res = await fetch(`/api/businesses/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      throw new Error("No se pudo agregar la nota");
    }
    const updatedNotes = await res.json();
    setSelectedBusiness((prev) =>
      prev && prev.id === id ? { ...prev, notes: updatedNotes } : prev
    );
    await fetchBusinesses();
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white flex flex-col">
      {/* ── TOP ADMIN NAVBAR ── */}
      <header className="sticky top-0 z-40 bg-[#0B0F1A]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">Miniwebs Admin CRM</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Staff
              </span>
            </div>
            <p className="text-xs text-slate-400">Panel de Control & Clientes</p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveSection("clients")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSection === "clients" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clientes ({businesses.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("support")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSection === "support" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Soporte</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("alerts")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSection === "alerts" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alertas</span>
          </button>
        </div>

        {/* Actions: New Client & Logout */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNewClientOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Negocio</span>
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {activeSection === "clients" && (
          <div className="space-y-6">
            {/* Metrics Header */}
            <MetricsHeader
              businesses={businesses}
              totalBusinesses={totalBusinesses}
            />

            {/* Clients Table */}
            <ClientTable
              businesses={businesses}
              onSelectBusiness={setSelectedBusiness}
              onRefresh={fetchBusinesses}
            />
          </div>
        )}

        {activeSection === "support" && (
          <div className="p-6 rounded-3xl bg-[#0E131F] border border-white/5 shadow-xl">
            <AdminSupport showToast={(msg, type) => showToast(msg, type === "warn" ? "error" : "success")} />
          </div>
        )}

        {activeSection === "alerts" && (
          <div className="p-6 rounded-3xl bg-[#0E131F] border border-white/5 shadow-xl">
            <AdminAlerts showToast={(msg, type) => showToast(msg, type === "warn" ? "error" : "success")} />
          </div>
        )}
      </main>

      {/* ── DRAWERS ── */}
      <ClientDetailSheet
        business={selectedBusiness}
        isOpen={!!selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
        onSave={handleSaveBusiness}
        onAddNote={handleAddNote}
        showToast={showToast}
      />

      <NewClientDrawer
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onCreate={handleCreateBusiness}
        showToast={showToast}
      />

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl animate-slideUp text-xs font-bold ${
            toast.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300"
              : toast.type === "error"
              ? "bg-red-950/80 border-red-500/30 text-red-300"
              : "bg-indigo-950/80 border-indigo-500/30 text-indigo-300"
          }`}
        >
          {toast.type === "success" && <Check className="w-4 h-4 text-emerald-400" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}