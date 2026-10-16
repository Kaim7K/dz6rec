import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

export default function DeleteConfirmation({ trigger, title, children, onConfirm, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const remove = async event => {
    event.preventDefault(); if (loading) return;
    setLoading(true); setError('');
    try { await onConfirm(); setOpen(false); onDeleted?.(); }
    catch (err) { setError(err.message || 'Não foi possível excluir. Tente novamente.'); }
    finally { setLoading(false); }
  };
  return <AlertDialog open={open} onOpenChange={value => { if (!loading) { setOpen(value); setError(''); } }}>
    <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
    <AlertDialogContent aria-busy={loading}>
      <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription className="[overflow-wrap:anywhere]">{children}</AlertDialogDescription></AlertDialogHeader>
      {error && <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200 [overflow-wrap:anywhere]">{error}</p>}
      <AlertDialogFooter><AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={remove} disabled={loading} className="bg-red-600 text-white hover:bg-red-700">{loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}{loading ? 'Excluindo...' : 'Excluir'}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
