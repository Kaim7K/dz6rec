import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/api/appClient";
import { sanitizeReturnTo } from "@/lib/authReturnTo";
import AuthLayout from "@/components/AuthLayout";

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
    <AuthLayout title={error ? "Não foi possível entrar" : "Concluindo login"} subtitle="Acesso à equipe DZ6" footer={null}>
      {error ? (
        <div className="text-center">
          <p role="alert" className="dz-form-error mb-4">{error}</p>
          <Link to="/login" className="text-red-300 font-medium hover:underline">Voltar para o login</Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Concluindo login...
        </div>
      )}
    </AuthLayout>
  );
}
