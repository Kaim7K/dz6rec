import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Pencil, Plus, ShieldCheck, Shuffle, Trash2 } from "lucide-react";
import CargoBadge from "@/components/CargoBadge";
import EditCargoDialog, { ColorSelect, randomCargoColor } from "@/components/cargos/EditCargoDialog";

export default function Configuracoes() {
  const [me, setMe] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(() => randomCargoColor());
  const [editCargo, setEditCargo] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiClient.auth.me().then((m) => { setMe(m); setLoading(false); }).catch(() => setLoading(false));
    apiClient.entities.Cargo.list().then(setCargos).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-white/40">Carregando...</p>;
  if (me?.permissao !== "superadmin") return (
    <div className="dz-card mx-auto max-w-md p-7 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/[0.05]"><ShieldCheck className="text-white/50" /></div>
      <h1 className="mt-4 font-display text-2xl font-medium text-white">Área restrita</h1>
      <p className="mt-2 text-sm text-white/50">Somente a administração pode configurar o painel.</p>
    </div>
  );

  const add = async (e) => { e.preventDefault(); if (!name.trim()) return; await apiClient.entities.Cargo.create({ name: name.trim(), color }); setName(""); setColor(randomCargoColor()); load(); };
  const remove = async (c) => { await apiClient.entities.Cargo.delete(c.id); load(); };

  return (
    <div className="dz-page">
      <div><p className="dz-kicker">Identidade</p><h1 className="dz-page-title">Configurações</h1><p className="dz-page-subtitle">Preferências do painel da gravadora.</p></div>

      <section className="dz-card p-5">
        <h2 className="font-display text-lg font-bold text-white">Cargos & badges</h2>
        <p className="mt-1 text-sm text-white/45">Defina os cargos da equipe. Eles aparecem como badges ao atribuir tarefas e nos perfis.</p>
        <form onSubmit={add} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo cargo (ex. Produtor Musical)" className="h-11 flex-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-4 text-sm outline-none transition focus:border-primary/45" />
          <div className="flex items-center gap-2">
            <ColorSelect value={color} onChange={setColor} />
            <button type="button" onClick={() => setColor(randomCargoColor())} className="dz-icon-button h-10 w-10" aria-label="Sortear cor">
              <Shuffle size={15} />
            </button>
          </div>
          <button className="dz-primary-button"><Plus size={16} />Adicionar</button>
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

      <section className="max-w-xl space-y-2.5">{["Notificações", "Preferências da equipe", "Integrações"].map((s) => (
        <div key={s} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 shadow-soft">
          <div><p className="text-sm font-medium text-white">{s}</p><p className="text-2xs text-white/40">Em breve</p></div>
          <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-2xs text-white/35">em breve</span>
        </div>
      ))}</section>

      {editCargo && <EditCargoDialog cargo={editCargo} onClose={() => setEditCargo(null)} onSaved={load} />}
    </div>
  );
}
