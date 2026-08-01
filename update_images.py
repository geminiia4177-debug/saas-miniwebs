import os
import re

landings_dir = r"c:\Users\jonat\saas-miniwebs\components\landings"

for root, _, files in os.walk(landings_dir):
    for f in files:
        if f.endswith("Template.tsx"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
            
            if "<img" in content:
                # Add import if missing
                if 'import Image from "next/image"' not in content:
                    content = content.replace('import React', 'import React\nimport Image from "next/image";')
                    if 'import Image from "next/image"' not in content:
                         content = 'import Image from "next/image";\n' + content
                
                # Replace <img src={...} alt={...} className="... w-full h-full object-cover ..." />
                # We will just replace <img with <img
                # Actually, replacing with next/image can break layout if parents are not relative.
                # Let's not fully replace via regex as it might break UI.
                pass
