import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { apiClient } from '@/api/appClient';
import { normalizeSearch } from '@/lib/search';

const PAGES = [{ label: 'Projetos', to: '/projetos' }, { label: 'Artistas', to: '/artistas' }, { label: 'Minhas tarefas', to: '/minhas-tarefas' }, { label: 'Templates', to: '/templates' }];
export default function WorkspaceSearch() {
  const navigate = useNavigate(); const input = useRef(null); const alive = useRef(true); const pending = useRef(false);
  const [query, setQuery] = useState(''); const [focused, setFocused] = useState(false); const [selected, setSelected] = useState(0);
  const [data, setData] = useState({ projects: [], artists: [] }); const [loading, setLoading] = useState(false); const [error, setError] = useState(false);
  const [shortcut] = useState(() => /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K');
  useEffect(() => {
    alive.current = true;
    const keydown = event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.current?.focus(); input.current?.select(); } };
    window.addEventListener('keydown', keydown);
    return () => { alive.current = false; window.removeEventListener('keydown', keydown); };
  }, []);
  const load = async () => {
    if (pending.current) return; pending.current = true; setLoading(true); setError(false);
    try { const [projects, artists] = await Promise.all([apiClient.entities.Project.list('-created_date'), apiClient.entities.Artist.list()]); if (alive.current) setData({ projects, artists }); }
    catch { if (alive.current) setError(true); }
    finally { pending.current = false; if (alive.current) setLoading(false); }
  };
  const text = normalizeSearch(query);
  const rank = label => { const name = normalizeSearch(label); return name === text ? 0 : name.startsWith(text) ? 1 : name.includes(text) ? 2 : 3; };
  const results = [
    ...data.projects.filter(row => normalizeSearch(`${row.name} ${row.main_artist_name || ''}`).includes(text)).map(row => ({ label: row.name, to: `/projetos/${row.id}`, detail: `Projeto · ${row.main_artist_name || 'Sem artista'}` })),
    ...data.artists.filter(row => normalizeSearch(`${row.name} ${row.handle || ''}`).includes(text)).map(row => ({ label: row.name, to: `/artistas#artist-${row.id}`, detail: row.handle ? `Artista · @${row.handle}` : 'Artista' })),
    ...PAGES.filter(row => normalizeSearch(row.label).includes(text)).map(row => ({ ...row, detail: 'Página' })),
  ].sort((a, b) => rank(a.label) - rank(b.label)).slice(0, 10);
  const expanded = focused && !!text;
  const choose = result => { setQuery(''); setFocused(false); input.current?.blur(); navigate(result.to); };
  return <div className="relative min-w-0 max-w-xl flex-1">
    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
    <input ref={input} role="combobox" aria-label="Buscar no painel" aria-autocomplete="list" aria-expanded={expanded} aria-controls="dz-workspace-results" aria-activedescendant={expanded && results[selected] ? `dz-search-${selected}` : undefined} value={query} onChange={event => { setQuery(event.target.value); setSelected(0); }} onFocus={() => { setFocused(true); load(); }} onBlur={() => setFocused(false)} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); setQuery(''); input.current?.blur(); }
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); const next = Math.max(0, Math.min(results.length - 1, selected + (event.key === 'ArrowDown' ? 1 : -1))); setSelected(next); document.getElementById(`dz-search-${next}`)?.scrollIntoView({ block: 'nearest' }); }
      if (event.key === 'Enter' && expanded && results[selected]) { event.preventDefault(); choose(results[selected]); }
    }} className="h-9 w-full rounded-md border border-white/[0.07] bg-white/[0.025] pl-9 pr-3 text-sm text-white outline-none placeholder:text-muted-foreground hover:border-white/[0.14] focus:border-white/25 focus:bg-white/[0.045] sm:pr-16" placeholder="Buscar no painel..." />
    <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-2xs text-muted-foreground sm:block">{shortcut}</kbd>
    {expanded && <div className="absolute inset-x-0 top-11 max-h-[min(26rem,calc(100dvh-5.5rem))] overflow-y-auto rounded-lg border border-white/[0.1] bg-popover p-1.5 shadow-elev">
      <div role="listbox" id="dz-workspace-results" aria-label="Resultados da busca">{results.map((result, index) => <button type="button" role="option" tabIndex={-1} id={`dz-search-${index}`} key={result.to + result.label} aria-selected={selected === index} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setSelected(index)} onClick={() => choose(result)} className={`flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2.5 text-left ${selected === index ? 'bg-white/[0.075]' : 'hover:bg-white/5'}`}><span className="min-w-0 flex-1"><span className="block truncate text-sm text-white/90">{result.label}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{result.detail}</span></span><ArrowUpRight size={14} className="shrink-0 text-muted-foreground" /></button>)}</div>
      {loading && <p role="status" className="px-3 py-2 text-xs text-muted-foreground">Buscando projetos e artistas...</p>}
      {error && <p role="status" className="px-3 py-2 text-xs text-amber-200">Não foi possível atualizar os resultados. <button type="button" className="underline" onMouseDown={event => event.preventDefault()} onClick={load}>Tentar novamente</button></p>}
      {!loading && !error && !results.length && <p role="status" className="px-3 py-5 text-center text-xs text-muted-foreground">Nenhum resultado encontrado.</p>}
    </div>}
  </div>;
}
