# Artistas, contas e atribuicoes

- `Artist.user_id` referencia uma conta de `User`, selecionada no cadastro ou na edicao do artista. Vazio indica ausencia de vinculo.
- O dono do projeto e derivado de `Project.main_artist_id`. A conta vem do `user_id` do artista atual, sem copiar um dono independente para o projeto. Trocar o artista ou seu vinculo atualiza a exibicao automaticamente.
- O vinculo nao altera autenticacao, cargos ou permissoes do usuario.
- O aviso de uma tarefa sem responsavel e independente do dono do projeto. A operacao usa os campos singulares e arrays de responsaveis existentes.
- A acao Atribuir abre um formulario, le a tarefa atual antes de salvar, preserva o limite existente de dois responsaveis, registra historico e notifica o usuario. Falhas de notificacao nao desfazem uma atribuicao salva.
- As demais acoes da operacao abrem a tarefa correspondente, focam o formulario de arquivos ou mudam a aba, sem recarregar a pagina.
- A persistencia utiliza os endpoints genericos de registros JSON existentes, sem migracao de schema.

`node scripts/artist-assignment-smoke.mjs` testa criacao, edicao, persistencia e cancelamento do vinculo, troca automatica de dono pelo artista, atribuicao sem recarga, falha e nova tentativa, falha de notificacao, formatos antigos e arrays de responsaveis e navegacao ate a tarefa. Tambem verifica limites dos modais e acessibilidade em 360, 768 e 1440px.

Para verificar assets publicados sem modificar dados reais, use `AUDIT_URL=https://dz6rec.vercel.app` e `AUDIT_PUBLISHED=1`. Todas as requisicoes `/api` desse teste recebem respostas sinteticas.
