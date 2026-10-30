# Funcionalidades implementadas

Todas conectadas ao Supabase. Nenhum número da interface é fixo ou fictício: tudo vem dos registros do banco.

## Navegação
- Seis áreas, sem submenus: **Início, Meu pomar, Calendário, Acontecimentos, Colheitas, Relatórios**.
- Celular: barra inferior com ícones e rótulos curtos (“Pomar”, “Diário”…), botão flutuante **+ Registrar acontecimento** e atalho “Colheita” no topo.
- Computador: menu lateral verde-escuro com os botões “Registrar acontecimento” e “Registrar colheita”.
- O registro rápido abre de qualquer tela e, na página de uma cultura, já vem com ela escolhida.

## Início — visão geral
- Abertura com a data, o mês e um resumo do que o calendário prevê (sempre como referência).
- Indicadores: culturas ativas, plantas/touceiras (soma das quantidades informadas e quantos plantios ainda estão sem quantidade), acontecimentos no ano, colheitas no ano, total colhido em kg (só kg e g, com as demais unidades listadas à parte), culturas com floração e com colheita previstas no mês, cadastros a completar.
- **O que está acontecendo no pomar?**
  - Floração esperada. Se já houve registro de floração no mês, mostra o registro e o coloca no topo.
  - Período de colheita: “Esta cultura possui período de colheita previsto. Você já observou frutos maduros?”. Nunca diz que está atrasada.
  - Precisam de atenção: plantios marcados assim e problemas/pragas registrados nos últimos 30 dias.
  - Últimos registros.
  - Culturas sem registros há mais de 60 dias (aviso único e discreto, com a lista ao abrir).
  - Cada aviso tem **“por quê?”** com a origem (texto da planilha, meses estimados ou ajustados, data do plantio).
- **Próximos acontecimentos:** inícios de floração, frutificação e colheita nos próximos 3 meses, marcados como “estimado” ou “pelo plantio”.

## Meu pomar
- Cartões das culturas com grupo, selos do mês (floração/colheita), estágio, “precisa de atenção”, número de plantas e último registro.
- Busca pelo nome (sem diferenciar acento ou maiúscula), filtro por grupo e por situação (ativas, inativas, todas).
- **Nova cultura**, com calendário de meses por fase.
- **Página da cultura:**
  - “Para acompanhar agora”: sugestões explicáveis, inclusive a **idade aproximada** de plantios jovens com data válida e o aviso de cultura sem registros recentes.
  - Calendário de referência: texto original, tipo do padrão, faixa de 12 meses por fase, legenda e cuidados.
  - **Plantios:** cadastrar, editar e excluir (com confirmação); quantidade com botões **− / +**; troca rápida do estado atual; data e idade, sol, local, selo “cadastro a completar”.
  - **Histórico** da cultura (acontecimentos + colheitas) com total colhido, sem misturar unidades.
  - Editar cultura e inativar/reativar.

## Calendário
- **Ano inteiro:** culturas nas linhas, 12 meses nas colunas (cabem na tela do celular), três faixas por mês (floração, frutificação, colheita). Os meses estimados aparecem listrados e o mês atual fica destacado.
- Culturas sem meses fixos aparecem à parte, com o padrão preservado (“Variável”, “Várias épocas”…).
- **Mês a mês:** podem florescer, frutificação esperada e colheita prevista, incluindo janelas calculadas pela data de plantio, mais o que foi **registrado** no mês. Navegação entre meses e anos.
- Filtro por grupo. Os ajustes de meses são feitos em “Editar” na cultura e passam a contar como “ajustados por você”.

## Acontecimentos
- Registro em poucos toques: cultura, **o que aconteceu** (14 botões com ícones, em três grupos) e data com atalhos **Hoje/Ontem**. Em “Mais detalhes” (opcional): plantio, intensidade, nº de plantas, clima (sugestões tocáveis + texto livre), observações e ação realizada.
- Linha do tempo com filtros por cultura, tipo e período (atalhos: tudo, este mês, 30 dias, ano atual, ano anterior, ou datas livres).
- Editar e excluir com confirmação.

## Colheitas
- Registro: cultura, quantidade (aceita vírgula), unidade (sugere a última usada na cultura), data com Hoje/Ontem, destino em botões. Em “Mais detalhes”: plantio, qualidade, plantas colhidas e observações.
- Filtros por cultura, destino e período (começa no ano atual).
- Resumo do filtro: total em kg, nº de registros, total **por unidade** (nunca somadas entre si) e **comparação com o período anterior** de mesma duração.
- Editar e excluir com confirmação.
- **Unidades:** ver as padrão e criar outras (com peso em kg opcional); excluir as criadas, se não estiverem em uso.

## Relatórios
- Filtros de ano e cultura.
- Frases calculadas: “Em 2026 foram colhidos X kg”, “Jabuticaba representa Y% da produção registrada em kg”, “Em setembro foram registrados N acontecimentos…”.
- Indicadores do ano e gráficos (Recharts): produção mensal, comparação com o ano anterior, produção por cultura, por destino e acontecimentos por mês. Todos com dica ao passar o dedo/mouse e **“Ver em tabela”**.
- Estado vazio amigável quando ainda não há registros.

## Transversal
- Validação em todos os formulários (Zod), com as mesmas regras no banco.
- Toasts de sucesso e erro, com erros do banco em frases simples.
- Esqueleto de carregamento, estados vazios explicativos, confirmação antes de excluir.
- Responsivo do celular (360 px) ao computador, sem rolagem lateral.
- Instalação como PWA preparada no nível básico (manifesto e ícone), sem funcionamento offline.

## Ainda não implementado (fora do escopo do MVP)
Login e usuários, várias propriedades, permissões, offline, fotos, identificação individual de árvores, mapa/geolocalização, controle de adubação/irrigação com estoque, despesas, vendas, notificações, IA, previsão de produção e exportação para planilha. Ver [EVOLUCAO_FUTURA.md](EVOLUCAO_FUTURA.md).
