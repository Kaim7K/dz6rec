import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/api/appClient";
import { AtSign, Loader2, MessageSquare, Send } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import ChatAvatar from "./ChatAvatar";
import { cargoColor } from "@/components/CargoBadge";
import { cargoList } from "@/lib/music";
import { notifyUsers, parseMentions } from "@/lib/notifications";

const dayLabel = (date) => {
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  const label = format(date, "dd 'de' MMMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const sameBlock = (previous, current) =>
  previous &&
  current &&
  previous.user_id === current.user_id &&
  new Date(current.created_date) - new Date(previous.created_date) < 5 * 60 * 1000;

const TOKEN_AT_END = /@([\p{L}\p{N} ._/-]*)$/u;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderText(text, tokens, mentionClass) {
  if (!tokens.length) return text;
  const re = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "giu");
  const out = [];
  let last = 0;
  for (const match of text.matchAll(re)) {
    if (match.index > last) out.push(text.slice(last, match.index));
    out.push(<span key={`${match.index}-${match[0]}`} className={mentionClass}>{match[0]}</span>);
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function MentionMenu({ options, onPick }) {
  return (
    <div className="absolute bottom-full left-3 right-3 z-10 mb-2 overflow-hidden rounded-lg border border-white/[0.08] bg-popover p-1.5 shadow-pop sm:right-auto sm:w-80">
      <p className="px-2 py-1 text-2xs font-medium uppercase tracking-[0.16em] text-white/35">Mencionar</p>
      <div className="max-h-56 overflow-y-auto">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onPick(option)}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            {option.type === "user" ? (
              <ChatAvatar name={option.label} photoUrl={option.photo_url} size={24} />
            ) : (
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ backgroundColor: (option.color || "#888") + "2e", color: option.color || "#fff" }}>
                <AtSign size={12} />
              </span>
            )}
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {option.type === "cargo" && <span className="shrink-0 text-2xs text-white/30">cargo</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatTab({ project }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const userById = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])), [users]);
  const participants = useMemo(() => {
    const ids = [...new Set(messages.filter((message) => message.user_id).map((message) => message.user_id))];
    return ids.map((id) => userById[id]).filter(Boolean);
  }, [messages, userById]);

  const mentionOptions = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.trim().toLowerCase();
    const options = [
      ...cargos.map((cargo) => ({ key: `cargo-${cargo.name}`, type: "cargo", label: cargo.name, color: cargoColor(cargo.name, cargos) })),
      ...users.map((user) => ({ key: `user-${user.id}`, type: "user", label: user.full_name || user.email, photo_url: user.photo_url })),
    ];
    return options.filter((option) => option.label && option.label.toLowerCase().includes(query)).slice(0, 8);
  }, [mentionQuery, cargos, users]);

  const tokensByMessage = useMemo(() => {
    const map = {};
    messages.forEach((message) => {
      map[message.id] = parseMentions(message.text, users, cargos).tokens;
    });
    return map;
  }, [messages, users, cargos]);

  const loadMessages = async () => {
    const rows = await apiClient.entities.ProjectMessage.filter({ project_id: project.id });
    const sorted = rows.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages((current) => {
      const currentKey = current.map((message) => `${message.id}:${message.updated_date || message.created_date}`).join("|");
      const nextKey = sorted.map((message) => `${message.id}:${message.updated_date || message.created_date}`).join("|");
      return currentKey === nextKey ? current : sorted;
    });
  };

  useEffect(() => {
    let active = true;
    let unsubscribe = null;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [currentUser, userRows, cargoRows] = await Promise.all([
          apiClient.auth.me().catch(() => null),
          apiClient.entities.User.list().catch(() => []),
          apiClient.entities.Cargo.list().catch(() => []),
        ]);
        if (!active) return;
        setMe(currentUser);
        setUsers(userRows);
        setCargos([...new Set([...cargoRows.map((cargo) => cargo.name), ...userRows.flatMap((user) => cargoList(user.cargo))])].filter(Boolean).map((name) => ({ name })));
        await loadMessages();
      } catch (err) {
        if (active) setError(err.message || "Nao foi possivel carregar a conversa.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    try { unsubscribe = apiClient.entities.ProjectMessage.subscribe(() => loadMessages(), { interval: 900 }); } catch {}
    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [project.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleType = (value) => {
    setText(value);
    const match = value.match(TOKEN_AT_END);
    setMentionQuery(match ? match[1] : null);
  };

  const pickMention = (option) => {
    setText((current) => current.replace(TOKEN_AT_END, `@${option.label} `));
    setMentionQuery(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const send = async (event) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    setError("");
    const user = me || (await apiClient.auth.me().catch(() => null));
    const name = user?.full_name || user?.email || "Equipe";

    try {
      const created = await apiClient.entities.ProjectMessage.create({ project_id: project.id, text: content, user_id: user?.id, user_name: name });
      setMessages((current) => [...current, created].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      setText("");
      setMentionQuery(null);

      const { users: mentioned } = parseMentions(content, users, cargos);
      const mentionedIds = mentioned.map((mentionedUser) => mentionedUser.id);
      if (mentionedIds.length > 0) {
        await notifyUsers(mentionedIds, { text: `Voce foi mencionado no chat de "${project.name}"`, projectId: project.id, link: `/projetos/${project.id}` }, user?.id);
      } else {
        const items = await apiClient.entities.ChecklistItem.filter({ project_id: project.id });
        const ids = items.map((item) => item.responsible_id).filter(Boolean);
        await notifyUsers(ids, { text: `Nova mensagem no projeto "${project.name}"`, projectId: project.id, link: `/projetos/${project.id}` }, user?.id);
      }
    } catch (err) {
      setError(err.message || "Nao foi possivel enviar a mensagem.");
    } finally {
      setSending(false);
    }
  };

  const rows = [];
  messages.forEach((message, index) => {
    const date = new Date(message.created_date);
    const previous = messages[index - 1];
    if (!previous || new Date(previous.created_date).toDateString() !== date.toDateString()) {
      rows.push({ type: "day", key: `day-${message.id || index}`, label: dayLabel(date) });
    }
    const next = messages[index + 1];
    rows.push({
      type: "message",
      key: message.id,
      message,
      date,
      mine: message.user_id && message.user_id === me?.id,
      first: !sameBlock(previous, message),
      last: !sameBlock(message, next),
      sender: userById[message.user_id] || { full_name: message.user_name || "Equipe" },
    });
  });

  return (
    <div className="dz-card flex h-[min(38rem,calc(100svh-11rem))] min-h-[28rem] flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {participants.length > 0 ? (
            <div className="flex -space-x-2.5">
              {participants.slice(0, 6).map((participant) => (
                <ChatAvatar key={participant.id} name={participant.full_name || participant.email} photoUrl={participant.photo_url} size={28} className="ring-2 ring-[#141414]" />
              ))}
            </div>
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-md border border-white/[0.07] bg-white/[0.03] text-white/42">
              <MessageSquare size={17} />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Conversa do projeto</p>
            <p className="truncate text-2xs text-white/40">Use @ para mencionar pessoas ou cargos.</p>
          </div>
        </div>
        <span className="dz-pill h-7">{messages.length}</span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-4">
        {loading ? (
          <div className="grid h-full place-items-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-md border border-white/[0.07] bg-white/[0.03]">
              <MessageSquare className="text-white/35" size={20} />
            </span>
            <p className="max-w-sm text-sm leading-6 text-white/38">Nenhuma mensagem ainda. Comece a conversa, alinhe decisoes e mencione responsaveis com @.</p>
          </div>
        ) : rows.map((row) => {
          if (row.type === "day") {
            return <div key={row.key} className="flex justify-center py-3"><span className="dz-pill h-7 text-white/45">{row.label}</span></div>;
          }

          const { message, date, mine, first, last, sender } = row;
          const name = sender.full_name || sender.email || "Equipe";
          const tokens = tokensByMessage[message.id] || [];
          const bubble = mine
            ? `bg-primary px-3.5 py-2 text-sm leading-6 text-primary-foreground ${last ? "rounded-br-md" : ""}`
            : `border border-white/[0.06] bg-white/[0.045] px-3.5 py-2 text-sm leading-6 text-white/85 ${last ? "rounded-bl-md" : ""}`;

          return (
            <div key={row.key} className={`flex items-end gap-2.5 ${mine ? "justify-end" : ""} ${first ? "pt-2" : ""}`}>
              {!mine && (first ? <ChatAvatar name={name} photoUrl={sender.photo_url} size={28} /> : <span className="w-7" />)}
              <div className={`flex min-w-0 max-w-[88%] flex-col ${mine ? "items-end" : "items-start"} sm:max-w-[74%]`}>
                {first && (
                  <p className="px-1 text-2xs">
                    <span className="font-medium text-white/80">{mine ? "Voce" : name}</span>
                    <span className="text-white/35"> · {format(date, "HH:mm")}</span>
                  </p>
                )}
                <div className={`${first ? "mt-1" : ""} whitespace-pre-wrap break-words rounded-lg ${bubble}`}>
                  {renderText(message.text, tokens, mine ? "font-semibold text-white" : "font-semibold text-primary")}
                </div>
              </div>
              {mine && (last ? <ChatAvatar name={me?.full_name || "Voce"} photoUrl={me?.photo_url} size={28} /> : <span className="w-7" />)}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <p className="mx-3 mb-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      <form onSubmit={send} className="relative flex items-end gap-2 border-t border-white/[0.06] p-3">
        {mentionQuery !== null && mentionOptions.length > 0 && <MentionMenu options={mentionOptions} onPick={pickMention} />}
        <textarea
          ref={inputRef}
          value={text}
          rows={1}
          onChange={(event) => handleType(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setMentionQuery(null);
            if (event.key === "Enter" && mentionQuery !== null && mentionOptions.length > 0) {
              event.preventDefault();
              pickMention(mentionOptions[0]);
              return;
            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(event);
            }
          }}
          placeholder="Escreva uma mensagem..."
          className="max-h-32 min-h-10 flex-1 resize-none rounded-md border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-white/32 focus:border-primary/40 focus:bg-white/[0.045]"
        />
        <button
          type="button"
          onClick={() => { setText((current) => `${current}@`); setMentionQuery(""); requestAnimationFrame(() => inputRef.current?.focus()); }}
          aria-label="Mencionar"
          className="dz-icon-button h-10 w-10"
        >
          <AtSign size={16} />
        </button>
        <button disabled={sending || !text.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-45">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
