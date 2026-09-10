import { CATEGORIES } from "@/lib/music";

// infere a categoria de uma seÃ§Ã£o pelo campo explÃ­cito ou pelo nome
export function sectionCategory(section) {
  if (section?.category) return section.category;
  const n = (section?.name || "").toLowerCase();
  if (n.includes("visual") || n.includes("identidade")) return "visual";
  if (n.includes("mÃºsica") || n.includes("musica") || n.includes("produÃ§Ã£o musical")) return "musica";
  if (n.includes("marketing") || n.includes("estrat") || n.includes("prÃ©") || n.includes("pre") || n.includes("lanÃ§") || n.includes("lanc") || n.includes("pÃ³s") || n.includes("pos")) return "marketing";
  return null;
}

// Calcula progresso por categoria (MÃºsica/Visual/Marketing) e total, exclusivamente por tarefas concluÃ­das
export function computeProgress(items, sections) {
  const secMap = {};
  (sections || []).forEach((s) => { secMap[s.id] = sectionCategory(s); });
  const cats = { musica: { d: 0, t: 0 }, visual: { d: 0, t: 0 }, marketing: { d: 0, t: 0 } };
  let d = 0, t = 0;
  (items || []).forEach((i) => {
    const cat = secMap[i.section_id];
    t++; if (i.completed) d++;
    if (cat && cats[cat]) { cats[cat].t++; if (i.completed) cats[cat].d++; }
  });
  const pct = (c) => (c.t ? Math.round((c.d / c.t) * 100) : 0);
  return {
    musica: { ...cats.musica, pct: pct(cats.musica) },
    visual: { ...cats.visual, pct: pct(cats.visual) },
    marketing: { ...cats.marketing, pct: pct(cats.marketing) },
    total: { d, t, pct: t ? Math.round((d / t) * 100) : 0 },
  };
}

// versÃ£o leve para cards/listagens: sÃ³ total a partir de itens (seÃ§Ãµes implÃ­citas)
export function totalProgress(items) {
  const t = (items || []).length;
  const d = (items || []).filter((i) => i.completed).length;
  return { d, t, pct: t ? Math.round((d / t) * 100) : 0 };
}