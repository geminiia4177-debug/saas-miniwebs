import re

with open(r'c:\Users\jonat\saas-miniwebs\components\dashboard\EditorTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for selectedCategoryIdx
state_hook = """  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState<number | null>(null);"""
content = content.replace("  const [uploadingGallery, setUploadingGallery] = useState(false);", state_hook)

# 2. Add custom logic for menuCategorias
# we need to replace the generic renderItemEditor call or just intercept it.
# Line ~488: {!["galeria", "video", "config"].includes(activeTab) && renderItemEditor(currentListKey, currentList, activeTab.toUpperCase())}
# We will change it to handle activeTab === "menuCategorias" separately.

generic_render = """        {/* ── ITEMS GENERIC ── */}
        {!["galeria", "video", "config"].includes(activeTab) && renderItemEditor(currentListKey, currentList, activeTab.toUpperCase())}"""

custom_render = """        {/* ── ITEMS GENERIC ── */}
        {!["galeria", "video", "config", "menuCategorias"].includes(activeTab) && renderItemEditor(currentListKey, currentList, activeTab.toUpperCase())}

        {/* ── MENU CATEGORIAS (NESTED) ── */}
        {activeTab === "menuCategorias" && (
          <div className="space-y-4">
            {selectedCategoryIdx === null ? (
              // VISTA DE CATEGORIAS
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CATEGORÍAS DEL MENÚ</p>
                </div>
                {currentList.map((catItem: any, i: number) => (
                  <div key={i} className="rounded-xl overflow-hidden transition-all p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl overflow-hidden relative">
                        {catItem.imageUrl ? <img src={catItem.imageUrl} className="w-full h-full object-cover" /> : (catItem.emoji || "📁")}
                      </div>
                      <div className="flex-1">
                        <input value={catItem.name || ""} placeholder="Nombre Categoría" onChange={e => {
                          const newList = [...currentList];
                          newList[i] = { ...newList[i], name: e.target.value };
                          updateList("menuCategorias", newList);
                        }} className="w-full bg-transparent text-white font-bold outline-none" />
                        <p className="text-[10px] text-slate-400">{(catItem.products || []).length} productos</p>
                      </div>
                      <button onClick={() => removeItem("menuCategorias", i)} className="text-red-400/50 hover:text-red-400 p-2"><Ico n="trash" s={14}/></button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedCategoryIdx(i)} className="flex-1 bg-indigo-500/20 text-indigo-300 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-500/40 transition">Ver Productos</button>
                    </div>
                    {/* Background Image Upload for Category */}
                    <div className="mt-2 pt-2 border-t border-white/10">
                       <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Imagen de fondo (Opcional)</label>
                       <DropZone onFiles={async (files) => {
                          setUploadingIdx(i);
                          try {
                            const url = await uploadToImgBB(files[0]);
                            const newList = [...currentList];
                            newList[i] = { ...newList[i], imageUrl: url };
                            updateList("menuCategorias", newList);
                            showToast("Fondo de categoría actualizado");
                          } catch {}
                          setUploadingIdx(null);
                       }} multiple={false} compact>
                          {uploadingIdx === i ? <span className="text-xs text-indigo-400">Subiendo...</span> : <span className="text-[10px] text-slate-400">Subir imagen de fondo</span>}
                       </DropZone>
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  updateList("menuCategorias", [...currentList, { id: `cat_${Date.now()}`, name: "Nueva Categoría", emoji: "🍔", products: [] }]);
                }} className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors" style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>+ Agregar Categoría</button>
              </div>
            ) : (
              // VISTA DE PRODUCTOS DE LA CATEGORIA
              <div className="space-y-3">
                <button onClick={() => setSelectedCategoryIdx(null)} className="flex items-center gap-2 text-xs text-indigo-400 hover:text-white mb-2">
                  <Ico n="chevron-left" s={14} /> Volver a Categorías
                </button>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PRODUCTOS: {currentList[selectedCategoryIdx]?.name}</p>
                </div>
                {(currentList[selectedCategoryIdx]?.products || []).map((prod: any, pIdx: number) => (
                  <div key={pIdx} className="rounded-xl overflow-hidden transition-all p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="flex items-center gap-3">
                       {prod.imageUrl ? (
                         <div className="w-10 h-10 rounded-lg overflow-hidden relative"><img src={prod.imageUrl} className="w-full h-full object-cover" /></div>
                       ) : (
                         <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">{prod.emoji || "📦"}</div>
                       )}
                       <div className="flex-1">
                         <input value={prod.name || ""} placeholder="Nombre" onChange={e => {
                           const newList = [...currentList];
                           newList[selectedCategoryIdx].products[pIdx] = { ...prod, name: e.target.value };
                           updateList("menuCategorias", newList);
                         }} className="w-full bg-transparent text-white font-bold outline-none text-sm" />
                       </div>
                       <button onClick={() => {
                          const newList = [...currentList];
                          newList[selectedCategoryIdx].products = newList[selectedCategoryIdx].products.filter((_: any, i: number) => i !== pIdx);
                          updateList("menuCategorias", newList);
                       }} className="text-red-400/50 hover:text-red-400"><Ico n="trash" s={14}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div>
                         <label className="text-[9px] font-bold text-slate-500 uppercase block">Precio</label>
                         <input value={prod.price || ""} onChange={e => {
                           const newList = [...currentList];
                           newList[selectedCategoryIdx].products[pIdx] = { ...prod, price: e.target.value };
                           updateList("menuCategorias", newList);
                         }} className="w-full px-2 py-1 rounded-lg text-xs text-white bg-white/5 border border-white/10" placeholder="0" />
                       </div>
                       <div>
                         <label className="text-[9px] font-bold text-slate-500 uppercase block">Descripción</label>
                         <input value={prod.description || ""} onChange={e => {
                           const newList = [...currentList];
                           newList[selectedCategoryIdx].products[pIdx] = { ...prod, description: e.target.value };
                           updateList("menuCategorias", newList);
                         }} className="w-full px-2 py-1 rounded-lg text-xs text-white bg-white/5 border border-white/10" placeholder="Detalle..." />
                       </div>
                    </div>
                    <div>
                       <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Foto del producto</label>
                       <DropZone onFiles={async (files) => {
                          setUploadingIdx(pIdx + 1000); // offset to avoid conflict
                          try {
                            const url = await uploadToImgBB(files[0]);
                            const newList = [...currentList];
                            newList[selectedCategoryIdx].products[pIdx] = { ...prod, imageUrl: url };
                            updateList("menuCategorias", newList);
                          } catch {}
                          setUploadingIdx(null);
                       }} multiple={false} compact>
                          {uploadingIdx === (pIdx + 1000) ? <span className="text-[9px] text-indigo-400">Subiendo...</span> : <span className="text-[9px] text-slate-400">Subir foto</span>}
                       </DropZone>
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  const newList = [...currentList];
                  if (!newList[selectedCategoryIdx].products) newList[selectedCategoryIdx].products = [];
                  newList[selectedCategoryIdx].products.push({ id: `prod_${Date.now()}`, name: "Nuevo Producto", price: "0", description: "", imageUrl: "" });
                  updateList("menuCategorias", newList);
                }} className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors" style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>+ Agregar Producto</button>
              </div>
            )}
          </div>
        )}"""

content = content.replace(generic_render, custom_render)

with open(r'c:\Users\jonat\saas-miniwebs\components\dashboard\EditorTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated EditorTab.tsx for nested menuCategorias")
