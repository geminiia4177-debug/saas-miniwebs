export function SharedTemplateStyles({ googleFontUrl }: { googleFontUrl?: string }) {
  return (
    <style>{`
      ${googleFontUrl ? `@import url('${googleFontUrl}');` : ''}
      .scroll-progress { position:fixed;top:0;left:0;height:3px;z-index:9999; transition:width .1s linear; }
      .animate-on-scroll { opacity:0; transform:translateY(24px); transition:opacity .6s var(--ease-out), transform .6s var(--ease-out); }
      .animate-on-scroll.visible { opacity:1; transform:none; }
      ::-webkit-scrollbar { width:4px; }
      ::-webkit-scrollbar-thumb { background:rgba(99,102,241,.25); border-radius:4px; }
    `}</style>
  );
}
