import React from "react";
import dz6ProfileLogo from "@/assets/dz6-profile.png";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md min-w-0">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-white/10 bg-black shadow-glow">
            <img
              src={dz6ProfileLogo}
              alt="DZ6"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="break-words font-display text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 break-words text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-lg border border-white/[0.075] bg-white/[0.035] p-5 shadow-pop backdrop-blur sm:p-6">
          {children}
        </div>
        {footer && (
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
    </div>
  );
}
