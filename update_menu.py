import re

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\MenuTemplate.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Category interface
content = content.replace('products: Product[];', 'products: Product[];\n  imageUrl?: string;')

# 2. Update MenuTemplate parameters and state
content = re.sub(
    r'const categories: Category\[\] = menuConfig\.length > 0 \? menuConfig : DEMO_CATEGORIES;',
    'const categories: Category[] = menuConfig.length > 0 ? menuConfig : DEMO_CATEGORIES;\n  const menuPromos = negocio?.layoutConfig?.menuPromos || [];',
    content
)

content = re.sub(
    r'const \[bouncing, setBouncing\] = useState\(false\);',
    '''const [bouncing, setBouncing] = useState(false);
  const [orderType, setOrderType] = useState<"TAKEAWAY" | "DELIVERY" | "MESA">("TAKEAWAY");
  const [address, setAddress] = useState("");
  const [mesaNum, setMesaNum] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mesa")) {
      setMesaNum(params.get("mesa"));
      setOrderType("MESA");
    }
  }, []);''',
    content
)

# 3. Add Promociones below HERO
hero_end = r'{/\* ── STICKY CATEGORY NAV ─────────────────────────────── \*/}'
promos_html = '''{/* ── PROMOCIONES ────────────────────────────────────── */}
          {menuPromos && menuPromos.length > 0 && (
            <div className="px-4 py-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex gap-4">
              {menuPromos.filter((p: any) => p.active !== false).map((promo: any) => (
                <div key={promo.id} className="min-w-[200px] h-[120px] rounded-2xl overflow-hidden relative flex-shrink-0 shadow-md bg-white border border-[#efefef]">
                  {promo.imageUrl && <img src={promo.imageUrl} alt={promo.name} className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                    <h3 className="text-white font-bold text-sm leading-tight">{promo.name}</h3>
                    {promo.price && <p className="text-[var(--accent)] font-black text-xs mt-1">{fmt(Number(promo.price))}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          '''
content = content.replace(hero_end, promos_html + hero_end)

# 4. Update Category buttons
cat_button_old = '''className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                      active
                        ? "bg-[var(--accent)] text-white shadow-[0_3px_10px_color-mix(in_srgb,var(--accent)_31%,transparent)] scale-105"
                        : "bg-white text-[#666] shadow-[0_1px_3px_rgba(0,0,0,0.08)] scale-100"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>'''

cat_button_new = '''className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap overflow-hidden relative ${
                      active
                        ? "text-white shadow-[0_3px_10px_color-mix(in_srgb,var(--accent)_31%,transparent)] scale-105"
                        : "text-[#666] shadow-[0_1px_3px_rgba(0,0,0,0.08)] scale-100"
                    }`}
                  >
                    {cat.imageUrl && (
                      <div className="absolute inset-0 z-0">
                        <img src={cat.imageUrl} alt="" className="w-full h-full object-cover opacity-30" />
                        <div className={`absolute inset-0 ${active ? "bg-[var(--accent)]/80" : "bg-white/80"}`} />
                      </div>
                    )}
                    <div className={`absolute inset-0 z-0 ${active ? "bg-[var(--accent)]" : "bg-white"} ${cat.imageUrl ? "opacity-0" : "opacity-100"}`} />
                    <span className="relative z-10">{cat.emoji}</span>
                    <span className="relative z-10">{cat.name}</span>
                  </button>'''
content = content.replace(cat_button_old, cat_button_new)

# 5. Modify CartDrawer signature and call
content = content.replace(
    'onClose: () => void; containerRef: React.RefObject<HTMLDivElement | null>;',
    'onClose: () => void; containerRef: React.RefObject<HTMLDivElement | null>;\n  orderType: string; setOrderType: (t: any) => void; address: string; setAddress: (a: string) => void; mesaNum: string | null;'
)

content = content.replace(
    'containerRef={containerRef}',
    'containerRef={containerRef} orderType={orderType} setOrderType={setOrderType} address={address} setAddress={setAddress} mesaNum={mesaNum}'
)

