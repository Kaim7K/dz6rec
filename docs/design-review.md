# DZ6 — revisão técnica e direção visual

Revisão em 16/10/2026. As alterações estão no servidor de teste, http://localhost:5173. O build de produção pode ser inspecionado em http://localhost:4173 com os dados locais de demonstração.

## Avaliação visual

A identidade preta e vermelha é adequada a uma ferramenta de produção musical. O aspecto genérico vinha principalmente da composição: duas laterais largas, molduras repetidas, várias ações com o mesmo destaque, descrições institucionais em telas de trabalho e controles que prometiam mais do que faziam. Trocar a fonte ou adicionar efeitos não resolveria esses pontos.

A direção adotada é uma ferramenta de trabalho para um catálogo musical: capas como conteúdo principal, metadados legíveis, controles discretos e informações operacionais confiáveis. A avaliação combina inspeção das telas renderizadas com testes de interação; ausência de overflow, por si só, não é uma avaliação estética.

| Área | Problema observado | Alteração aplicada |
| --- | --- | --- |
| Navegação | Laterais consumiam 528px no desktop, comprimindo o conteúdo. | Navegação principal com 240px e equipe com 224px, mantendo minimização. Cabeçalhos alinhados em 64px. |
| Catálogo | Imagem dentro de borda, dentro de outro card com borda e preenchimento. | Um componente compartilhado para projetos e artistas, com uma moldura para a mídia e metadados no fundo da página. |
| Projeto | Abas em outra caixa competiam com o cabeçalho e os controles. | Abas com seleção por sublinhado. Capa grande e proporção 1:1 preservadas. |
| Ações | Botões vermelhos repetidos disputavam atenção. | Ações administrativas secundárias usam o estilo neutro; vermelho destaca a ação principal e decisões destrutivas. |
| Busca | O atalho exibido não funcionava; a busca encontrava apenas páginas. | Ctrl/⌘ K funcional, projetos e artistas reais do catálogo, ordenação por correspondência, tolerância a acentos, setas/Enter/Escape e foco no artista encontrado. |
| Painel inicial | Ícones variavam por posição, e títulos de tarefas eram usados para adivinhar aprovação. | Ícones de tarefa consistentes e status derivados de prazo/task_status. Estados vazios explícitos e links com destino claro. Nenhum registro ou regra foi alterado. |
| Formulários | Erros de rede podiam aparentar lista vazia ou acesso restrito. | Carregamento, erro, retry e entrada preservada. Exclusões esperam a resposta e mostram falhas no próprio diálogo. |
| Equipe/chat | Redução de opacidade prejudicava os cargos. | Mantidos os 55% solicitados, com cores-base que preservam contraste; hover/foco recuperam opacidade. |

Os formulários mantêm labels explícitos, alinhamento, footer previsível e controles acessíveis. A familiaridade desses padrões é apropriada; o refinamento vem da hierarquia e do comportamento consistente.

### Referências consultadas

