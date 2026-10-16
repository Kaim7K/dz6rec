import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/api/appClient';

const EMPTY = { users: [], cargos: [], projects: [], conversations: [], project_unread: [] };
export function useChatHub(user) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const alive = useRef(false);
  const pending = useRef(false);
  const queued = useRef(false);
  const refresh = useCallback(async function refreshData() {
    if (!alive.current) return;
    if (pending.current) { queued.current = true; return; }
    pending.current = true;
    try { const next = await apiClient.chat.overview(); if (alive.current) { setData(next); setError(false); } }
    catch { if (alive.current) setError(true); }
    finally { pending.current = false; if (alive.current) setLoading(false); if (queued.current && alive.current) { queued.current = false; queueMicrotask(refreshData); } }
  }, []);
  useEffect(() => {
    alive.current = true;
    refresh();
    const unsubscribe = apiClient.chat.subscribe(refresh, { interval: 15000 });
    const projectChange = event => { if (['ProjectMessage', 'User', 'Cargo', 'Project'].includes(event.detail?.entity)) refresh(); };
    window.addEventListener('dz6:entity-change', projectChange);
    const session = crypto.randomUUID();
    const presence = available => apiClient.chat.presence({ session_id: session, available }).then(() => { if (available) refresh(); }).catch(() => {});
    const visibility = () => presence(document.visibilityState === 'visible');
    const leave = () => presence(false);
    visibility();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') presence(true); }, 25000);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', leave);
    return () => { alive.current = false; clearInterval(timer); unsubscribe(); window.removeEventListener('dz6:entity-change', projectChange); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', leave); leave(); };
  }, [user.id, refresh]);
  return { data, loading, error, refresh };
}