# 6. Update CartDrawer component parameters
content = re.sub(
    r'onClose, containerRef,\s*}\:\s*{',
    'onClose, containerRef, orderType, setOrderType, address, setAddress, mesaNum,\n}: {',
    content
)

# 7. Add Cart forms (Address, Order Type)
cart_footer_old = r'<div className="px-5 pt-3 pb-6 border-t border-gray-100">'
cart_footer_new = '''
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tipo de Pedido</label>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setOrderType("TAKEAWAY")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${orderType === "TAKEAWAY" ? "bg-[var(--accent)] text-white" : "bg-white border text-gray-500"}`}>Retiro</button>
              <button onClick={() => setOrderType("DELIVERY")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${orderType === "DELIVERY" ? "bg-[var(--accent)] text-white" : "bg-white border text-gray-500"}`}>Envío</button>
              {mesaNum && <button onClick={() => setOrderType("MESA")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${orderType === "MESA" ? "bg-[var(--accent)] text-white" : "bg-white border text-gray-500"}`}>Mesa {mesaNum}</button>}
            </div>
            {orderType === "DELIVERY" && (
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección de envío..." className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-[var(--accent)]" />
            )}
          </div>
          <div className="px-5 pt-3 pb-6 border-t border-gray-100">'''
content = content.replace(cart_footer_old, cart_footer_new)

# 8. Update buildWhatsAppMessage
msg_func_old = r'function buildWhatsAppMessage\(cart: CartItem\[\], business: Business\): string \{'
msg_func_new = r'''function buildWhatsAppMessage(cart: CartItem[], business: Business, orderType: string, address: string, mesaNum: string | null): string {'''
content = re.sub(msg_func_old, msg_func_new, content)

msg_body_old = r'const msg = \['
msg_body_new = r'''const orderTypeTxt = orderType === "DELIVERY" ? "🛵 Envío a domicilio" : orderType === "MESA" ? `🍽️ Para Mesa ${mesaNum}` : "🛍️ Retiro en local";
  const addressTxt = orderType === "DELIVERY" ? `\n📍 Dirección: ${address}` : "";
  const msg = ['''
content = content.replace(msg_body_old, msg_body_new)

msg_lines_old = r'`🍽️ \*Pedido en \$\{business\.name\}\*`,'
msg_lines_new = r'`🍽️ *Pedido en ${business.name}*`,"",`Tipo: ${orderTypeTxt}` + addressTxt,'
content = re.sub(msg_lines_old, msg_lines_new, content)

# 9. Modify WhatsApp button onClick (instead of href directly)
whatsapp_a_old = r'<a\s+href=\{buildWhatsAppMessage\(cart, business\)\}\s+target="_blank"\s+rel="noopener noreferrer"\s+className="flex items-center justify-center gap-2 w-full py-3\.5 rounded-2xl font-bold text-white text-sm transition-transform active:scale-95 bg-gradient-to-br from-\[#25D366\] to-\[#128C7E\] shadow-\[0_4px_16px_rgba\(37,211,102,0\.4\)\]"\s+>'
whatsapp_a_new = r'''<button
              onClick={async () => {
                const isClient = typeof window !== 'undefined';
                if (!isClient) return;
                try {
                  const items = cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
                  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
                  const res = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      businessId: (business as any).id,
                      tableId: orderType === "MESA" ? mesaNum : null,
                      type: orderType,
                      items,
                      total,
                      address: orderType === "DELIVERY" ? address : null
                    })
                  });
                } catch(e) { console.error(e) }
                window.open(buildWhatsAppMessage(cart, business, orderType, address, mesaNum), "_blank");
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-transform active:scale-95 bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-[0_4px_16px_rgba(37,211,102,0.4)]"
            >'''
content = re.sub(whatsapp_a_old, whatsapp_a_new, content)

# Close the button tag
content = content.replace('Enviar pedido por WhatsApp\n            </a>', 'Enviar pedido por WhatsApp\n            </button>')

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\MenuTemplate.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
