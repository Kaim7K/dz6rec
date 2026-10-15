import React from "react";
import { ShieldAlert } from "lucide-react";

export default function UserNotRegisteredError() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-4 py-8">
      <section className="dz-card w-full max-w-md p-6 sm:p-8">
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-lg border border-amber-300/20 bg-amber-300/10 text-amber-300"><ShieldAlert size={22} /></div>
        <h1 className="font-display text-xl font-semibold">Acesso restrito</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Sua conta ainda não está cadastrada neste sistema. Entre em contato com a administração para solicitar acesso.</p>
        <div className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-muted-foreground">
          <p className="font-medium text-white/85">Se você já tem acesso:</p>
          <ul className="mt-2 list-inside list-disc space-y-2"><li>Confira se está usando a conta correta.</li><li>Peça à administração para revisar seu cadastro.</li><li>Tente sair e entrar novamente.</li></ul>
        </div>
      </section>
    </div>
  );
}
