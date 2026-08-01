import re

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\MenuTemplate.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Line 406
content = content.replace(
    '{ label: "Productos", val: categories.reduce((s, c) => s + c.products.length, 0) },',
    '{ label: "Productos", val: categories.reduce((s, c) => s + (c.products?.length || 0), 0) },'
)

# 2. Line 487
content = content.replace(
    '<p className="text-xs text-gray-400">{cat.products.length} productos</p>',
    '<p className="text-xs text-gray-400">{cat.products?.length || 0} productos</p>'
)

# 3. Line 492
content = content.replace(
    '{cat.products.map((product) => (',
    '{(cat.products || []).map((product: any) => ('
)

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\MenuTemplate.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
