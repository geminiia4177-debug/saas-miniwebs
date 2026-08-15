const fs = require('fs');

let content = fs.readFileSync('components/dashboard/cartuchos/ConfiguradorBarberia.tsx', 'utf8');

// Añadir estado
content = content.replace(
  'const [draggedIdx, setDraggedIdx] = useState<number | null>(null);',
  'const [draggedIdx, setDraggedIdx] = useState<number | null>(null);\n  const [dragEnabledIdx, setDragEnabledIdx] = useState<{list: string, idx: number} | null>(null);'
);

// Servicios
content = content.replace(
  '<div key={s.id} draggable onDragStart',
  '<div key={s.id} draggable={dragEnabledIdx?.list === "servicios" && dragEnabledIdx?.idx === idx} onDragStart'
);
content = content.replace(
  '<div className="flex items-center gap-1 text-[9px] text-slate-600"><Ico n="drag" s={10} /> Arrastrar</div>',
  '<div onMouseEnter={() => setDragEnabledIdx({list:"servicios", idx})} onMouseLeave={() => setDragEnabledIdx(null)} className="flex items-center gap-1 text-[9px] text-slate-600 cursor-grab"><Ico n="drag" s={10} /> Arrastrar</div>'
);

// Productos
content = content.replace(
  '<div key={p.id} draggable onDragStart',
  '<div key={p.id} draggable={dragEnabledIdx?.list === "productos" && dragEnabledIdx?.idx === idx} onDragStart'
);
content = content.replace(
  '<div className="flex items-center gap-1 text-[9px] text-slate-600"><Ico n="drag" s={10} /> Arrastrar</div>',
  '<div onMouseEnter={() => setDragEnabledIdx({list:"productos", idx})} onMouseLeave={() => setDragEnabledIdx(null)} className="flex items-center gap-1 text-[9px] text-slate-600 cursor-grab"><Ico n="drag" s={10} /> Arrastrar</div>'
);

// Reseñas
content = content.replace(
  '<div key={t.id} draggable onDragStart',
  '<div key={t.id} draggable={dragEnabledIdx?.list === "reseñas" && dragEnabledIdx?.idx === idx} onDragStart'
);
content = content.replace(
  '<div className="flex items-center gap-1 text-[9px] text-slate-600"><Ico n="drag" s={10} /> Arrastrar</div>',
  '<div onMouseEnter={() => setDragEnabledIdx({list:"reseñas", idx})} onMouseLeave={() => setDragEnabledIdx(null)} className="flex items-center gap-1 text-[9px] text-slate-600 cursor-grab"><Ico n="drag" s={10} /> Arrastrar</div>'
);

// FAQs
content = content.replace(
  '<div key={f.id} draggable onDragStart',
  '<div key={f.id} draggable={dragEnabledIdx?.list === "faqs" && dragEnabledIdx?.idx === idx} onDragStart'
);
content = content.replace(
  '<div className="flex items-center gap-1 text-[9px] text-slate-600"><Ico n="drag" s={10} /> Arrastrar</div>',
  '<div onMouseEnter={() => setDragEnabledIdx({list:"faqs", idx})} onMouseLeave={() => setDragEnabledIdx(null)} className="flex items-center gap-1 text-[9px] text-slate-600 cursor-grab"><Ico n="drag" s={10} /> Arrastrar</div>'
);

fs.writeFileSync('components/dashboard/cartuchos/ConfiguradorBarberia.tsx', content);
