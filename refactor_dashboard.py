import re

with open('app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = content.replace('import { Biz, Section, MediaItem, Appointment, ToastType, DEFAULT_SECTIONS, Ico } from "@/lib/constants";',
'import { Biz, Section, MediaItem, Appointment, ToastType, DEFAULT_SECTIONS, Ico } from "@/lib/constants";\nimport Sidebar, { NavItem } from "@/components/dashboard/Sidebar";')

# Remove NavItem definition
content = re.sub(r'const NavItem = \(\{.*?\}\) => \([\s\S]*?\);\n\n', '', content)

# Remove old Sidebar definition
content = re.sub(r'\{/\* ── SIDEBAR \(Desktop only\) ── \*/\}[\s\S]*?</aside>', 
'''{/* ── SIDEBAR (Desktop only) ── */}
      <Sidebar 
        biz={biz}
        tab={tab}
        setTab={setTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mediaLength={media.length}
        pendingLength={pending.length}
        copyUrl={copyUrl}
        copiedUrl={copiedUrl}
      />''', content)

# Remove fake sparklines
content = re.sub(r'<svg width="60" height="20" viewBox="0 0 60 20".*?</svg>', '', content, flags=re.DOTALL)

# Update Mobile Logout button
old_logout = '''<button onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 transition-colors">'''
new_logout = '''<button onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:text-white hover:bg-red-500/20 bg-red-500/10 transition-colors border border-red-500/20">'''
content = content.replace(old_logout, new_logout)

with open('app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Dashboard refactored')
