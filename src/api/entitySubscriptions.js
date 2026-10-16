const MIN_INTERVAL = { Notification: 15000, SystemFlag: 30000, ProjectMessage: 4000, ChecklistItem: 5000, ChecklistSection: 15000, Project: 15000 };

/** @typedef {{callback: () => unknown, registrations: Map<symbol, number>, interval: number, next: number, pending: boolean, queued: boolean, active: boolean}} Subscription */
/** @param {{window: Pick<Window, 'setTimeout'|'clearTimeout'|'addEventListener'|'removeEventListener'>, document: Pick<Document, 'visibilityState'|'addEventListener'|'removeEventListener'>, channel?: BroadcastChannel, now?: () => number}} env */
export function createEntitySubscriptions({ window, document, channel, now = Date.now }) {
  /** @type {Map<string, Map<() => unknown, Subscription>>} */
  const groups = new Map();
  let timer = null;
  const entries = () => [...groups.values()].flatMap(group => [...group.values()]);
  const schedule = () => {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    const all = entries();
    if (!all.length || document.visibilityState === 'hidden') return;
    timer = window.setTimeout(tick, Math.max(1, Math.min(...all.map(entry => entry.next)) - now()));
  };
  const invoke = (entry, force = false) => {
    if (!entry.active || document.visibilityState === 'hidden') return;
    entry.next = now() + entry.interval;
    if (entry.pending) { if (force) entry.queued = true; return; }
    entry.pending = true;
    // Serial callbacks prevent concurrent refreshes; event bursts queue one fresh read.
    Promise.resolve().then(() => entry.active && entry.callback()).catch(() => {}).finally(() => {
      entry.pending = false;
      if (entry.queued) { entry.queued = false; invoke(entry); }
      schedule();
    });
  };
  function tick() {
    for (const entry of entries()) if (entry.next <= now()) invoke(entry);
    schedule();
  }
  const changed = entity => {
    for (const [kind, group] of groups) if (!entity || entity === kind) for (const entry of group.values()) invoke(entry, true);
    schedule();
  };
  const local = event => changed(event.detail?.entity);
  const remote = event => changed(event.data?.entity);
  const focused = () => changed(null);
  const visibility = () => { if (document.visibilityState === 'visible') changed(null); else schedule(); };
  const attach = () => { window.addEventListener('dz6:entity-change', local); window.addEventListener('focus', focused); document.addEventListener('visibilitychange', visibility); channel?.addEventListener('message', remote); };
  const detach = () => { window.removeEventListener('dz6:entity-change', local); window.removeEventListener('focus', focused); document.removeEventListener('visibilitychange', visibility); channel?.removeEventListener('message', remote); };

  return (entity, callback, interval = 3000) => {
    if (!groups.size) attach();
    if (!groups.has(entity)) groups.set(entity, new Map());
    const group = groups.get(entity);
    let entry = group.get(callback);
    if (!entry) { entry = { callback, registrations: new Map(), interval: 0, next: 0, pending: false, queued: false, active: true }; group.set(callback, entry); }
    const key = Symbol(); entry.registrations.set(key, Math.max(interval, MIN_INTERVAL[entity] || 3000));
    entry.interval = Math.min(...entry.registrations.values()); entry.next = now() + entry.interval;
    schedule();
    let registered = true;
    return () => {
      if (!registered) return; registered = false;
      entry.registrations.delete(key);
      if (!entry.registrations.size) { entry.active = false; group.delete(callback); }
      else entry.interval = Math.min(...entry.registrations.values());
      if (!group.size) groups.delete(entity);
      if (!groups.size) detach();
      schedule();
    };
  };
}
