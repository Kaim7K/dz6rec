import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/api/appClient";
import { sanitizeReturnTo } from "@/lib/authReturnTo";

export default function GoogleAuthCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("access_token");
    const authError = params.get("error");

    if (authError || !token) {
      setError(authError || "Nao foi possivel concluir o login com Google");
      return;
    }

    apiClient.auth.setToken(token);
    window.location.replace(sanitizeReturnTo(params.get("returnTo")));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {error ? (
        <div className="dz-card w-full max-w-md p-6 text-left">
          <h1 className="text-lg font-semibold tracking-tight text-white">Falha ao entrar com Google</h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-red-200 [overflow-wrap:anywhere]">{error}</p>
          <Link to="/login" className="dz-ghost-button mt-5">Voltar para o login</Link>
        </div>
      ) : (
        <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Concluindo login...
        </div>
      )}
    </div>
  );
}
