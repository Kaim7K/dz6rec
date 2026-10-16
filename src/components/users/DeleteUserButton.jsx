import React from 'react';
import { apiClient } from '@/api/appClient';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import { Trash2 } from 'lucide-react';

export default function DeleteUserButton({ user, onDeleted }) {
  return <DeleteConfirmation title="Excluir usuário" onConfirm={() => apiClient.entities.User.delete(user.id)} onDeleted={onDeleted} trigger={
    <button type="button" aria-label="Excluir usuário" className="rounded-full p-2 text-stage-muted transition-colors hover:bg-red-500/10 hover:text-red-300"><Trash2 size={16} /></button>
  }>Tem certeza que deseja excluir <span className="font-medium text-white">{user.full_name || user.email}</span>? Essa ação não pode ser desfeita.</DeleteConfirmation>;
}
