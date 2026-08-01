import re

with open('app/admin/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_classnames(match):
    classes = match.group(1).split()
    if not classes:
        return 'className=""'
    
    style_refs = []
    for c in classes:
        if '-' in c:
            style_refs.append(f"styles['{c}']")
        else:
            style_refs.append(f"styles.{c}")
            
    if len(style_refs) == 1:
        return f"className={{{style_refs[0]}}}"
    else:
        inner = " ".join([f"${{{s}}}" for s in style_refs])
        return f"className={{`{inner}`}}"

# Match className="something"
content = re.sub(r'className="([^"]*)"', replace_classnames, content)

with open('app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Classnames refactored')
