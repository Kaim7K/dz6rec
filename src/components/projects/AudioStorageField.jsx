import React, { useEffect, useRef, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import Field from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AudioStorageField({ value, onChange, disabled }) {
  const [availability, setAvailability] = useState({ enabled: false, connected: false });
  const [error, setError] = useState("");
  const popup = useRef(null);

  useEffect(() => {
    let active = true;
    const refresh = () => apiClient.drive.status().then(status => {
      if (active) setAvailability(status);
    }).catch(() => {});
    const onConnected = event => {
      if (event.origin !== window.location.origin || event.source !== popup.current || event.data?.type !== "dz6-drive") return;
      if (!event.data.connected) setError("A conexão não foi concluída. Tente novamente com a mesma conta Google.");
      else setError("");
      refresh();
    };
    refresh();
    window.addEventListener("message", onConnected);
    return () => {
      active = false;
      window.removeEventListener("message", onConnected);
      popup.current?.close();
    };
  }, []);

  const connect = async () => {
    setError("");
    popup.current = window.open("about:blank", "dz6-drive-connect", "popup,width=560,height=720");
    if (!popup.current) return setError("Permita a abertura da janela para conectar seu Drive.");
    try {
      const { url } = await apiClient.drive.connect();
      popup.current.location.href = url;
    } catch (error) {
      popup.current.close();
      setError(error.message);
    }
  };

  if (!availability.enabled) return null;
  return (
    <div className="space-y-2">
      <Field label="Armazenamento do áudio">
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="blob">Armazenamento da DZ6</SelectItem>
            <SelectItem value="drive">Salvar no meu Drive</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {value === "drive" && <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">{availability.connected ? "Drive conectado. O áudio ocupará espaço na sua conta." : "Conecte sua conta Google antes de enviar."}</span>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={connect}>
          {availability.connected ? "Reconectar Drive" : "Conectar Drive"}
        </Button>
      </div>}
      {error && <p role="alert" className="text-xs text-red-200">{error}</p>}
    </div>
  );
}
