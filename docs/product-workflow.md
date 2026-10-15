# Versões, revisão de arquivos e capas

As capas são exibidas em proporção 1:1, inclusive no cabeçalho largo. Novos uploads de capa exigem largura e altura iguais; arquivos existentes não são regravados.

- **Faixas → menu → Gerenciar versões:** nomear áudios, escolher a versão atual e abrir sua revisão. O título da faixa acompanha o nome da versão atual.
- **Operação → Arquivos → Revisar:** solicitar revisão a uma conta ativa, aprovar ou pedir ajustes com comentário obrigatório.
- O dono continua sendo o artista do projeto; execução das tarefas e revisão dos arquivos têm responsáveis próprios.
- Pendências e notificações abrem a tarefa ou arquivo correspondente. Falhas mantêm os campos preenchidos e oferecem nova tentativa.

As decisões são validadas no servidor. Somente o revisor atribuído ou a administração pode decidir. Uma decisão pertence à URL e à solicitação revisadas; trocar o arquivo invalida a revisão anterior. A atualização, o histórico e a notificação usam uma única operação PostgreSQL, com proteção contra alterações concorrentes. Rotas genéricas não permitem forjar os campos da revisão.

## Verificação

```sh
node --test tests/reviews.test.mjs
node --experimental-test-module-mocks --test tests/reviews-route.test.mjs tests/reviews-postgres.test.mjs tests/entity-actions.test.mjs
npm run lint
npm run build
node scripts/product-workflow-smoke.mjs
node scripts/project-header-smoke.mjs
```

Os 30 testes de política/API incluem SQL PostgreSQL real em banco isolado PGlite. Os fluxos de navegador usam contas e dados descartáveis simulados: revisão, ajustes, aprovação, histórico, nomes, seleção de versão, links diretos, validação da capa e recuperação de erros. Cobertura em 360, 768 e 1440 px, com verificações axe nos novos modais; o cabeçalho quadrado também é verificado em dez larguras. A auditoria visual geral local registrou 183 capturas e a auditoria de acessibilidade geral executou 40 verificações.

Não foi feita escrita de teste no banco de produção nem envio real ao Blob nesta rodada. As credenciais de banco disponíveis localmente são placeholders; por isso a persistência foi validada em PostgreSQL isolado. `npm run typecheck` continua bloqueado por problemas de tipagem dos componentes compartilhados do repositório; lint e build passam. O build mantém o aviso de tamanho do bundle principal.

Capturas e logs ficam em `artifacts/visual-audit/`, ignorado pelo Git.
