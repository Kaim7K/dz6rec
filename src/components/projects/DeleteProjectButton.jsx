import React, { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteProjectCascade } from "@/lib/projects";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeleteProjectButton({ project, onDeleted, className, children }) {
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    setLoading(true);
    await deleteProjectCascade(project.id);
    setLoading(false);
    onDeleted?.();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
          }}
          aria-label={`Excluir ${project.name}`}
          className={cn("inline-flex items-center justify-center gap-2 rounded-md text-white/65 transition-colors hover:bg-red-500/10 hover:text-red-300", className)}
        >
          {children || <Trash2 size={14} />}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/[0.08] bg-popover text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
          <AlertDialogDescription className="text-white/55">
            Tem certeza que deseja excluir <span className="font-medium text-white">{project.name}</span>? Essa ação também remove faixas, tarefas, arquivos, mensagens e histórico vinculados ao projeto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={remove} disabled={loading} className="bg-red-600 text-white hover:bg-red-700">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
