"use client";

import React, { useState, useEffect } from "react";
import { Ico } from "@/lib/constants";

type Sale = { id: string; type: string; amount: number; itemName: string; date: string; employeeId?: string | null; };
type Employee = { 
  id: string; 
  name: string; 
  role: string;
  salaryType: string;
  salaryValue: number;
  servicesDone: number;
  hoursWorked: number;
  imageUrl: string;
  bio: string;
  isPublic: boolean;
};
type Supplier = { id: string; name: string; phone: string; products: string; };

const getCrmLabels = (type: string) => {
  switch (type) {
    case "cancha":
      return {
        salesTitle1: "Alquileres Canchas",
        salesTitle2: "Bebidas / Productos",
        salesType1: "Alquiler / Turno",
        salesType2: "Producto",
        employeesTab: "Staff / Árbitros",
        addEmployee: "Agregar Staff / Árbitro"
      };
    case "clinica":
      return {
        salesTitle1: "Consultas Médicas",
        salesTitle2: "Insumos / Extras",
        salesType1: "Consulta / Tratamiento",
        salesType2: "Producto / Insumo",
        employeesTab: "Médicos / Profesionales",
        addEmployee: "Agregar Médico / Profesional"
      };
    case "gimnasio":
      return {
        salesTitle1: "Cuotas y Clases",
        salesTitle2: "Productos / Suplementos",
        salesType1: "Membresía / Pase",
        salesType2: "Producto",
        employeesTab: "Coaches / Profesores",
        addEmployee: "Agregar Profesor"
      };
    case "menu":
    case "restaurante":
      return {
        salesTitle1: "Mesas / Platos",
        salesTitle2: "Bebidas / Extras",
        salesType1: "Menú / Plato",
        salesType2: "Bebida",
        employeesTab: "Mozos / Staff",
        addEmployee: "Agregar Mozo / Staff"
      };
    default:
      return {
        salesTitle1: "Ventas Servicios",
        salesTitle2: "Ventas Productos",
        salesType1: "Servicio / Corte",
        salesType2: "Producto",
        employeesTab: "Empleados",
        addEmployee: "Agregar Empleado"
      };
  }
};

