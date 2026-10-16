import React from 'react';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import { deleteProjectCascade } from '@/lib/projects';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DeleteProjectButton({ project, onDeleted, className = "", children = undefined }) {
  return <DeleteConfirmation title="Excluir projeto" onConfirm={() => deleteProjectCascade(project.id)} onDeleted={onDeleted} trigger={
    <button type="button" onClick={event => event.stopPropagation()} aria-label={`Excluir ${project.name}`} title="Excluir projeto" className={cn('inline-flex items-center justify-center gap-2 rounded-md text-white/65 transition-colors hover:bg-red-500/10 hover:text-red-300', className)}>{children || <Trash2 size={14} />}</button>
  }>Tem certeza que deseja excluir <span className="font-medium text-white">{project.name}</span>? Essa ação também remove faixas, tarefas, arquivos, mensagens e histórico vinculados ao projeto.</DeleteConfirmation>;
}
