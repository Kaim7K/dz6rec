# Responsividade do sistema

As grades respondem ao espaco disponivel dentro do aplicativo, considerando a largura ocupada pela navegacao lateral. A identidade escura, a paleta e os fluxos existentes foram preservados.

## Ajustes

- Inicio: destaque com uma, duas ou tres areas conforme o espaco; metricas e paineis com largura minima legivel.
- Projetos e artistas: catalogos com colunas automaticas; nomes longos respeitam os limites dos cards.
- Usuarios: tabela somente quando cabe; cards adaptativos nas demais larguras; convite com distribuicao propria.
- Tarefas e checklist: colunas baseadas no conteudo disponivel, textos extensos quebram dentro dos cards.
- Projeto: cabecalho adaptativo; faixas com formato compacto no celular, colunas reduzidas nas telas intermediarias e waveform nas maiores; operacao e estatisticas sem colunas prematuras.
- Formularios: campos distribuidos pela largura do formulario. Modais conservam rolagem, fechamento e acoes acessiveis em janelas baixas.
- Selects e popovers: limites baseados no espaco realmente disponivel; rolagem e margem nas bordas.
- Navegacao e player: menu lateral rolavel em telas baixas; player com controles de toque, identificacao acessivel e espaco reservado no fim da pagina.
- Cargos e metadados: limites de largura para nomes extensos; texto legivel mantendo as cores identificadoras.

## Verificacao reproduzivel

Todos os testes usam dados sinteticos, sem gravar em APIs reais.

- `node scripts/design-audit.mjs`: paginas, formularios, confirmacoes, abas, calendario, selects, menus, navegacao e player.
- `DESIGN_WIDTHS` configura larguras e `DESIGN_HEIGHT` permite testar janelas baixas.
- `AUDIT_URL=https://dz6rec.vercel.app` com `AUDIT_PUBLISHED=1` verifica os assets publicados, interceptando todas as chamadas `/api` com respostas sinteticas.
- `node scripts/responsive-stress.mjs`: 120 verificacoes em dez tamanhos, com catalogos maiores, nomes sem espacos, mensagens e tarefas extensas.
- `node scripts/accessibility-audit.mjs`: 40 verificacoes de acessibilidade.
- `node scripts/ui-smoke.mjs`: cadastro e edicao de artista e projeto, upload, faixa e conclusao de tarefa.
- `node scripts/track-menu-smoke.mjs`: abertura, limites, teclado, troca de versao e persistencia do titulo em cinco larguras.
- `npm run lint` e `npm run build`.

As capturas e relatorios ficam em `artifacts/visual-audit/`, sem serem enviados no deploy.
