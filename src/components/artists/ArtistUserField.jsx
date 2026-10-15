import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import Field from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NONE = "__none__";

export default function ArtistUserField({ value, onChange, disabled = false }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiClient.entities.User.list().then(rows => { if (active) setUsers(rows); })
      .catch(() => { if (active) setError("Não foi possível carregar os usuários."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  return (
    <Field label="Usuário vinculado">
      {loading || error ? <Input disabled readOnly value={loading ? "Carregando usuários..." : "Usuários indisponíveis"} /> : <Select value={value || NONE} onValueChange={id => { if (id) onChange(id === NONE ? "" : id); }} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder={loading ? "Carregando usuários..." : "Selecionar usuário"} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Sem usuário vinculado</SelectItem>
          {value && !users.some(user => user.id === value) && <SelectItem value={value} disabled>Usuário indisponível</SelectItem>}
          {users.map(user => <SelectItem key={user.id} value={user.id}>{user.full_name ? `${user.full_name} · ${user.email}` : user.email}</SelectItem>)}
        </SelectContent>
      </Select>}
      {error ? <p role="alert" className="text-xs text-red-200">{error} <button type="button" disabled={disabled} onClick={() => setAttempt(n => n + 1)} className="underline">Tentar novamente</button></p> : <p className="text-xs leading-5 text-muted-foreground">Selecione a conta cadastrada que representa este artista. O artista será o dono dos projetos em que for selecionado.</p>}
    </Field>
  );
}