export default function CrmTab({ biz, setBiz, saveAll, showToast }: { biz: any; setBiz?: any; saveAll?: any; showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [activeSubTab, setActiveSubTab] = useState<"sales" | "employees" | "suppliers">("sales");
  const [data, setData] = useState<{ sales: Sale[], employees: Employee[], suppliers: Supplier[] }>({ sales: [], employees: [], suppliers: [] });
  const [loading, setLoading] = useState(true);

  const [newSale, setNewSale] = useState({ amount: "", description: "", saleType: "SERVICE", employeeId: "" });
  const [newEmployee, setNewEmployee] = useState({ name: "", role: "", salaryType: "FIXED", salaryValue: 0, isPublic: true, imageUrl: "", bio: "" });
  const [newSupplier, setNewSupplier] = useState({ name: "", phone: "", products: "" });
  
  const [supplierOrders, setSupplierOrders] = useState<Record<string, string>>({});

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, empRes, supRes] = await Promise.all([
        fetch(`/api/crm?businessId=${biz.id}&type=sales`),
        fetch(`/api/crm?businessId=${biz.id}&type=employees`),
        fetch(`/api/crm?businessId=${biz.id}&type=suppliers`),
      ]);
      const sales = await salesRes.json();
      const employees = await empRes.json();
      const suppliers = await supRes.json();
      setData({ sales: sales || [], employees: employees || [], suppliers: suppliers || [] });
    } catch (err) {
      console.error(err);
      showToast("Error al cargar datos del CRM", "error");
    }
    setLoading(false);
  }, [biz.id, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addRecord = async (type: "sales" | "employees" | "suppliers", payload: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, type, ...payload }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const newItem = await res.json();
      setData(prev => ({ ...prev, [type]: [newItem, ...prev[type]] }));
      showToast("Registro guardado ✓");
      return true;
    } catch (err) {
      showToast("Error al guardar", "error");
      return false;
    }
  };

  const deleteRecord = async (type: "sales" | "employees" | "suppliers", id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return false;
    try {
      const res = await fetch(`/api/crm/${id}?type=${type}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setData(prev => ({ ...prev, [type]: prev[type].filter((item: { id: string }) => item.id !== id) }));
      showToast("Registro eliminado ✓");
      return true;
    } catch (err) {
      showToast("Error al eliminar", "error");
      return false;
    }
  };

  // Funciones específicas
  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSale.amount) return;
    const ok = await addRecord("sales", { ...newSale, amount: parseFloat(newSale.amount) });
    if (ok) setNewSale({ amount: "", description: "", saleType: "SERVICE", employeeId: "" });
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name) return;
    const ok = await addRecord("employees", newEmployee);
    if (ok) setNewEmployee({ name: "", role: "", salaryType: "FIXED", salaryValue: 0, isPublic: true, imageUrl: "", bio: "" });
  };

  const updateEmployee = async (id: string, payload: any) => {
    try {
      const res = await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "employees", id, ...payload }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData(prev => ({
          ...prev,
          employees: prev.employees.map((e: any) => e.id === id ? updated : e)
        }));
        showToast("Empleado actualizado ✓");
      }
    } catch (e) {}
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.phone) return;
    const ok = await addRecord("suppliers", newSupplier);
    if (ok) setNewSupplier({ name: "", phone: "", products: "" });
  };

  const handleDeleteSupplier = async (id: string) => {
    const ok = await deleteRecord("suppliers", id);
    if (ok) setSupplierOrders(prev => { const n = {...prev}; delete n[id]; return n; });
  };

  // Cálculos
  const safeSales = Array.isArray(data.sales) ? data.sales : [];
  const visibleSales = safeSales.filter(s => s.type === "SERVICE" || s.type === "PRODUCT");
  const labels = getCrmLabels(biz?.type || "barberia");

  const totalSales = data.sales.filter(s => s.type === "SERVICE").reduce((acc, curr) => acc + curr.amount, 0);
  const totalProducts = visibleSales.filter(s => s.type === "PRODUCT").reduce((acc, s) => acc + s.amount, 0);
  const totalRevenue = totalSales + totalProducts;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Ico n="loader" s={24} c="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fadeIn max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">CRM y Finanzas</h1>
        <p className="text-slate-500 text-sm">Gestiona tus ventas, empleados y proveedores.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{labels.salesTitle1}</p>
          <p className="text-2xl font-black text-white">${totalSales.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{labels.salesTitle2}</p>
          <p className="text-2xl font-black text-white">${totalProducts.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.1))", border: "1px solid rgba(99,102,241,0.2)" }}>
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mb-1">Ingreso Total Mensual</p>
          <p className="text-2xl font-black text-indigo-400">${totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="mb-8 p-5 rounded-2xl border" style={{ background: "linear-gradient(135deg,#131929,#111825)", borderColor: "rgba(255,255,255,0.05)" }}>
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Evolución de Ingresos (Últimos 6 Meses)</h3>
        {(() => {
          const monthData: Record<string, number> = {};
          const d = new Date();
          for (let i = 5; i >= 0; i--) {
            const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
            const label = past.toLocaleDateString("es-MX", { month: "short" });
            monthData[label] = 0;
          }
          visibleSales.forEach(s => {
            const l = new Date(s.date).toLocaleDateString("es-MX", { month: "short" });
            if (monthData[l] !== undefined) monthData[l] += s.amount;
          });
          const chartData = Object.entries(monthData).map(([month, amount]) => ({ month, amount }));
          const maxAmount = Math.max(...chartData.map(d => d.amount), 1);

          return (
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end", height: 120 }}>
              {chartData.map((d: any, i: number) => {
                const h = (d.amount / maxAmount) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: "100%", height: 90, background: "rgba(255,255,255,0.05)", borderRadius: 4, position: "relative" }}>
                      <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: `${Math.max(h, 4)}%`, background: "var(--accent, #6366f1)", borderRadius: 4, transition: "height 0.3s" }}></div>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--t2, #94a3b8)" }}>{d.month}</span>
                    <span style={{ fontSize: 10, color: "var(--t1, #ffffff)", fontWeight: "bold" }}>${d.amount.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
        {[
          { id: "sales" as const, label: "Ingresos", icon: "zap" },
          { id: "employees" as const, label: labels.employeesTab, icon: "user" },
          { id: "suppliers" as const, label: "Proveedores", icon: "truck" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeSubTab === t.id ? "bg-white/10 text-white" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}
          >
            {/* fallback icon if user/truck are not in Ico constants */}
            <Ico n={t.icon === "user" ? "info" : t.icon === "truck" ? "list" : "zap"} s={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Form */}
        <div className="lg:col-span-1">
          {activeSubTab === "sales" && (
            <form onSubmit={handleAddSale} className="rounded-2xl p-5 space-y-4" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 className="font-bold text-white mb-2">Registrar Ingreso</h3>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Tipo</label>
                <select value={newSale.saleType} onChange={e => setNewSale({...newSale, saleType: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500">
                  <option value="SERVICE" className="bg-[#131929]">{labels.salesType1}</option>
                  <option value="PRODUCT" className="bg-[#131929]">{labels.salesType2}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Monto ($)</label>
                <input type="number" required value={newSale.amount} onChange={e => setNewSale({...newSale, amount: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="Ej: 2500" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Descripción</label>
                <input type="text" value={newSale.description} onChange={e => setNewSale({...newSale, description: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="Ej: Corte clásico Juan" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Empleado / Barbero (Opcional)</label>
                <select value={newSale.employeeId} onChange={e => setNewSale({...newSale, employeeId: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500">
                  <option value="" className="bg-[#131929]">Sin especificar</option>
                  {(Array.isArray(data.employees) ? data.employees : []).map(emp => (
                    <option key={emp.id} value={emp.id} className="bg-[#131929]">{emp.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white transition-colors">Guardar Ingreso</button>
            </form>
          )}

          {activeSubTab === "employees" && (
            <form onSubmit={handleAddEmployee} className="rounded-2xl p-5 space-y-4" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 className="font-bold text-white mb-2">{labels.addEmployee}</h3>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Nombre</label>
                <input type="text" required value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="Ej: Carlos" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Rol / Puesto</label>
                <input type="text" value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="Ej: Especialista" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Modalidad Pago</label>
                  <select value={newEmployee.salaryType} onChange={e => setNewEmployee({...newEmployee, salaryType: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500">
                    <option value="FIXED">Fijo Mensual</option>
                    <option value="PERCENTAGE">% Comisión</option>
                    <option value="HOURLY">Por Hora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Valor</label>
                  <input type="number" required value={newEmployee.salaryValue} onChange={e => setNewEmployee({...newEmployee, salaryValue: Number(e.target.value)})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">¿Mostrar en Web Pública?</label>
                <select value={newEmployee.isPublic ? "SI" : "NO"} onChange={e => setNewEmployee({...newEmployee, isPublic: e.target.value === "SI"})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500">
                  <option value="SI">Sí, mostrar en "Nuestro Staff"</option>
                  <option value="NO">No, es solo interno</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-sm bg-indigo-500 hover:bg-indigo-600 text-white transition-colors">Guardar Empleado</button>
            </form>
          )}

          {activeSubTab === "suppliers" && (
            <form onSubmit={handleAddSupplier} className="rounded-2xl p-5 space-y-4" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 className="font-bold text-white mb-2">Agregar Proveedor</h3>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Nombre</label>
                <input type="text" required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="Ej: Distribuidora Norte" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Teléfono / WhatsApp</label>
                <input type="text" required value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="Ej: 1154321234" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">¿Qué vende?</label>
                <textarea rows={2} required value={newSupplier.products} onChange={e => setNewSupplier({...newSupplier, products: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" placeholder="Ej: Pomadas, navajas..." />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white transition-colors">Guardar Proveedor</button>
            </form>
          )}
        </div>

        {/* Right Col: List */}
        <div className="lg:col-span-2 space-y-3">
          
          {activeSubTab === "sales" && visibleSales.map((sale: Sale) => (
            <div key={sale.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${sale.type === "SERVICE" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/10" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10"}`}>
                  <Ico n={sale.type === "SERVICE" ? "zap" : "list"} s={16} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{sale.itemName || (sale.type === "SERVICE" ? "Servicio" : "Producto")}</p>
                  <p className="text-[10px] text-slate-500">{new Date(sale.date).toLocaleDateString("es-MX")} {new Date(sale.date).toLocaleTimeString("es-MX", {hour: "2-digit", minute: "2-digit"})}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-white text-lg">${sale.amount}</span>
                <button onClick={() => deleteRecord("sales", sale.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                  <Ico n="trash" s={14} />
                </button>
              </div>
            </div>
          ))}

          {activeSubTab === "employees" && (Array.isArray(data.employees) ? data.employees : []).map((emp: Employee) => {
            const empSales = visibleSales.filter(s => s.employeeId === emp.id);
            const totalEmpRevenue = empSales.reduce((acc, s) => acc + s.amount, 0);
            const totalCuts = empSales.filter(s => s.type === "SERVICE").length;

            let commission = 0;
            if (emp.salaryType === "PERCENTAGE") {
              commission = totalEmpRevenue * (emp.salaryValue / 100);
            } else if (emp.salaryType === "HOURLY") {
              commission = emp.hoursWorked * emp.salaryValue;
            } else if (emp.salaryType === "FIXED") {
              commission = emp.salaryValue;
            }

            return (
              <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 gap-4 transition-all hover:bg-white/10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg overflow-hidden">
                      {emp.imageUrl ? <img src={emp.imageUrl} alt={emp.name} className="w-full h-full object-cover" /> : emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-lg">{emp.name} {!emp.isPublic && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-sm ml-2">Privado</span>}</p>
                      <p className="text-xs text-slate-400 font-medium">{emp.role || "Barbero"}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mt-4">
                    <div className="flex flex-col bg-[#131929] px-4 py-2 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Cortes Asignados</span>
                      <span className="text-sm font-black text-indigo-400">{totalCuts}</span>
                    </div>
                    {emp.salaryType === "PERCENTAGE" && (
                      <div className="flex flex-col bg-[#131929] px-4 py-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Generado</span>
                        <span className="text-sm font-black text-emerald-400">${totalEmpRevenue.toLocaleString()}</span>
                      </div>
                    )}
                    {emp.salaryType === "HOURLY" && (
                      <div className="flex flex-col bg-[#131929] px-4 py-2 rounded-xl border border-white/5 flex-row items-center gap-2">
                        <div>
                          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Horas Trab.</span>
                          <span className="text-sm font-black text-indigo-400">{emp.hoursWorked}</span>
                        </div>
                        <button onClick={() => updateEmployee(emp.id, { addHoursWorked: 1 })} className="bg-white/10 hover:bg-white/20 text-white rounded-md w-6 h-6 flex items-center justify-center">+</button>
                      </div>
                    )}
                    <div className="flex flex-col bg-[#131929] px-4 py-2 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <span className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-wider mb-0.5">A Pagar</span>
                      <span className="text-sm font-black text-emerald-400">${commission.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Acuerdo Salarial:</span>
                    <select 
                      value={emp.salaryType} 
                      onChange={e => updateEmployee(emp.id, { salaryType: e.target.value })}
                      className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                    >
                      <option value="PERCENTAGE" className="bg-[#131929]">% de Ganancias</option>
                      <option value="FIXED" className="bg-[#131929]">$ Fijo Mensual</option>
                      <option value="HOURLY" className="bg-[#131929]">$ Por Hora</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={emp.salaryValue} 
                        onChange={e => updateEmployee(emp.id, { salaryValue: parseFloat(e.target.value) || 0 })}
                        className="w-20 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white text-center focus:outline-none"
                      />
                      <span className="text-xs text-slate-500">{emp.salaryType === "PERCENTAGE" ? "%" : "$"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2">
                  <button onClick={() => deleteRecord("employees", emp.id)} className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Eliminar Barbero">
                    <Ico n="trash" s={18} />
                  </button>
                </div>
              </div>
            );
          })}

          {activeSubTab === "suppliers" && (Array.isArray(data.suppliers) ? data.suppliers : []).map((sup: Supplier) => (
            <div key={sup.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 gap-4">
              <div className="w-full">
                <p className="font-bold text-white text-lg">{sup.name}</p>
                <p className="text-xs text-slate-400 mt-1 mb-3 leading-relaxed">{sup.products}</p>
                
                <div className="mb-3">
                  <textarea 
                    rows={2} 
                    placeholder="Escribí aquí tu pedido (ej: 3 pomadas, 2 navajas...)"
                    value={supplierOrders[sup.id] || ""}
                    onChange={e => setSupplierOrders(prev => ({ ...prev, [sup.id]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <a href={`tel:${sup.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors">
                    <Ico n="phone" s={12} /> Llamar
                  </a>
                  <a href={`https://wa.me/${sup.phone.replace(/\D/g,'')}?text=${encodeURIComponent("Hola! Te escribo para hacerte un pedido:\n\n" + (supplierOrders[sup.id] || ""))}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-bold text-emerald-400 transition-colors">
                    Pedir por WhatsApp
                  </a>
                </div>
              </div>
              <div className="sm:self-start">
                <button onClick={() => deleteRecord("suppliers", sup.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                  <Ico n="trash" s={14} />
                </button>
              </div>
            </div>
          ))}

          {(Array.isArray(data[activeSubTab]) ? data[activeSubTab] : []).length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-500 text-sm">No hay registros aún.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
