import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FolderKanban, Loader2, MessageCircle, Minus, Search, Users, X } from 'lucide-react';
import { apiClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { usePlayer } from '@/lib/playerContext';
import TeamSidebar, { PresenceAvatar } from './TeamSidebar';
import DirectConversation from './DirectConversation';
import ChatTab from '@/components/projects/ChatTab';
import { useChatHub } from './useChatHub';
import dz6ProfileLogo from '@/assets/dz6-profile.png';

export default function GlobalChat({ teamOpen, onTeamChange }) {
  const { user } = useAuth(); const player = usePlayer(); const location = useLocation(); const navigate = useNavigate();
  const { data, loading, error, refresh } = useChatHub(user);
  const [wide, setWide] = useState(() => window.matchMedia('(min-width:1280px)').matches);
  const [open, setOpen] = useState(false); const [thread, setThread] = useState(null);
  const [tab, setTab] = useState('direct'); const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState({}); const [playerHeight, setPlayerHeight] = useState(0);
  const retries = useRef({}); const readIds = useRef({}); const launcher = useRef(null);
  useEffect(() => { const media = window.matchMedia('(min-width:1280px)'); const changed = () => setWide(media.matches); media.addEventListener('change', changed); return () => media.removeEventListener('change', changed); }, []);
  useEffect(() => {
    const node = document.querySelector('.dz-player'); if (!node) { setPlayerHeight(0); return; }
    const update = () => setPlayerHeight(Math.ceil(node.getBoundingClientRect().height)); update();
    const observer = new ResizeObserver(update); observer.observe(node); return () => observer.disconnect();
  }, [player.current]);
  const choose = useCallback((kind, target) => {
    setThread({ kind, id: target.id }); setOpen(true); setQuery('');
    if (!window.matchMedia('(min-width:1280px)').matches) onTeamChange(false);
  }, [onTeamChange]);
  useEffect(() => {
    const params = new URLSearchParams(location.search); const kind = params.get('chat'); const id = params.get('chatId');
    if (!['direct', 'project'].includes(kind) || !id || loading) return;
    const target = (kind === 'direct' ? data.users : data.projects).find(row => row.id === id);
    if (target && !(kind === 'direct' && id === user.id)) choose(kind, target);
    params.delete('chat'); params.delete('chatId');
    navigate({ pathname: location.pathname, search: params.toString(), hash: location.hash }, { replace: true });
  }, [location.pathname, location.search, location.hash, data.users, data.projects, loading, choose, navigate, user.id]);
  const markRead = useCallback((kind, target, message) => {
    if (document.visibilityState !== 'visible') return;
    const key = kind + ':' + target; if (readIds.current[key] === message) return;
    readIds.current[key] = message;
    apiClient.chat.markRead({ kind, target_id: target, message_id: message }).then(refresh).catch(() => { if (readIds.current[key] === message) delete readIds.current[key]; });
  }, [refresh]);
  const projectRead = useCallback(message => { if (thread?.kind === 'project') markRead('project', thread.id, message.id); }, [thread?.kind, thread?.id, markRead]);
  const person = thread?.kind === 'direct' ? data.users.find(row => row.id === thread.id) : null;
  const project = thread?.kind === 'project' ? data.projects.find(row => row.id === thread.id) : null;
  const title = person ? person.full_name || person.email : project?.name;
  const key = thread ? thread.kind + ':' + thread.id : '';
  const unread = data.conversations.reduce((n, row) => n + row.unread_count, 0) + data.project_unread.reduce((n, row) => n + row.unread_count, 0);
  const close = () => { setOpen(false); requestAnimationFrame(() => launcher.current?.focus()); };
  const toggleTeam = () => { if (!wide && !teamOpen) setOpen(false); onTeamChange(!teamOpen); };
  const filtered = (tab === 'direct' ? data.users.filter(row => row.id !== user.id) : data.projects).filter(row => `${row.name || row.full_name || ''} ${row.email || ''} ${row.main_artist_name || ''}`.toLowerCase().includes(query.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    if (tab === 'project') return 0;
    const ca = data.conversations.find(c => c.user_id === a.id); const cb = data.conversations.find(c => c.user_id === b.id);
    return Number(!!cb?.unread_count) - Number(!!ca?.unread_count) || (cb?.created_date || '').localeCompare(ca?.created_date || '') || Number(b.online) - Number(a.online);
  });
  return <div className="dz-global-chat" data-team-open={teamOpen ? 'true' : 'false'} style={{ '--chat-bottom': `${playerHeight + 16}px` }}>
    <TeamSidebar open={teamOpen} wide={wide} onClose={() => onTeamChange(false)} data={data} loading={loading} error={error} onRetry={refresh} me={user} onTalk={target => choose('direct', target)} bottom={playerHeight} />
    <div className="dz-chat-toolbar">
      <button type="button" onClick={toggleTeam} aria-label={teamOpen ? 'Minimizar equipe' : 'Abrir equipe'} aria-expanded={teamOpen} className="dz-ghost-button h-11 w-11 px-0 shadow-elev"><Users size={18} /></button>
      <button ref={launcher} type="button" aria-label={open ? 'Minimizar conversas' : 'Abrir conversas'} aria-expanded={open} onClick={() => { if (!open && !wide) onTeamChange(false); setOpen(value => !value); }} className={`dz-ghost-button h-11 gap-2 px-4 shadow-elev ${open ? 'border-red-500/30 bg-[#241414]' : 'bg-[#171414]'}`}><MessageCircle size={18} />Conversas{unread > 0 && <span aria-label={`${unread} mensagens não lidas`} className="rounded-full bg-primary px-1.5 py-0.5 text-2xs font-semibold text-white">{unread > 99 ? '99+' : unread}</span>}</button>
    </div>
    {open && <section role="region" aria-label="Central de conversas" className="dz-chat-window" onKeyDown={event => { if (event.key === 'Escape' && !event.defaultPrevented) { event.stopPropagation(); close(); } }}>
      <header className="flex shrink-0 items-center gap-2 border-b border-white/[0.08] px-3 py-3">
        {thread && <button type="button" aria-label="Escolher conversa" onClick={() => { setTab(thread.kind); setThread(null); }} className="dz-icon-button h-8 w-8"><ArrowLeft size={17} /></button>}
        <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold" title={title || 'Conversas'}>{thread ? title || 'Conversa indisponível' : 'Conversas'}</h2><p className="mt-0.5 truncate text-xs text-muted-foreground">{person ? person.online ? 'Online agora' : 'Offline · a mensagem ficará disponível' : project ? 'Conversa compartilhada do projeto' : 'Pessoas e projetos da gravadora'}</p></div>
        {project && <button type="button" aria-label="Abrir projeto desta conversa" onClick={() => navigate(`/projetos/${project.id}?tab=chat`)} className="dz-icon-button h-8 w-8"><ExternalLink size={15} /></button>}
        <button type="button" aria-label="Minimizar chat" onClick={close} className="dz-icon-button h-8 w-8"><Minus size={17} /></button><button type="button" aria-label="Fechar chat" onClick={() => { close(); setThread(null); }} className="dz-icon-button h-8 w-8"><X size={17} /></button>
      </header>
      {!thread ? <>
        <div className="shrink-0 space-y-3 border-b border-white/[0.07] p-3"><div role="tablist" aria-label="Tipos de conversa" className="grid grid-cols-2 gap-1 rounded-md bg-black/20 p-1">{[['direct', 'Pessoas', Users], ['project', 'Projetos', FolderKanban]].map(([kind, label, Icon]) => <button type="button" key={kind} role="tab" id={`dz-chat-${kind}-tab`} aria-controls="dz-chat-picker" aria-selected={tab === kind} tabIndex={tab === kind ? 0 : -1} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === 'Home' ? 'direct' : event.key === 'End' ? 'project' : kind === 'direct' ? 'project' : 'direct';
          setTab(next); document.getElementById(`dz-chat-${next}-tab`)?.focus();
        }} onClick={() => setTab(kind)} className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${tab === kind ? 'bg-red-500/10 text-white' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}><Icon size={14} />{label}</button>)}</div><label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input autoFocus aria-label="Buscar conversa" value={query} onChange={event => setQuery(event.target.value)} placeholder={tab === 'direct' ? 'Buscar pessoa...' : 'Buscar projeto...'} className="dz-input w-full pl-9" /></label></div>
        <div role="tabpanel" id="dz-chat-picker" aria-labelledby={`dz-chat-${tab}-tab`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {loading ? <p role="status" className="p-6 text-center text-xs text-muted-foreground"><Loader2 size={16} className="mx-auto mb-2 animate-spin" />Carregando conversas...</p> : error ? <p role="alert" className="p-4 text-sm text-red-200">Não foi possível carregar as conversas. <button onClick={refresh} className="underline">Tentar novamente</button></p> : !sorted.length ? <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</p> : sorted.map(target => {
            const count = tab === 'direct' ? data.conversations.find(c => c.user_id === target.id)?.unread_count || 0 : data.project_unread.find(c => c.project_id === target.id)?.unread_count || 0;
            const preview = tab === 'direct' ? data.conversations.find(c => c.user_id === target.id)?.last_message || (target.online ? 'Online agora' : 'Iniciar conversa') : target.main_artist_name || 'Conversa do projeto';
            return <button key={target.id} type="button" aria-label={`Abrir conversa ${tab === 'direct' ? 'com ' + (target.full_name || target.email) : 'do projeto ' + target.name}`} onClick={() => choose(tab, target)} data-offline={tab === 'direct' && !target.online} className="dz-team-person w-full">{tab === 'direct' ? <PresenceAvatar person={target} size={36} /> : <img src={target.cover_url || dz6ProfileLogo} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />}<span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">{target.name || target.full_name || target.email}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{preview}</span></span>{count > 0 && <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-200">{count > 99 ? '99+' : count}</span>}</button>;
          })}
        </div>
      </> : person ? <DirectConversation key={key} person={person} me={user} draft={drafts[key] || ''} onDraftChange={value => setDrafts(current => ({ ...current, [key]: value }))} getClientId={text => { if (retries.current[key]?.text !== text) retries.current[key] = { text, id: crypto.randomUUID() }; return retries.current[key].id; }} onRead={markRead} onSent={() => { delete retries.current[key]; refresh(); }} /> : project ? <ChatTab key={key} project={project} compact draft={drafts[key] || ''} onDraftChange={value => setDrafts(current => ({ ...current, [key]: value }))} onMessagesLoaded={projectRead} /> : <p className="p-4 text-sm text-muted-foreground">Esta conversa não está disponível. Escolha outra pessoa ou projeto.</p>}
    </section>}
  </div>;
}
