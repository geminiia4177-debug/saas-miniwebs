import re

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\MenuTemplate.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add background and font logic
logic_hook = """  useEffect(() => {
    const params = new URLSearchParams(window.location.search);"""

new_logic = """  const primary = negocio?.primaryColor || "#0a0a0a";
  const secondary = negocio?.secondaryColor || "#1a1a1a";
  
  const getBackgroundStyle = () => {
    if (negocio?.backgroundType === "image" && negocio?.backgroundImageUrl) {
      return { backgroundImage: `url(${negocio.backgroundImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" as const };
    }
    if (negocio?.backgroundType === "gradient") {
      return { background: `linear-gradient(135deg, ${primary}, ${secondary})` };
    }
    return { backgroundColor: primary };
  };

  const fontStyle = {
    fontFamily: negocio?.fontFamily && negocio.fontFamily.includes("'")
      ? negocio.fontFamily
      : negocio?.fontFamily === "serif" ? "Georgia,serif" :
        negocio?.fontFamily === "mono" ? "monospace" :
        negocio?.fontFamily === "rounded" ? "'Nunito',system-ui,sans-serif" :
        "system-ui,sans-serif",
  };

  const heroAlign = negocio?.layoutConfig?.heroTitleAlign || "left";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);"""
content = content.replace(logic_hook, new_logic)

# 2. Update root div styles
root_hook = """  return (
    <div
      className="min-h-screen w-full flex justify-center bg-[#e8e8e4] font-['Lato',sans-serif]"
      style={{ "--accent": theme } as React.CSSProperties}
    >"""
new_root = """  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{ ...getBackgroundStyle(), ...fontStyle, "--accent": theme } as React.CSSProperties}
    >"""
content = content.replace(root_hook, new_root)

# 3. Update Hero styling
hero_hook = """            <div className="relative z-10 px-5 pt-10 pb-7 text-white">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-wider uppercase bg-white/15 backdrop-blur-md">
                📋 Menú Digital
              </span>

              <h1 className="text-3xl font-black leading-none tracking-tight font-['Sora',sans-serif]">
                {negocio.name}
              </h1>

              {negocio.tagline && (
                <p className="text-xs opacity-70 mt-1.5 font-light">{negocio.tagline}</p>
              )}"""

new_hero = """            <div className="relative z-10 px-5 pt-10 pb-7" style={{ textAlign: heroAlign as any }}>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-wider uppercase bg-white/15 backdrop-blur-md text-white">
                📋 Menú Digital
              </span>

              <h1 className="font-black leading-none tracking-tight font-['Sora',sans-serif]" style={{ 
                 color: negocio?.layoutConfig?.heroTitleColor || "#ffffff",
                 fontSize: `${(negocio?.layoutConfig?.fontSizeHero || 100) / 100 * 1.875}rem`
              }}>
                {negocio?.layoutConfig?.heroTitle || negocio.name}
              </h1>

              {negocio.tagline && (
                <p className="text-xs opacity-70 mt-1.5 font-light text-white/80">{negocio.tagline}</p>
              )}"""
content = content.replace(hero_hook, new_hero)

# 4. Make promos clickable
promo_hook = """                  <div key={idx} className="flex-shrink-0 w-64 rounded-2xl overflow-hidden relative shadow-[0_4px_12px_rgba(0,0,0,0.06)]" style={{ background: "white" }}>"""
new_promo = """                  <div key={idx} onClick={() => addToCart({ id: promo.id || `promo_${idx}`, name: promo.name, price: parseFloat(promo.price) || 0, emoji: "⭐", description: promo.description })} className="flex-shrink-0 w-64 rounded-2xl overflow-hidden relative shadow-[0_4px_12px_rgba(0,0,0,0.06)] cursor-pointer hover:scale-[1.02] transition-transform" style={{ background: "white" }}>"""
content = content.replace(promo_hook, new_promo)

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\MenuTemplate.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated MenuTemplate.tsx with dynamic styling and clickable promos")
