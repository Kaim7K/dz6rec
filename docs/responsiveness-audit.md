# Revisão de responsividade — 15/10/2026

> Registro histórico: esta reformulação foi desfeita a pedido do usuário em 15/10/2026. O visual anterior, baseado em `b11349b`, voltou ao site pelo deployment `dpl_B3r7PDGLSz3QPtn6z8na51zEn95m`. As correções de upload e notificações foram preservadas. Lint, build e os 17 testes de regressão passaram após a restauração.

## Correções

- Layouts orientados pela largura útil do painel, considerando a barra lateral, com container queries.
- Cabeçalho do projeto reorganizado: capa, resumo e ações equilibrados, progresso ocupando toda a largura e três categorias alinhadas quando há espaço.
- Faixas com layouts compacto, intermediário e completo. Colunas do cabeçalho alinhadas às linhas, status sem quebra desnecessária e duração desconhecida representada por um traço.
- Player móvel com título e artista em uma linha própria, controles e timeline separados. Espaço inferior reservado para não ocultar o final da página.
- Grids de projetos e artistas calculados pela largura disponível. Tabela de usuários substituída por cards antes de ficar apertada; nomes extensos não invadem as ações.
- Painéis de início, tarefas, checklist e operação adaptados ao conteúdo disponível. Responsáveis do checklist abaixo do texto, com contador para participantes adicionais.
- Histórico e templates suportam textos sem espaços. Ações dos cards de projeto aparecem também durante navegação pelo teclado.
- `.vercelignore` exclui capturas, arquivos locais de ambiente, documentação e testes do pacote de deploy.

## Validação

| Verificação | Resultado |
| --- | --- |
| Capturas em Chromium | 396, sem problemas detectados pelos verificadores |
| Larguras | 360, 390, 768, 938, 1024, 1280 e 1440 px |
| Acessibilidade automatizada | 40 verificações, nenhuma violação nos critérios selecionados |
| Smoke test móvel | Criar/editar artista e projeto, foto, selects, faixa e conclusão de tarefa aprovados |
| Upload, salvamento e rotas | 17 testes aprovados |
| Lint e build | Aprovados; permanece o aviso conhecido de tamanho do bundle |
| Interface publicada | 24 combinações de página/largura aprovadas, além de modal e player em três larguras |

Cobertura: início, projetos, artistas, tarefas, templates, usuários, configurações, cinco abas de projeto, autenticação, recuperação de senha, estados de acesso, páginas vazias, modais, menus e nomes extensos. As capturas também foram inspecionadas visualmente, incluindo a largura da referência enviada.

Os testes locais usam dados simulados descartáveis. A conferência do JavaScript/CSS publicados intercepta as APIs com respostas sintéticas: não valida o backend autenticado e não escreve dados reais. Viewports de Chromium não substituem testes em dispositivos físicos ou outros motores de navegador.

## Publicação e reprodução

Publicado em https://dz6rec.vercel.app, deployment `dpl_94LDhEaYoP7p8aawLgo75S2hcgL3`. Nenhuma regra de negócio, autenticação ou integração foi alterada nesta revisão.

Com o servidor Vite em `127.0.0.1:5173`, execute `npm run audit:visual`, `npm run audit:a11y` e `npm run test:ui`. A conferência da interface publicada pode ser repetida com `node scripts/deployed-ui-audit.mjs`. Evidências locais em `artifacts/visual-audit/`.