- [Google Flow — interface e organização de assets](https://blog.google/innovation-and-ai/models-and-research/google-labs/flow-updates-february-2026/): referência para protagonismo da mídia e trabalho organizado em torno de assets. Também foi inspecionada a página pública do Flow.
- [Linear — projetos](https://linear.app/docs/projects): referência para separação de contexto, propriedades e conteúdo, além de ações associadas ao objeto.
- [Vercel Geist](https://vercel.com/geist/introduction), [tipografia](https://vercel.com/geist/typography): referência para hierarquia, fundamentos e previsibilidade dos componentes.

Essas referências foram estudadas por suas interfaces e materiais públicos. O código interno e a qualidade de engenharia desses serviços não foram auditados. A paleta e a identidade da DZ6 foram preservadas.

### Evidência visual

- [Projeto antes](../artifacts/visual-audit/full-review/1440-project.png) / [projeto refinado](../artifacts/visual-audit/production-build/1440-project.png).
- [Catálogo refinado](../artifacts/visual-audit/production-build/1440-projects.png).
- [Usuários](../artifacts/visual-audit/production-build/1440-users.png).
- [Modal no celular](../artifacts/visual-audit/production-build/390-new-project.png).
- [Busca real no celular](../artifacts/visual-audit/refined/390-search.png).

As capturas de `production-build` usam os arquivos compilados e dados isolados, sem a barra de simulação da versão de desenvolvimento.

## Pendências técnicas corrigidas

1. **Tipagem:** os 446 erros foram resolvidos principalmente com tipos corretos nas primitivas React/Radix, props opcionais, estados, eventos e datas. `checkJs` permaneceu ativo, sem supressões; o ponto de entrada da aplicação também passou a integrar a verificação.
2. **JavaScript:** carregamento separado por rota e SDK de upload carregado somente quando necessário. A Home compilada carregou 477.675 bytes de JavaScript, contra 956.487 bytes da versão publicada usada como referência: redução de aproximadamente 50% no conteúdo JS descomprimido. A medição é de bytes, não uma promessa de redução igual no tempo de carregamento. Nenhum chunk ultrapassa 500KB.
3. **Consultas:** um agendador compartilhado evita callbacks concorrentes e registros repetidos, pausa em abas ocultas e mantém eventos locais entre abas. Notificações usam 15s e sinal global 30s; chat direto usa 4s. Leituras GET simultâneas iguais compartilham uma requisição, com resultados independentes por consumidor, sem cache persistente e com isolamento por token.
4. **Exclusões:** projeto/template e seus registros vinculados são removidos por um único comando PostgreSQL no servidor. Teste com falha real de DELETE confirmou rollback integral. Chamadas individuais e filtradas usam o mesmo fluxo; permissões e exigência de conta ativa foram preservadas. Blobs físicos não são apagados por esse processo, como no fluxo anterior.
5. **Recuperação:** erro temporário no bootstrap do banco pode tentar novamente; rejeições assíncronas de auth/upload/usuários chegam ao tratamento JSON da API. Falhas de módulos de página têm fallback, preservando navegação/chat quando possível.

## Verificação

- `npm run typecheck`, `npm run lint` e `npm run build` aprovados.
- 61 testes unitários/API/PostgreSQL aprovados, incluindo rollback, autorização, privacidade, uploads, recuperação do banco e agendamento de consultas.
- 110 capturas nas larguras 360/768/1440 e 73 capturas adicionais do build nas larguras 390/1440 sem problemas detectados de overflow.
- 40 verificações WCAG e 120 cenários responsivos com conteúdo extremo aprovados.
- Fluxos de versões, aprovação, criação/edição, imagens, atribuição e arraste por teclado verificados. Cabeçalho exercitado de 360 a 1920px.
- Chat e exclusão de projeto/template exercitados no build compilado, passando por HTTP, autenticação e PostgreSQL isolado; mensagens privadas e outro projeto foram preservados.
- Busca real, teclado, leitura GET compartilhada, ausência de cache obsoleto, isolamento entre contas, upload sob demanda, falha de módulo e painel vazio verificados no navegador.

## Limites e próximo critério de qualidade

O redirecionamento Google publicado retornou 302 para `accounts.google.com`, com estado e callback no domínio correto. O endpoint de upload retornou 401 sem autenticação. Não havia navegador conectado ou sessão real disponível para concluir o login Google e transferir um arquivo ao Blob. Esses testes não foram apresentados como concluídos; os fluxos de escrita foram exercitados com dados isolados.

O próximo critério estético é observar o catálogo com capas e fotos reais, uma quantidade representativa de lançamentos e os fluxos da equipe. O logo repetido nas fixtures não representa a variedade visual do catálogo real. A navegação deve continuar discreta, os nomes/versões e responsáveis devem permanecer legíveis, e cada estado precisa explicar o que acontece e qual é a próxima ação. Novos componentes devem reutilizar os padrões compartilhados para conservar esse acabamento.

Esta revisão preserva as regras de autenticação, permissões e integrações, não migra/apaga registros de produção e não publica automaticamente uma nova versão.
