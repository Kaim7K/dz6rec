import React from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/dz6-profile.png";

export default function PageNotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-6 py-12">
      <div className="w-full max-w-md text-center">
        <img src={logo} alt="DZ6" className="mx-auto mb-8 h-12 w-12 rounded-lg" />
        <p className="text-xs font-medium tracking-widest text-white/50">ERRO 404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-white">Página não encontrada</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/60">O endereço pode ter mudado ou a página não está mais disponível.</p>
        <Link to="/" className="dz-primary-button mt-7">Voltar ao início</Link>
      </div>
    </main>
  );
}
