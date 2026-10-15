import React from "react";
import { Clock3, LogOut, ShieldAlert } from "lucide-react";
import { apiClient } from "@/api/appClient";

export default function AccountAccessStatus({ user }) {
  const pending = user?.status === "pendente";
  const Icon = pending ? Clock3 : ShieldAlert;

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col items-center justify-center text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/12 text-red-300 ring-1 ring-primary/20">
          <Icon size={24} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
          {pending ? "Cadastro aguardando aprovação" : "Acesso desativado"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          {pending
            ? "Sua conta foi criada, mas um superadmin precisa aprovar seu acesso antes de liberar o painel."
            : "Sua conta não está ativa. Fale com um superadmin para revisar o acesso."}
        </p>
        <div className="mt-5 w-full rounded-lg border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-left shadow-soft">
          <p className="text-sm font-semibold text-white">{user?.full_name || "Conta DZ6"}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => apiClient.auth.logout("/login")}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut size={15} />Sair
        </button>
      </div>
    </div>
  );
}
