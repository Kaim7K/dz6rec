# Refinamento da interface

Direção: painel de gravadora sóbrio, compacto e centrado nas capas. A paleta escura e vermelha e a marca DZ6 foram preservadas.

- Inter unifica a tipografia da interface; Montserrat fica na assinatura da marca. Títulos, navegação, metadados e labels têm pesos e hierarquia definidos.
- Fundos sólidos substituem grades, gradientes e brilhos decorativos. Bordas delimitam superfícies independentes; divisórias organizam seu conteúdo.
- Métricas formam uma faixa de leitura, sem uma caixa e um ícone colorido para cada número.
- Capas mantêm proporção 1:1 e tamanho limitado. O progresso fica abaixo da capa e do resumo, separado por uma linha.
- Lista de faixas com colunas mais espaçadas, cabeçalhos em caixa normal, título com versão e status com ponto e texto.
- Catálogos mantêm as imagens estáveis, sem zoom ou camadas decorativas. Ações continuam disponíveis por hover, foco e toque.
- Kanban usa superfícies neutras, status no indicador e metadados sem uma sequência de badges. Atrasos mantêm sinalização própria.
- Quando empilhadas, as etapas do Kanban usam altura compacta. No desktop, mantêm colunas alinhadas. Os botões de arraste permitem iniciar o movimento por teclado e ponteiro.
- Modais e confirmações compartilham superfície, bordas, título e ações. O rodapé mantém as ações acessíveis durante a rolagem, sem padding duplicado.
- Inputs, selects, upload, remoção de imagens, mensagens e permissões preservam seu comportamento.

## Verificação

A auditoria visual local percorreu 183 capturas em 360, 390, 768, 1024 e 1440 px, sem falhas detectadas. A acessibilidade passou em 40 cenários com axe. A revisão final inclui novamente 360, 768 e 1440 px após os ajustes de rodapé e densidade.

Os testes de criação/edição, upload simulado, conclusão de tarefas, versões, revisões e menus foram executados com dados descartáveis. A proporção da capa, nomes longos e redimensionamento foram verificados em dez larguras de 360 a 1920 px. `npm run lint` e `npm run build` passaram; permanece o aviso conhecido de tamanho do bundle. Os problemas de tipagem existentes dos componentes compartilhados não foram tratados nesta revisão visual.

Capturas locais: `artifacts/visual-audit/modern/` e `artifacts/visual-audit/modern-final/` (ignoradas pelo Git).

`node scripts/drag-handles-smoke.mjs` verifica por teclado a persistência da mudança de etapa de uma tarefa e da reordenação das faixas, usando apenas dados locais descartáveis.
