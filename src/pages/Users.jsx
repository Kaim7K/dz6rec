import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EditUserDialog from "@/components/users/EditUserDialog";
import DeleteUserButton from "@/components/users/DeleteUserButton";
import ManageCargosDialog from "@/components/users/ManageCargosDialog";
import { ActiveCargoChip, OrphanCargoChip } from "@/components/users/cargoChips";
import { PERMISSAO, cargoList } from "@/lib/music";
import { Check, Loader2, Pencil, Plus, Search, ShieldCheck, Users as UsersIcon } from "lucide-react";

const ALL = "__all__";
const GRID = "sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,3fr)_auto]";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCargo, setFilterCargo] = useState(ALL);
  const [email, setEmail] = useState("");
  const [inviteCargo, setInviteCargo] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [cargoUser, setCargoUser] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([apiClient.auth.me(), apiClient.entities.User.list(), apiClient.entities.Cargo.list()])
      .then(([m, u, c]) => {
        setMe(m);
        setUsers(u);
        setCargos(c);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const invite = async (e) => {
    e.preventDefault(); setSending(true); setMsg("");
    try { await apiClient.users.inviteUser(email, "user", inviteCargo); setMsg("Convite enviado com sucesso."); setEmail(""); setInviteCargo(""); }
    catch (err) { setMsg(err.message || "Não foi possível enviar o convite."); }
    finally { setSending(false); }
  };

  const catalogNames = cargos.map((c) => c.name);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const okQ = !q || (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
      const okC = filterCargo === ALL || cargoList(u.cargo).includes(filterCargo);
      return okQ && okC;
    });
  }, [users, search, filterCargo]);

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-stage-accent" /></div>;
  if (me?.permissao !== "superadmin") return (
    <div className="dz-card mx-auto max-w-md p-7 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-stage-accent-soft"><ShieldCheck className="text-stage-accent" /></div>
      <h1 className="mt-4 font-jakarta text-title font-bold text-stage-ink">Área restrita</h1>
      <p className="mt-2 text-body text-stage-muted">Somente a administração pode gerenciar usuários.</p>
    </div>
  );

  const activeCount = users.filter((u) => u.status === "ativo").length;
  const pendingCount = users.filter((u) => u.status === "pendente").length;
  const approve = async (u) => {
    await apiClient.entities.User.update(u.id, { status: "ativo" });
    load();
  };
  const statusBadge = (status) => {
    if (status === "pendente") return <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-micro font-medium text-amber-500">Pendente</span>;
    if (status === "inativo") return <span className="rounded-full bg-stage-warn-soft px-1.5 py-0.5 text-micro font-medium text-stage-warn">Inativo</span>;
    return null;
  };
  const chipsFor = (u, list) => list.map((n) => (catalogNames.includes(n)
    ? <ActiveCargoChip key={n} name={n} />
    : <OrphanCargoChip key={n} name={n} />));
  const Avatar = ({ u, size }) => (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-stage-accent-soft text-micro font-semibold text-stage-accent ${size}`}>
      {u.photo_url ? <img src={u.photo_url} alt="" className="h-full w-full object-cover" /> : (u.full_name || u.email || "U")[0].toUpperCase()}
    </span>
  );

  return (
    <div className="dz-page font-inter">
      <div className="dz-page-head">
        <div>
          <p className="dz-kicker">Administração</p>
          <h1 className="dz-page-title">Usuários</h1>
          <p className="dz-page-subtitle">{users.length} usuários · {activeCount} ativos{pendingCount ? ` · ${pendingCount} pendentes` : ""}</p>
        </div>
      </div>

      <div className="dz-card flex flex-col gap-2.5 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stage-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail..." className="h-10 w-full rounded-md border border-white/[0.08] bg-white/[0.026] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/34 focus:border-primary/45" />
        </div>
        <Select value={filterCargo} onValueChange={setFilterCargo}>
          <SelectTrigger className="h-10 w-full rounded-md border-white/[0.08] bg-white/[0.026] text-sm text-white sm:w-56"><SelectValue placeholder="Filtrar por cargo" /></SelectTrigger>
          <SelectContent className="border-stage-border bg-stage-card text-stage-ink">
            <SelectItem value={ALL}>Todos os cargos</SelectItem>
            {cargos.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={invite} className="dz-card flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@gravadora.com" required className="h-10 flex-1 rounded-md border border-white/[0.08] bg-white/[0.026] px-3 text-sm text-white outline-none transition placeholder:text-white/34 focus:border-primary/45" />
        <Select value={inviteCargo} onValueChange={setInviteCargo}>
          <SelectTrigger className="h-10 w-full rounded-md border-white/[0.08] bg-white/[0.026] text-sm text-white sm:w-48"><SelectValue placeholder="Cargo (opcional)" /></SelectTrigger>
          <SelectContent className="border-stage-border bg-stage-card text-stage-ink">{cargos.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <button disabled={sending} className="dz-primary-button disabled:opacity-60">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}Convidar
        </button>
      </form>
      {msg && <p className="text-body text-stage-muted">{msg}</p>}

      <div className="dz-card overflow-hidden">
        <div className={`hidden items-center gap-4 border-b border-stage-border bg-stage-surface px-4 py-2.5 text-micro font-semibold uppercase tracking-wide text-stage-muted sm:grid ${GRID}`}>
          <span>Usuário</span><span>E-mail</span><span>Cargos</span><span className="text-right">Ações</span>
        </div>
        {filtered.map((u) => (
          <div key={u.id} className={`hidden items-center gap-4 border-b border-stage-border px-4 py-2.5 last:border-0 sm:grid ${GRID}`}>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar u={u} size="h-8 w-8" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-body font-semibold text-stage-ink">
                  {u.full_name || "Usuário"}
                  {statusBadge(u.status)}
                </p>
                <p className="text-micro text-stage-muted">{PERMISSAO[u.permissao] || "Membro"}</p>
              </div>
            </div>
            <div className="min-w-0">
              <p className="truncate text-body text-stage-ink">{u.email}</p>
              {u.handle && <p className="text-micro text-stage-muted">@{u.handle}</p>}
            </div>
            <div className="flex flex-wrap gap-1.5">{chipsFor(u, cargoList(u.cargo))}</div>
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => setCargoUser(u)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stage-border bg-stage-card px-2.5 text-micro font-semibold text-stage-accent transition-colors hover:border-stage-accent/40 hover:bg-stage-accent-soft">Gerenciar Cargos</button>
              {u.status === "pendente" && <button onClick={() => approve(u)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 text-micro font-semibold text-white transition-colors hover:bg-emerald-700"><Check size={14} />Aprovar</button>}
              <button onClick={() => setEditUser(u)} aria-label="Editar usuário" className="rounded-full p-2 text-stage-muted transition-colors hover:bg-stage-surface hover:text-stage-ink"><Pencil size={15} /></button>
              {u.id !== me.id && <DeleteUserButton user={u} onDeleted={load} />}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="p-6 text-center text-body text-stage-muted">Nenhum usuário encontrado.</p>}
      </div>

      <div className="space-y-3 sm:hidden">
        {filtered.map((u) => {
          const list = cargoList(u.cargo);
          return (
            <div key={u.id} className="rounded-sl border border-stage-border bg-stage-card p-3">
              <div className="flex items-start gap-3">
                <Avatar u={u} size="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-body font-semibold text-stage-ink">{u.full_name || "Usuário"}{statusBadge(u.status)}</p>
                  <p className="truncate text-micro text-stage-muted">{u.email} · {PERMISSAO[u.permissao] || "Membro"}</p>
                </div>
                <button onClick={() => setEditUser(u)} aria-label="Editar usuário" className="rounded-full p-2 text-stage-muted transition-colors hover:bg-stage-surface hover:text-stage-ink"><Pencil size={15} /></button>
                {u.id !== me.id && <DeleteUserButton user={u} onDeleted={load} />}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {chipsFor(u, list.slice(0, 3))}
                {list.length > 3 && <span className="text-micro text-stage-muted">+{list.length - 3}</span>}
              </div>
              <button onClick={() => setCargoUser(u)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-sl bg-stage-accent text-body font-semibold text-white transition-colors hover:bg-stage-accent/90">
                <UsersIcon size={15} />Gerenciar Cargos
              </button>
              {u.status === "pendente" && <button onClick={() => approve(u)} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-sl bg-emerald-600 text-body font-semibold text-white transition-colors hover:bg-emerald-700"><Check size={15} />Aprovar acesso</button>}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="rounded-sl border border-stage-border bg-stage-card p-6 text-center text-body text-stage-muted">Nenhum usuário encontrado.</p>}
      </div>

      {cargoUser && <ManageCargosDialog user={cargoUser} catalog={cargos} onClose={() => setCargoUser(null)} onSaved={load} />}
      {editUser && <EditUserDialog user={editUser} cargos={cargos} onClose={() => setEditUser(null)} onSaved={load} />}
    </div>
  );
}
