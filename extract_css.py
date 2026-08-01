import re

with open('app/admin/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract CSS
css_match = re.search(r'const CSS = `\n(.*?)`;\n', content, re.DOTALL)
if css_match:
    css_content = css_match.group(1)
    with open('app/admin/admin.module.css', 'w', encoding='utf-8') as f:
        f.write(css_content)

    # Remove CSS block
    content = content.replace(css_match.group(0), "import styles from './admin.module.css';\n")
    
    # Remove <style dangerouslySetInnerHTML={{ __html: CSS }} />
    content = re.sub(r'<style dangerouslySetInnerHTML=\{\{ __html: CSS \}\} />\n?', '', content)

    # Write back
    with open('app/admin/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('CSS extracted successfully')
else:
    print('CSS not found')
