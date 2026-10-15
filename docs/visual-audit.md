# Auditoria visual — DZ6

Revisão realizada em 15 de outubro de 2026. A identidade escura e o vermelho da DZ6 foram preservados.

## Sistema visual

- Montserrat nos títulos e Inter na interface, com pesos e tamanhos estáveis.
- Escala principal de espaçamento de 8, 12, 16, 20, 24 e 32 px; controles compactos mantêm espaçamento próprio.
- Superfícies discretas, bordas sutis e raios definidos por tokens. Removidos o grid decorativo do fundo, o excesso de brilho e as variações de fonte entre áreas.
- Campos e botões com altura padrão de 40 px no desktop e 44 px no celular. Controles auxiliares têm variantes compactas.
- Texto secundário com contraste maior. Status e avatares preservam os acentos de cor, com texto legível.

## Correções estruturais

| Área | Correções |
| --- | --- |
| Navegação | Alinhamento entre cabeçalho e sidebar, largura de 240 px no desktop, menu móvel com foco contido e Escape, busca com atalho funcional, popovers com posicionamento automático. |
| Painel e catálogo | Hierarquia dos títulos, proporção da capa em destaque, métricas alinhadas, cards e estados vazios consistentes. |
| Projeto | Capa proporcional, ações em duas colunas no celular, cabeçalho e linhas de faixas com a mesma grade, menus sem corte e player com controles identificados. |
| Tarefas e operação | Contraste, identificação acessível dos controles, leitura das atribuições, campos inline e alinhamento dos módulos. |
| Usuários e cargos | Melhor distribuição das colunas, cards móveis, badges legíveis, nomes longos e cargos descontinuados. |
| Templates | Editor sem overflow no celular, nomes de seções e ações identificados, campos consistentes. |
| Autenticação e exceções | Superfícies e controles no mesmo tema; telas de recuperação, callback, 404, conta pendente, conta inativa e área restrita revisadas. O componente de usuário não cadastrado também recebeu revisão de código e acabamento visual. |
| Modais | Cabeçalhos, dimensões, espaçamento, fechamento em português, rolagem limitada à viewport e ações fixadas ao rodapé. |
| Upload | Prévia, nome com truncamento e título completo, tamanho, ações de substituir/remover, foco visível, teclado e respeito ao estado desabilitado. |

O novo `FormField` compartilha o identificador entre label e controle. Skeletons substituem carregamentos sem estrutura. Formulários revisados apresentam falhas de salvamento e liberam o estado de carregamento.

## Validação

- **211 capturas** em **360, 390, 768 e 1440 px**. Nenhum overflow ou erro de execução detectado nos cenários registrados.
- Cobertura: páginas principais, cinco abas do projeto, modais, drawer, menus, calendário, upload, player, validação, sucesso, estados vazios, template com tarefas, cargos descontinuados e estados de acesso.
- **40 verificações com axe**, nos recortes WCAG A/AA selecionados, em 390 e 1440 px: nenhuma violação detectada nos cenários verificados. Isso não substitui uma avaliação manual completa com tecnologias assistivas.
- Smoke test móvel: criar/editar artista com foto, criar/editar projeto, selecionar tipo e artista, adicionar faixa e concluir tarefa. Dados verificados no armazenamento simulado.
- **11 testes de upload/salvamento aprovados.**
- `npm run lint` e `npm run build` aprovados. O build mantém o aviso de tamanho do bundle principal.
- `npm run typecheck` ainda não passa: o repositório já apresentava erros de tipagem. A comparação encontrou 325 diagnósticos na base e 241 após as correções dos componentes compartilhados.

As capturas e os resultados detalhados ficam em `artifacts/visual-audit/`, ignorado pelo Git.

## Reproduzir

Com o servidor local iniciado por `npm run dev`:

```sh
npm run audit:visual
npm run audit:a11y
npm run test:ui
node --experimental-test-module-mocks --test tests/file-upload.test.mjs tests/artist-save.test.mjs
```

Na primeira execução em outra máquina, instale o navegador de teste com `npx playwright install chromium`.

Os testes de navegador aceitam apenas localhost e usam contextos descartáveis. APIs, banco, autenticação, regras de permissão e integrações não foram alterados nesta revisão. O upload real para o Blob e os fluxos externos de autenticação não foram testados; o ambiente local usa mocks. As alterações não foram publicadas em produção.
