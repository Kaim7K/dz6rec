# Refinamento visual — 15/10/2026

Esta revisão parte do visual restaurado, mantendo Montserrat, tons escuros, vermelho da marca, navegação e organização das páginas. O foco é padronização e acabamento, sobretudo nos modais, sem substituir o sistema por outro layout.

## Alterações

- Modais com título, descrição e ações no mesmo padrão; áreas de rolagem contidas, fechamento sempre acessível e rodapé de ações fixado ao rolar formulários extensos.
- Campos e selects com alturas, bordas e foco coerentes. Labels conectadas aos controles pelo componente `FormField` compartilhado.
- Upload com seleção acessível por teclado, prévia, nome truncado com título completo, substituição e remoção separadas. Mantida a confirmação da remoção ao salvar.
- Editor de cargos com títulos secundários discretos, chips legíveis e ações consistentes com os demais editores.
- Tipografia e cores de texto secundário unificadas. Vermelho de botões preservado; textos de destaque usam tons com contraste suficiente.
- Editor de templates corrigido em telas estreitas. Página 404 em português e no tema do sistema.
- Nomes acessíveis adicionados aos controles de ícones, selects e tarefas. Dados, permissões e integrações não foram modificados.

## Evidências

- 145 capturas em Chromium, em 360, 390, 768, 1024 e 1440 px, sem overflow ou problemas de enquadramento detectados pelos verificadores. Inclui páginas, cinco abas de projeto, formulários, confirmação de exclusão e drawer de cargos. Capturas também inspecionadas visualmente.
- 40 verificações axe, sem violações nos critérios A/AA selecionados.
- Smoke test de criar/editar artista e projeto, foto, selects, faixa e conclusão de tarefa aprovado.
- Remover imagens, cancelar, descartar substituição, salvar e recarregar verificados para artistas, projetos e usuários em celular e desktop.
- 17 testes de upload, salvamento e rotas aprovados. Lint e build aprovados; permanece o aviso conhecido de tamanho do bundle.

Os testes usam dados simulados descartáveis. A conferência do site publicado intercepta APIs com respostas sintéticas para verificar os arquivos publicados sem modificar registros reais. Essas verificações não equivalem a testes completos do backend, de dispositivos físicos ou de outros motores de navegador.

Publicado em https://dz6rec.vercel.app pelo deployment `dpl_AzX3TtX6E8qC6a5GLc4y9iUCAW7F`.

Para repetir: `node scripts/design-audit.mjs`, `npm run audit:a11y`, `npm run test:ui`, `node scripts/image-removal-smoke.mjs` e `node scripts/deployed-ui-audit.mjs`. As primeiras verificações requerem o Vite em `127.0.0.1:5173`.
