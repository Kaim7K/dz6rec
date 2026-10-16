import React, { useState } from 'react';
import { MessageCircle, PanelRightClose, Search, Users, WifiOff } from 'lucide-react';
import ChatAvatar from '@/components/projects/ChatAvatar';
import CargoBadge from '@/components/CargoBadge';
import { cargoList, PERMISSAO } from '@/lib/music';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function PresenceAvatar({ person, size = 32 }) {
  return <span aria-hidden="true" className="relative inline-flex shrink-0"><ChatAvatar name={person.full_name || person.email} photoUrl={person.photo_url} size={size} className={person.online ? '' : 'grayscale !text-white'} /><span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#111010] ${person.online ? 'bg-emerald-400' : 'bg-zinc-500'}`} /></span>;
}

function PersonRow({ person, me, cargos, onTalk }) {
  const [profile, setProfile] = useState(false);
  return <Popover open={profile} onOpenChange={setProfile}><PopoverTrigger asChild>
    <button type="button" aria-label={`Ver perfil de ${person.full_name || person.email}`} data-offline={!person.online} className="dz-team-person group">
      <PresenceAvatar person={person} />
      <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium text-white/90 group-hover:text-white">{person.full_name || person.email}{person.id === me.id ? ' · Você' : ''}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{cargoList(person.cargo).join(', ') || (person.online ? 'Disponível' : 'Offline')}</span></span>
    </button>
  </PopoverTrigger><PopoverContent side="left" align="start" sideOffset={12} className="z-[70] w-80 overflow-x-hidden border-white/10 bg-[#141313] p-0">
    <div className="h-14 border-b border-white/[0.06] bg-red-950/25" />
    <div className="px-4 pb-4"><div className="-mt-6 inline-flex rounded-full bg-[#141313] p-1"><PresenceAvatar person={person} size={48} /></div>
      <h3 className="mt-2 text-base font-semibold [overflow-wrap:anywhere]">{person.full_name || person.email}</h3>
      <p className="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">{person.handle ? `@${person.handle}` : person.email}</p>
      <p className={`mt-2 flex items-center gap-1.5 text-xs ${person.online ? 'text-emerald-300' : 'text-muted-foreground'}`}><span className={`h-1.5 w-1.5 rounded-full ${person.online ? 'bg-emerald-400' : 'bg-zinc-500'}`} />{person.online ? 'Online agora' : 'Offline'}</p>
      <div className="my-4 border-y border-white/[0.07] py-3"><p className="mb-2 text-xs font-medium text-muted-foreground">Cargos</p><div className="flex flex-wrap gap-1.5">{cargoList(person.cargo).length ? cargoList(person.cargo).map(name => <CargoBadge key={name} cargo={name} cargos={cargos} />) : <span className="text-xs text-muted-foreground">Nenhum cargo atribuído</span>}</div><p className="mt-3 text-xs text-muted-foreground">{PERMISSAO[person.permissao] || 'Equipe'}{person.status !== 'ativo' ? ' · Acesso ' + (person.status === 'pendente' ? 'pendente' : 'inativo') : ''}</p></div>
      <Button className="w-full" disabled={person.id === me.id} onClick={() => { setProfile(false); onTalk(person); }}><MessageCircle size={15} />{person.id === me.id ? 'Seu perfil' : 'Conversar'}</Button>
    </div>
  </PopoverContent></Popover>;
}

export default function TeamSidebar({ open, wide, onClose, data, loading, error, onRetry, me, onTalk, bottom }) {
  const [query, setQuery] = useState('');
  const people = data.users.filter(person => `${person.full_name || ''} ${person.email || ''} ${cargoList(person.cargo).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const online = people.filter(person => person.online); const offline = people.filter(person => !person.online);
  const content = <>
    <div className="border-b border-white/[0.07] p-4"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-sm font-semibold"><Users size={16} className="text-muted-foreground" />Equipe <span className="text-xs font-normal text-muted-foreground">{data.users.length}</span></span><button type="button" aria-label="Minimizar equipe" onClick={onClose} className="dz-icon-button h-8 w-8"><PanelRightClose size={16} /></button></div><label className="relative mt-3 block"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><input aria-label="Buscar pessoas na equipe" value={query} onChange={event => setQuery(event.target.value)} className="dz-input h-9 w-full pl-8 text-xs" placeholder="Buscar pessoas..." /></label></div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
      {error && <p role="status" className="px-2 py-3 text-xs text-amber-200"><WifiOff size={13} className="mr-1 inline" />Equipe indisponível. <button onClick={onRetry} className="underline">Tentar novamente</button></p>}
      {loading ? <p role="status" className="p-3 text-xs text-muted-foreground">Carregando equipe...</p> : <>{[[online, 'Online'], [offline, 'Offline']].map(([rows, label]) => rows.length > 0 && <section key={label}><h2 className="px-2 pb-2 pt-4 text-xs font-medium text-muted-foreground">{label} — {rows.length}</h2>{rows.map(person => <PersonRow key={person.id} person={person} me={me} cargos={data.cargos} onTalk={onTalk} />)}</section>)}{!people.length && <p className="p-4 text-center text-xs text-muted-foreground">Nenhuma pessoa encontrada.</p>}</>}
    </div>
  </>;
  if (wide) return open ? <aside aria-label="Equipe do site" className="dz-team-sidebar" style={{ bottom }}>{content}</aside> : null;
  return <Sheet open={open} onOpenChange={value => { if (!value) onClose(); }}><SheetContent side="right" onCloseAutoFocus={event => event.preventDefault()} className="flex w-[min(20rem,100vw)] flex-col gap-0 bg-[#111010] p-0 [&>button]:hidden"><SheetTitle className="sr-only">Equipe do site</SheetTitle><SheetDescription className="sr-only">Pessoas, presença e perfis da equipe.</SheetDescription>{content}</SheetContent></Sheet>;
}
