import sys

with open(r'c:\Users\jonat\saas-miniwebs\components\dashboard\EditorTab.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.startswith('import BarberiaTemplate'):
        skip = True
    if line.startswith('import ConfiguradorTaller'):
        skip = False
        new_lines.append('import { ConfiguradorAvanzado } from "./editor/ConfiguradorAvanzado";\n')
        new_lines.append('import { LandingPreview } from "./editor/LandingPreview";\n')
    
    if line.startswith('// ─────────────────────────────────────────────────────────────') and (i+1 < len(lines) and lines[i+1].startswith('// CONFIGURADOR BARBERÍA')):
        skip = True
    
    if line.startswith('// ─────────────────────────────────────────────────────────────') and (i+1 < len(lines) and lines[i+1].startswith('// COMPONENTE PRINCIPAL: EDITOR TAB')):
        skip = False
        
    if not skip:
        new_lines.append(line)

with open(r'c:\Users\jonat\saas-miniwebs\components\dashboard\EditorTab.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Done')
