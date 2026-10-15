# Remover imagens anexadas

Disponível nos editores de artistas, projetos (capa) e usuários (foto de perfil). O campo compartilhado mostra a imagem salva e permite substituí-la ou marcá-la para remoção. A remoção grava uma URL vazia somente ao salvar; cancelar não altera o registro. Descartar um arquivo de substituição preserva a imagem salva, a menos que ela já tenha sido marcada para remoção.

A imagem é desvinculada do registro. Não há exclusão física automática do Blob, evitando afetar outras referências ao mesmo arquivo. O visual anterior do site foi mantido.

Verificação: `node scripts/image-removal-smoke.mjs` usa dados locais descartáveis e cobre remoção, cancelamento, descarte de substituição, salvamento e recarregamento para as três entidades em 390 e 1440 px. Para verificar os assets publicados com APIs interceptadas e dados sintéticos, use `AUDIT_URL=https://dz6rec.vercel.app` e `AUDIT_PUBLISHED=1`. Nenhum registro real é alterado nesses testes.

Lint, build e os 17 testes de upload, salvamento e rotas passaram. Publicação: `dpl_HTv3hPQRJQsFGhCuRHubMTUxxdKL`.
