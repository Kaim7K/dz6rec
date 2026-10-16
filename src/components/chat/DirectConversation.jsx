import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { apiClient } from '@/api/appClient';
import ChatAvatar from '@/components/projects/ChatAvatar';

const order = (a, b) => a.created_date.localeCompare(b.created_date) || a.id.localeCompare(b.id);
export default function DirectConversation({ person, me, draft, onDraftChange, getClientId, onRead, onSent }) {
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [older, setOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const pane = useRef(null); const bottom = useRef(true); const restore = useRef(null); const alive = useRef(true);
  const loaded = useRef(false);
  const merge = rows => setMessages(current => {
    const next = [...new Map([...current, ...rows].map(row => [row.id, row])).values()].sort(order);
    return next.map(row => row.id).join('|') === current.map(row => row.id).join('|') ? current : next;
  });
  useEffect(() => {
    alive.current = true; let fetching = false;
    const load = async () => {
      if (fetching) return; fetching = true;
      try { const result = await apiClient.chat.messages(person.id); if (alive.current) { merge(result.messages); if (!loaded.current) { setCursor(result.next_cursor); loaded.current = true; } setError(''); } }
      catch (err) { if (alive.current) setError(err.message || 'Não foi possível carregar as mensagens.'); }
      finally { fetching = false; if (alive.current) setLoading(false); }
    };
    load(); const unsubscribe = apiClient.chat.subscribe(load, { interval: 4000 });
    return () => { alive.current = false; unsubscribe(); };
  }, [person.id, attempt]);
  useLayoutEffect(() => {
    if (!pane.current) return;
    if (restore.current) { pane.current.scrollTop = restore.current.top + pane.current.scrollHeight - restore.current.height; restore.current = null; }
    else if (bottom.current) pane.current.scrollTop = pane.current.scrollHeight;
  }, [messages]);
  useEffect(() => {
    const read = () => { if (bottom.current && document.visibilityState === 'visible' && messages.length) onRead('direct', person.id, messages.at(-1).id); };
    read(); document.addEventListener('visibilitychange', read);
    return () => document.removeEventListener('visibilitychange', read);
  }, [messages, onRead, person.id]);
  const loadOlder = async () => {
    if (!cursor || older) return; setOlder(true); setError('');
    try { const result = await apiClient.chat.messages(person.id, cursor); if (alive.current) { restore.current = { top: pane.current.scrollTop, height: pane.current.scrollHeight }; merge(result.messages); setCursor(result.next_cursor); } }
    catch (err) { if (alive.current) setError(err.message || 'Não foi possível carregar o histórico.'); }
    finally { if (alive.current) setOlder(false); }
  };
  const send = async event => {
    event.preventDefault(); const text = draft.trim(); if (!text || sending || person.status !== 'ativo') return;
    setSending(true); setError('');
    try {
      const created = await apiClient.chat.send({ recipient_id: person.id, text, client_id: getClientId(text) });
      onDraftChange(''); onSent();
      if (alive.current) { bottom.current = true; merge([created]); }
    } catch (err) { if (alive.current) setError(err.message || 'Não foi possível enviar. A mensagem foi mantida.'); }
    finally { if (alive.current) setSending(false); }
  };
  return <div className="flex min-h-0 flex-1 flex-col">
    <div ref={pane} tabIndex={0} role="log" aria-label={`Mensagens com ${person.full_name || person.email}`} aria-live="polite" aria-relevant="additions" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4" onScroll={event => { const node = event.currentTarget; bottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48; if (bottom.current && messages.length) onRead('direct', person.id, messages.at(-1).id); }}>
      {cursor && <button onClick={loadOlder} disabled={older} className="mx-auto block rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-white/5 hover:text-white">{older ? 'Carregando...' : 'Carregar mensagens anteriores'}</button>}
      {loading ? <p role="status" className="py-10 text-center text-xs text-muted-foreground">Carregando conversa...</p> : !messages.length ? <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><ChatAvatar name={person.full_name || person.email} photoUrl={person.photo_url} size={48} /><p className="text-sm font-medium [overflow-wrap:anywhere]">Sua conversa com {person.full_name || person.email}</p><p className="text-xs text-muted-foreground">As mensagens ficam entre vocês dois.</p></div> : messages.map(message => {
        const mine = message.sender_id === me.id;
        return <div key={message.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}><span className="mb-1 max-w-full text-2xs text-muted-foreground [overflow-wrap:anywhere]">{mine ? 'Você' : person.full_name || person.email} · {new Date(message.created_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span><p className={`max-w-[92%] whitespace-pre-wrap rounded-lg border px-3 py-2 text-sm leading-6 [overflow-wrap:anywhere] ${mine ? 'border-red-500/15 bg-[#241414] text-white/90' : 'border-white/[0.06] bg-white/[0.04] text-white/85'}`}>{message.text}</p></div>;
      })}
    </div>
    {error && <p role="alert" className="mx-3 mb-2 rounded-md border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-200 [overflow-wrap:anywhere]">{error} <button onClick={() => setAttempt(n => n + 1)} className="underline">Atualizar conversa</button></p>}
    {person.status !== 'ativo' && <p className="px-4 pb-3 text-xs text-amber-200">Esta conta não tem acesso ativo. O histórico continua disponível.</p>}
    <form onSubmit={send} className="flex items-end gap-2 border-t border-white/[0.07] p-3"><textarea aria-label="Mensagem direta" value={draft} disabled={sending || person.status !== 'ativo'} maxLength={8000} rows={2} onChange={event => onDraftChange(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(event); } }} placeholder="Escreva uma mensagem..." className="dz-input min-h-11 max-h-32 flex-1 resize-y py-2 leading-5" /><button type="submit" aria-label="Enviar mensagem direta" disabled={sending || !draft.trim() || person.status !== 'ativo'} className="dz-primary-button h-11 w-11 shrink-0 px-0">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button></form>
  </div>;
}
