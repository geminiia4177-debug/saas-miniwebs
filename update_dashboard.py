import re

with open(r'c:\Users\jonat\saas-miniwebs\app\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
content = content.replace(
    'import CrmTab from "@/components/dashboard/CrmTab";',
    'import CrmTab from "@/components/dashboard/CrmTab";\nimport OrdersTablesTab from "@/components/dashboard/OrdersTablesTab";'
)

# 2. Add to mobile nav
mob_nav_old = r'<NavItem icon="list" label="CRM y Finanzas" tab="crm" active={tab} setActive={(t) => { setTab(t); setMobileMenuOpen(false); }} />'
mob_nav_new = r'''{(biz.type === "menu" || biz.type === "restaurante") && (
                <NavItem icon="box" label="Pedidos / Mesas" tab="orders" active={tab} setActive={(t) => { setTab(t); setMobileMenuOpen(false); }} />
              )}
              <NavItem icon="list" label="CRM y Finanzas" tab="crm" active={tab} setActive={(t) => { setTab(t); setMobileMenuOpen(false); }} />'''
content = content.replace(mob_nav_old, mob_nav_new)

# 3. Add to desktop nav
desk_nav_old = r'<NavItem icon="list" label="CRM y Finanzas" tab="crm" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />'
desk_nav_new = r'''{(biz.type === "menu" || biz.type === "restaurante") && (
            <NavItem icon="box" label="Pedidos / Mesas" tab="orders" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />
          )}
          <NavItem icon="list" label="CRM y Finanzas" tab="crm" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />'''
content = content.replace(desk_nav_old, desk_nav_new)

# 4. Add the component render
render_old = r'{tab === "crm" && <CrmTab biz={biz} setBiz={setBiz} saveAll={() => {}} showToast={showToast} />}'
render_new = r'''{tab === "crm" && <CrmTab biz={biz} setBiz={setBiz} saveAll={() => {}} showToast={showToast} />}
        
        {/* ── PEDIDOS Y MESAS ── */}
        {tab === "orders" && (biz.type === "menu" || biz.type === "restaurante") && (
          <OrdersTablesTab biz={biz} showToast={showToast} />
        )}'''
content = content.replace(render_old, render_new)

with open(r'c:\Users\jonat\saas-miniwebs\app\dashboard\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
