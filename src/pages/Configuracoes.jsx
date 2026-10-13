import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Loader2, Pencil, Plus, RefreshCw, ShieldCheck, Shuffle, Trash2 } from "lucide-react";
import CargoBadge from "@/components/CargoBadge";
import EditCargoDialog, { ColorSelect, randomCargoColor } from "@/components/cargos/EditCargoDialog";

export default function Configuracoes() {
  const [me, setMe] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(() => randomCargoColor());
  const [editCargo, setEditCargo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadSending, setReloadSending] = useState(false);
  const [reloadMessage, setReloadMessage] = useState("");

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
  const requestGlobalReload = async () => {
    if (reloadSending) return;
    setReloadSending(true);
    setReloadMessage("");
    try {
      await apiClient.entities.SystemFlag.create({
        key: "global_reload",
        nonce: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        requested_by_id: me?.id,
        requested_by_name: me?.full_name || me?.email || "Superadmin",
      });
      setReloadMessage("Reload enviado para todos os usuarios.");
    } catch (err) {
      setReloadMessage(err.message || "Nao foi possivel enviar o reload.");
    } finally {
      setReloadSending(false);
    }
  };

  return (
    <div className="dz-page">
      <div><p className="dz-kicker">Identidade</p><h1 className="dz-page-title">Configurações</h1><p className="dz-page-subtitle">Preferências do painel da gravadora.</p></div>

      <section className="dz-card p-5">
        <h2 className="font-display text-lg font-bold text-white">Cargos & badges</h2>
        <p className="mt-1 text-sm text-white/45">Defina os cargos da equipe. Eles aparecem como badges ao atribuir tarefas e nos perfis.</p>
        <form onSubmit={add} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo cargo (ex. Produtor Musical)" className="dz-input h-11 flex-1 px-4" />
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

      <section className="dz-card max-w-xl p-5">
        <h2 className="font-display text-lg font-bold text-white">Controle do painel</h2>
        <p className="mt-1 text-sm text-white/45">Force a atualizacao da sessao de todos os usuarios conectados.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={requestGlobalReload} disabled={reloadSending} className="dz-primary-button">
            {reloadSending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Recarregar todos
          </button>
          {reloadMessage && <p className="text-sm text-white/45">{reloadMessage}</p>}
        </div>
      </section>

      <section className="max-w-xl space-y-2.5">{["Notificações", "Preferências da equipe", "Integrações"].map((s) => (
        <div key={s} className="dz-card flex items-center justify-between p-4">
          <div><p className="text-sm font-medium text-white">{s}</p><p className="text-2xs text-white/40">Em breve</p></div>
          <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-2xs text-white/35">em breve</span>
        </div>
      ))}</section>

      {editCargo && <EditCargoDialog cargo={editCargo} onClose={() => setEditCargo(null)} onSaved={load} />}
    </div>
  );
}
