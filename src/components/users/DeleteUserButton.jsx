import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteUserButton({ user, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const remove = async () => {
    setLoading(true);
    await base44.entities.User.delete(user.id);
    setLoading(false);
    onDeleted();
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" aria-label="Excluir usuário" className="rounded-full p-2 text-stage-muted transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-stage-border bg-stage-card text-stage-ink">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-stage-ink">Excluir usuário</AlertDialogTitle>
          <AlertDialogDescription className="text-stage-muted">
            Tem certeza que deseja excluir <span className="font-medium text-stage-ink">{user.full_name || user.email}</span>? Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-stage-border bg-stage-card text-stage-muted hover:bg-stage-surface hover:text-stage-ink">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={remove} disabled={loading} className="bg-red-600 text-white hover:bg-red-700">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}