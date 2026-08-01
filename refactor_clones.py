import re

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\LavaderoTemplate.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make it light-themed
content = content.replace('min-h-screen text-[#F0EDE8]', 'min-h-screen text-slate-800 bg-slate-50')
content = content.replace('bg-black/60', 'bg-white/40')
content = content.replace('bg-black/70', 'bg-white/80')
content = content.replace('bg-black/80', 'bg-slate-900')
content = content.replace('text-white', 'text-slate-900')
content = content.replace('text-white/70', 'text-slate-600')
content = content.replace('text-white/50', 'text-slate-500')
content = content.replace('text-white/40', 'text-slate-400')
content = content.replace('border-white/10', 'border-slate-200')
content = content.replace('border-white/5', 'border-slate-100')
content = content.replace('bg-white/[0.03]', 'bg-white shadow-xl shadow-slate-200/50')
content = content.replace('bg-white/5', 'bg-slate-50')
content = content.replace('text-[var(--accent)]', 'text-[var(--accent)]')
content = content.replace('Playfair Display', 'Outfit')
content = content.replace('DM Sans', 'Plus Jakarta Sans')
content = content.replace('gold-line', 'blue-line')

# Fix Hero Title color override to black if it was white
content = content.replace('heroTitleColor || "#ffffff"', 'heroTitleColor || "#0f172a"')

# Fix Footer text color (it was bg-slate-900 now, so text should be white)
footer_start = content.find('<footer id="contacto"')
if footer_start != -1:
    content = content[:footer_start] + content[footer_start:].replace('text-slate-900', 'text-white')
    content = content[:footer_start] + content[footer_start:].replace('text-slate-600', 'text-slate-300')
    content = content[:footer_start] + content[footer_start:].replace('text-slate-500', 'text-slate-400')
    content = content[:footer_start] + content[footer_start:].replace('text-slate-400', 'text-slate-500')

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\LavaderoTemplate.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Refactor TallerTemplate
with open(r'c:\Users\jonat\saas-miniwebs\components\landings\TallerTemplate.tsx', 'r', encoding='utf-8') as f:
    content2 = f.read()

# Make it industrial dark
content2 = content2.replace('min-h-screen text-[#F0EDE8]', 'min-h-screen text-gray-200 bg-neutral-900')
content2 = content2.replace('bg-black/60', 'bg-black/80')
content2 = content2.replace('bg-black/70', 'bg-neutral-900/90')
content2 = content2.replace('bg-black/80', 'bg-neutral-950')
content2 = content2.replace('border-white/10', 'border-neutral-700')
content2 = content2.replace('bg-white/[0.03]', 'bg-neutral-800 border-l-4 border-[var(--accent)] rounded-none')
content2 = content2.replace('rounded-2xl', 'rounded-sm')
content2 = content2.replace('rounded-xl', 'rounded-sm')
content2 = content2.replace('Playfair Display', 'Teko')
content2 = content2.replace('DM Sans', 'Roboto')
content2 = content2.replace('gold-line', 'metal-line')
content2 = content2.replace('border border-white/5', 'border border-neutral-700')

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\TallerTemplate.tsx', 'w', encoding='utf-8') as f:
    f.write(content2)

# Refactor GeneralTemplate
with open(r'c:\Users\jonat\saas-miniwebs\components\landings\GeneralTemplate.tsx', 'r', encoding='utf-8') as f:
    content3 = f.read()

# Make it Bento box clean
content3 = content3.replace('min-h-screen text-[#F0EDE8]', 'min-h-screen text-gray-800 bg-gray-100')
content3 = content3.replace('bg-black/60', 'bg-white/60')
content3 = content3.replace('bg-black/70', 'bg-white/80')
content3 = content3.replace('bg-black/80', 'bg-white')
content3 = content3.replace('text-white', 'text-gray-900')
content3 = content3.replace('text-white/70', 'text-gray-700')
content3 = content3.replace('text-white/50', 'text-gray-600')
content3 = content3.replace('border-white/10', 'border-gray-200')
content3 = content3.replace('bg-white/[0.03]', 'bg-white shadow-sm border border-gray-200 rounded-3xl')
content3 = content3.replace('rounded-2xl', 'rounded-3xl')
content3 = content3.replace('rounded-xl', 'rounded-2xl')
content3 = content3.replace('Playfair Display', 'Inter')
content3 = content3.replace('DM Sans', 'Inter')
content3 = content3.replace('gold-line', 'clean-line')
content3 = content3.replace('heroTitleColor || "#ffffff"', 'heroTitleColor || "#111827"')

footer_start3 = content3.find('<footer id="contacto"')
if footer_start3 != -1:
    content3 = content3[:footer_start3] + content3[footer_start3:].replace('text-gray-900', 'text-gray-800')

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\GeneralTemplate.tsx', 'w', encoding='utf-8') as f:
    f.write(content3)
