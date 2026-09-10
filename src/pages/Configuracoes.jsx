import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import CargoBadge from "@/components/CargoBadge";
import EditCargoDialog, { COLORS } from "@/components/cargos/EditCargoDialog";

export default function Configuracoes() {
  const [me, setMe] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [editCargo, setEditCargo] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiClient.auth.me().then((m) => { setMe(m); setLoading(false); }).catch(() => setLoading(false));
    apiClient.entities.Cargo.list().then(setCargos).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-white/40">Carregando...</p>;
  if (me?.role !== "admin") return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.03] p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/[0.05]"><ShieldCheck className="text-white/50" /></div>
      <h1 className="mt-4 font-display text-2xl font-medium text-white">Ãrea restrita</h1>
      <p className="mt-2 text-sm text-white/50">Somente a administraÃ§Ã£o pode configurar o painel.</p>
    </div>
  );

  const add = async (e) => { e.preventDefault(); if (!name.trim()) return; await apiClient.entities.Cargo.create({ name: name.trim(), color }); setName(""); setColor(COLORS[0]); load(); };
  const remove = async (c) => { await apiClient.entities.Cargo.delete(c.id); load(); };

  return (
    <div className="space-y-7">
      <div><p className="text-2xs font-medium uppercase tracking-[0.18em] text-white/35">Identidade</p><h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">ConfiguraÃ§Ãµes</h1><p className="mt-1.5 text-white/45">PreferÃªncias do painel da gravadora.</p></div>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
        <h2 className="font-display text-lg font-medium text-white">Cargos & badges</h2>
        <p className="mt-1 text-sm text-white/45">Defina os cargos da equipe. Eles aparecem como badges ao atribuir tarefas e nos perfis.</p>
        <form onSubmit={add} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo cargo (ex. Produtor Musical)" className="h-11 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm outline-none transition focus:border-white/15" />
          <div className="flex items-center gap-2">{COLORS.map((c) => (
            <button type="button" key={c} onClick={() => setColor(c)} className={`h-7 w-7 rounded-full transition-transform ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b0808]" : "ring-1 ring-white/10 hover:scale-110"}`} style={{ backgroundColor: c }} aria-label={c} />
          ))}</div>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><Plus size={16} />Adicionar</button>
        </form>
        <div className="mt-5 flex flex-wrap gap-2">
          {cargos.length === 0 && <p className="text-sm text-white/35">Nenhum cargo criado ainda.</p>}
          {cargos.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] py-1 pl-3 pr-2">
              <button onClick={() => setEditCargo(c)} className="transition-opacity hover:opacity-75"><CargoBadge cargo={c.name} cargos={cargos} /></button>
              <button onClick={() => setEditCargo(c)} aria-label="Editar cargo" className="rounded-full p-1 text-white/30 transition-colors hover:bg-white/5 hover:text-white"><Pencil size={13} /></button>
              <button onClick={() => remove(c)} aria-label="Excluir cargo" className="rounded-full p-1 text-white/30 transition-colors hover:bg-white/5 hover:text-red-400"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-xl space-y-2.5">{["NotificaÃ§Ãµes", "PreferÃªncias da equipe", "IntegraÃ§Ãµes"].map((s) => (
        <div key={s} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div><p className="text-sm font-medium text-white">{s}</p><p className="text-2xs text-white/40">Em breve</p></div>
          <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-2xs text-white/35">em breve</span>
        </div>
      ))}</section>

      {editCargo && <EditCargoDialog cargo={editCargo} onClose={() => setEditCargo(null)} onSaved={load} />}
    </div>
  );
}