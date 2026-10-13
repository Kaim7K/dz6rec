import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/api/appClient";
import { AtSign, MessageSquare, Send } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import ChatAvatar from "./ChatAvatar";
import { cargoColor } from "@/components/CargoBadge";
import { cargoList } from "@/lib/music";
import { notifyUsers, parseMentions } from "@/lib/notifications";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const dayLabel = (d) => (isToday(d) ? "Hoje" : isYesterday(d) ? "Ontem" : cap(format(d, "dd 'de' MMMM", { locale: ptBR })));
const sameBlock = (a, b) => a && b && a.user_id === b.user_id && new Date(b.created_date) - new Date(a.created_date) < 5 * 60 * 1000;
const TOKEN_AT_END = /@([a-zà-ÿ0-9 .\-/]*)$/i;

const renderText = (text, tokens, mentionClass) => {
  if (!tokens.length) return text;
  const re = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const out = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<span key={m.index} className={mentionClass}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return out;
};

export default function ChatTab({ project }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const participants = useMemo(() => {
    const ids = [...new Set(messages.filter((m) => m.user_id).map((m) => m.user_id))];
    return ids.map((id) => userById[id]).filter(Boolean);
  }, [messages, userById]);

  const mentionOptions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.trim().toLowerCase();
    const opts = [
      ...cargos.map((c) => ({ key: "cargo-" + c.name, type: "cargo", label: c.name, color: cargoColor(c.name, cargos) })),
      ...users.map((u) => ({ key: "u-" + u.id, type: "user", label: u.full_name || u.email, photo_url: u.photo_url })),
    ];
    return opts.filter((o) => o.label && o.label.toLowerCase().includes(q)).slice(0, 8);
  }, [mentionQuery, cargos, users]);

  const tokensByMsg = useMemo(() => {
    const map = {};
    messages.forEach((m) => { map[m.id] = parseMentions(m.text, users, cargos).tokens; });
    return map;
  }, [messages, users, cargos]);

  const load = () =>
    apiClient.entities.ProjectMessage.filter({ project_id: project.id }).then((m) =>
      setMessages(m.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)))
    );

  useEffect(() => {
    apiClient.auth.me().then(setMe).catch(() => {});
    Promise.all([apiClient.entities.User.list().catch(() => []), apiClient.entities.Cargo.list().catch(() => [])]).then(([us, cs]) => {
      setUsers(us);
      setCargos([...new Set([...cs.map((c) => c.name), ...us.flatMap((u) => cargoList(u.cargo))])].map((name) => ({ name })));
    });
    load();
    let unsub = null;
    try { unsub = apiClient.entities.ProjectMessage.subscribe(() => load()); } catch {}
    return () => { if (unsub) unsub(); };
  }, [project.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const user = me || (await apiClient.auth.me().catch(() => null));
    const name = user?.full_name || user?.email || "Equipe";
    const content = text.trim();
    await apiClient.entities.ProjectMessage.create({ project_id: project.id, text: content, user_id: user?.id, user_name: name });
    try {
      const { users: mentioned } = parseMentions(content, users, cargos);
      const mentionedIds = mentioned.map((u) => u.id);
      if (mentionedIds.length > 0) {
        await notifyUsers(mentionedIds, { text: `Você foi mencionado no chat de "${project.name}"`, projectId: project.id, link: `/projetos/${project.id}` }, user?.id);
      } else {
        const items = await apiClient.entities.ChecklistItem.filter({ project_id: project.id });
        const ids = items.map((i) => i.responsible_id).filter(Boolean);
        await notifyUsers(ids, { text: `Nova mensagem no projeto "${project.name}"`, projectId: project.id, link: `/projetos/${project.id}` }, user?.id);
      }
    } catch {}
    setText("");
    setMentionQuery(null);
  };

  const handleType = (v) => {
    setText(v);
    const m = v.match(TOKEN_AT_END);
    setMentionQuery(m ? m[1] : null);
  };

  const pickMention = (o) => {
    setText((t) => t.replace(TOKEN_AT_END, `@${o.label} `));
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const rows = [];
  messages.forEach((m, i) => {
    const d = new Date(m.created_date);
    const prev = messages[i - 1];
    if (!prev || new Date(prev.created_date).toDateString() !== d.toDateString()) rows.push({ type: "day", key: `d-${i}`, label: dayLabel(d) });
    const next = messages[i + 1];
    rows.push({
      type: "msg",
      key: m.id,
      m,
      d,
      mine: m.user_id && m.user_id === me?.id,
      first: !sameBlock(prev, m),
      last: !sameBlock(m, next),
      sender: userById[m.user_id] || { full_name: m.user_name || "Equipe" },
    });
  });

  return (
    <div className="flex h-[min(32rem,calc(100svh-12rem))] min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        {participants.length > 0 && (
          <div className="flex -space-x-2.5">
            {participants.slice(0, 6).map((p) => <ChatAvatar key={p.id} name={p.full_name} photoUrl={p.photo_url} size={26} className="ring-2 ring-[#141414]" />)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">Conversa do projeto</p>
          <p className="text-2xs text-white/40">Mencione com @ — pessoas e cargos recebem notificação</p>
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.05]"><MessageSquare className="text-white/35" size={20} /></span>
            <p className="max-w-xs text-sm text-white/35">Converse com a equipe do projeto. Use @ para mencionar pessoas ou cargos — responsáveis pelas tarefas recebem notificações.</p>
          </div>
        ) : rows.map((r) => {
          if (r.type === "day") return <div key={r.key} className="flex justify-center py-3"><span className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-2xs font-medium text-white/45">{r.label}</span></div>;
          const { m, d, mine, first, last, sender } = r;
          const name = sender.full_name || sender.email || "Equipe";
          const tokens = tokensByMsg[m.id] || [];
          if (mine) return (
            <div key={r.key} className={`flex items-end justify-end gap-2.5 ${first ? "pt-2" : ""}`}>
              <div className="flex max-w-[88%] flex-col items-end sm:max-w-[75%]">
                {first && <p className="px-1 text-2xs font-medium text-white/45">Você · {format(d, "HH:mm")}</p>}
                <div className={`${first ? "mt-1" : ""} rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground ${last ? "" : "rounded-br-md"}`}>{renderText(m.text, tokens, "font-semibold text-white")}</div>
              </div>
              {last ? <ChatAvatar name={me?.full_name || "Você"} photoUrl={me?.photo_url} size={28} /> : <span className="w-7" />}
            </div>
          );
          return (
            <div key={r.key} className={`flex items-end gap-2.5 ${first ? "pt-2" : ""}`}>
              {first ? <ChatAvatar name={name} photoUrl={sender.photo_url} size={28} /> : <span className="w-7" />}
              <div className="flex min-w-0 max-w-[88%] flex-col items-start sm:max-w-[75%]">
                {first && <p className="px-1 text-2xs"><span className="font-medium text-white/85">{name}</span><span className="text-white/35"> · {format(d, "HH:mm")}</span></p>}
                <div className={`${first ? "mt-1" : ""} rounded-2xl border border-white/[0.06] bg-white/[0.04] px-3.5 py-2 text-sm text-white/85 ${last ? "" : "rounded-bl-md"}`}>{renderText(m.text, tokens, "font-semibold text-primary")}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="relative flex items-center gap-2 border-t border-white/[0.06] p-3">
        {mentionQuery !== null && mentionOptions.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 z-10 mb-2 overflow-hidden rounded-xl border border-white/[0.08] bg-popover p-1.5 shadow-pop sm:right-auto sm:w-72">
            <p className="px-2 py-1 text-2xs font-medium uppercase tracking-[0.16em] text-white/35">Mencionar</p>
            <div className="max-h-52 overflow-y-auto">
              {mentionOptions.map((o) => (
                <button key={o.key} type="button" onClick={() => pickMention(o)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white">
                  {o.type === "user"
                    ? <ChatAvatar name={o.label} photoUrl={o.photo_url} size={22} />
                    : <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full" style={{ backgroundColor: (o.color || "#888") + "2e", color: o.color || "#fff" }}><AtSign size={12} /></span>}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.type === "cargo" && <span className="shrink-0 text-2xs text-white/30">cargo</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => handleType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMentionQuery(null);
            if (e.key === "Enter" && mentionQuery !== null && mentionOptions.length > 0) { e.preventDefault(); pickMention(mentionOptions[0]); }
          }}
          placeholder="Escreva uma mensagem... use @ para mencionar"
          className="flex-1 rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-white/15"
        />
        <button type="button" onClick={() => { setText((t) => t + "@"); setMentionQuery(""); inputRef.current?.focus(); }} aria-label="Mencionar" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/45 transition-colors hover:bg-white/5 hover:text-white"><AtSign size={16} /></button>
        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"><Send size={16} /></button>
      </form>
    </div>
  );
}
