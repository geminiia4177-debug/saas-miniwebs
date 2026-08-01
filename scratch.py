import re

with open(r'c:\Users\jonat\saas-miniwebs\components\landings\BarberiaTemplate.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add sectionList logic
new_logic = """
  const defaultSections = [ {id: "hero", visible: true}, {id: "services", visible: true}, {id: "productos", visible: true}, {id: "gallery", visible: true}, {id: "video", visible: true}, {id: "booking", visible: true}, {id: "contact", visible: true} ];
  const sectionList = props.sections && props.sections.length > 0 ? props.sections : defaultSections;
"""
# Replace props
content = content.replace(
    'export default function BarberiaTemplate({ negocio, media = [], businessId }: { negocio: any; media?: any[]; businessId?: string }) {',
    'export default function BarberiaTemplate(props: { negocio: any; media?: any[]; businessId?: string; sections?: any[] }) {\n  const { negocio, media = [], businessId } = props;\n' + new_logic
)

content = content.replace(
    'export default function BarberiaTemplate({ negocio, media = [], businessId, sections }: { negocio: any; media?: any[]; businessId?: string, sections?: any[] }) {',
    'export default function BarberiaTemplate(props: { negocio: any; media?: any[]; businessId?: string; sections?: any[] }) {\n  const { negocio, media = [], businessId } = props;\n' + new_logic
)

# Replace sections block
main_match = re.search(r'({\/\* ─── HERO ─── \*\/}.*?)(?={\/\* ─── FOOTER \/ CONTACTO ─── \*\/})', content, re.DOTALL)
if main_match:
    main_inner = main_match.group(1)
    
    blocks = {}
    
    # Hero
    hero_match = re.search(r'({\/\* ─── HERO ─── \*\/}.*?)(?={\/\* ─── SERVICES ─── \*\/})', main_inner, re.DOTALL)
    blocks['hero'] = hero_match.group(1).strip() if hero_match else ""
    
    # Services
    srv_match = re.search(r'({\/\* ─── SERVICES ─── \*\/}.*?)(?={\/\* ─── PRODUCTOS ─── \*\/})', main_inner, re.DOTALL)
    blocks['servicios'] = srv_match.group(1).strip() if srv_match else ""
    
    # Productos
    prod_match = re.search(r'({\/\* ─── PRODUCTOS ─── \*\/}.*?)(?={\/\* ─── GALERÍA ─── \*\/})', main_inner, re.DOTALL)
    blocks['productos'] = prod_match.group(1).strip() if prod_match else ""
    
    # Galeria
    gal_match = re.search(r'({\/\* ─── GALERÍA ─── \*\/}.*?)(?={\/\* ─── VIDEO ─── \*\/})', main_inner, re.DOTALL)
    blocks['galeria'] = gal_match.group(1).strip() if gal_match else ""
    
    # Video
    vid_match = re.search(r'({\/\* ─── VIDEO ─── \*\/}.*?)(?={\/\* ─── BOOKING ─── \*\/})', main_inner, re.DOTALL)
    blocks['video'] = vid_match.group(1).strip() if vid_match else ""
    
    # Booking
    book_match = re.search(r'({\/\* ─── BOOKING ─── \*\/}.*)', main_inner, re.DOTALL)
    blocks['booking'] = book_match.group(1).strip() if book_match else ""
    
    new_main = "        {sectionList.filter((s: any) => s.visible !== false).map((s: any) => {\n"
    new_main += "          switch (s.id) {\n"
    new_main += "            case 'hero': return <React.Fragment key={s.id}>\n" + blocks['hero'] + "\n</React.Fragment>;\n"
    new_main += "            case 'services': \n            case 'servicios': return <React.Fragment key={s.id}>\n" + blocks['servicios'] + "\n</React.Fragment>;\n"
    new_main += "            case 'products': \n            case 'productos': return <React.Fragment key={s.id}>\n" + blocks['productos'] + "\n</React.Fragment>;\n"
    new_main += "            case 'gallery': \n            case 'galeria': return <React.Fragment key={s.id}>\n" + blocks['galeria'] + "\n</React.Fragment>;\n"
    new_main += "            case 'video': return <React.Fragment key={s.id}>\n" + blocks['video'] + "\n</React.Fragment>;\n"
    new_main += "            case 'booking': return <React.Fragment key={s.id}>\n" + blocks['booking'] + "\n</React.Fragment>;\n"
    new_main += "            default: return null;\n"
    new_main += "          }\n"
    new_main += "        })}\n"
    new_main += "        \n"
    
    content = content[:main_match.start()] + new_main + content[main_match.end():]
    
    with open(r'c:\Users\jonat\saas-miniwebs\components\landings\BarberiaTemplate.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("DONE")
else:
    print("NO MATCH")
