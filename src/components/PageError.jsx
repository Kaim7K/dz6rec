import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function PageError({ message, onRetry, retryLabel = 'Tentar novamente' }) {
  return <section role="alert" className="dz-card max-w-lg space-y-3 p-5 sm:p-6">
    <AlertCircle size={22} className="text-red-300" aria-hidden="true" />
    <h1 className="text-lg font-semibold">Não foi possível carregar esta página</h1>
    <p className="text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">{message || 'Verifique sua conexão e tente novamente.'}</p>
    <button type="button" onClick={onRetry} className="dz-ghost-button"><RefreshCw size={15} />{retryLabel}</button>
  </section>;
}
