# Auditoria visual e de usabilidade

Escopo desta rodada: apresentação, composição dos componentes, acessibilidade e adaptação ao espaço disponível. Nenhuma alteração em APIs, chamadas de integração, regras de negócio, dados, permissões, autenticação ou rotas.

## Ajustes

- Configurações usa largura consistente e grade por espaço disponível: descrição e controles em colunas no desktop, blocos empilhados em telas menores. Cargos têm ações alinhadas e áreas de clique maiores.
- Histórico reúne eventos numa linha do tempo, com leitura contínua e suporte a textos extensos.
- Checklist mantém a densidade dos demais módulos: títulos menores, campos e ações proporcionais e colunas compactas quando empilhadas.
- Conversa usa contraste discreto, mensagens com quebra segura de palavras, separadores de datas e área de mensagens com rolagem própria. Eventos de envio e menções permanecem iguais.
- Versões da faixa usam divisórias em vez de cartões sobrepostos. Nomes, seleção, upload e revisão mantêm o fluxo existente.
- Modais de usuário e cargos compartilham a hierarquia de títulos. Seletores respeitam a largura do modal sem comprimir o ícone.
- Editor de templates comporta nomes extensos e subtarefas aninhadas; a indentação visual respeita o espaço disponível. As ações e o salvamento automático não foram modificados.
- Os carregamentos já existentes no painel, projeto, tarefas, usuários e configurações usam um skeleton compartilhado, com anúncio acessível e respeito à preferência por movimento reduzido.
- A tela de falha no retorno do Google recebeu hierarquia, mensagem e ação de retorno consistentes; a lógica de autenticação permanece intacta. O drawer respeita movimento reduzido.
- Capas 1:1, identidade escura e vermelha, componentes de upload e remoção de imagens foram preservados.

## Verificação

- Auditoria geral: 183 capturas em 360, 390, 768, 1024 e 1440 px, sem falhas detectadas.
- Auditoria adicional: 113 capturas em 360 e 1440 px, incluindo estados vazios, validação, acesso, templates preenchidos e cargos descontinuados, sem falhas detectadas. Os seletores antigos do script foram alinhados aos nomes atuais dos controles e à animação do drawer.
- Conteúdo extremo: 120 verificações em dez resoluções, incluindo 844 × 390 px, sem falhas detectadas.
- Modais com conteúdo longo: 32 verificações em 360 × 844, 390 × 844, 768 × 600 e 1440 × 1000 px, incluindo template preenchido e oito níveis de subtarefas. Sem overflow horizontal ou ações fora da viewport nos cenários testados.
- Carregamento: oito cenários com respostas simuladas atrasadas, em 360 e 1440 px; anúncio acessível, skeleton sem animação sob movimento reduzido e conteúdo final verificados.
- Acessibilidade: 40 verificações axe, sem violações nos cenários e regras selecionados.
- A apresentação de falha no retorno do Google passou em mais duas verificações axe, no celular e no desktop.
- Fluxos com dados locais descartáveis: criar/editar artista e projeto, upload simulado, adicionar faixa, concluir tarefa, gerenciar versões, aprovar/solicitar ajustes e arrastar tarefas e faixas por teclado.
- `npm run lint`, `npm run build` e `git diff --check` aprovados. O build mantém o aviso conhecido de tamanho do bundle; problemas preexistentes de tipagem não fazem parte desta revisão visual.
- Os fluxos de versões, revisões e recuperação de erro também passaram no site publicado em 360, 768 e 1440 px, usando APIs interceptadas com dados simulados.

As capturas e os relatórios ficam em `artifacts/visual-audit/`, ignorado pelo Git. As validações usam dados simulados; não foram feitas escritas de teste no banco de produção ou em serviços externos.
