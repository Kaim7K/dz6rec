import { CATEGORIES } from "@/lib/music";

// infere a categoria de uma seção pelo campo explícito ou pelo nome
export function sectionCategory(section) {
  if (section?.category) return section.category;
  const n = (section?.name || "").toLowerCase();
  if (n.includes("visual") || n.includes("identidade")) return "visual";
  if (n.includes("música") || n.includes("musica") || n.includes("produção musical")) return "musica";
  if (n.includes("marketing") || n.includes("estrat") || n.includes("pré") || n.includes("pre") || n.includes("lanç") || n.includes("lanc") || n.includes("pós") || n.includes("pos")) return "marketing";
  return null;
}

// Calcula progresso por categoria (Música/Visual/Marketing) e total, exclusivamente por tarefas concluídas
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

// versão leve para cards/listagens: só total a partir de itens (seções implícitas)
export function totalProgress(items) {
  const t = (items || []).length;
  const d = (items || []).filter((i) => i.completed).length;
  return { d, t, pct: t ? Math.round((d / t) * 100) : 0 };
}