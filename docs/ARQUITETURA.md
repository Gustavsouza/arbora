# Arquitetura

## Tecnologias

As versões seguem o ArgusEdu (`argus-edu/package.json`), para os dois projetos andarem juntos.

| Camada | Escolha | Observação |
|---|---|---|
| Interface | React 19.3, TypeScript 5.9 (estrito, `noUncheckedIndexedAccess`) | |
| Build | Vite 6.4 | 6.4.5: corrige alerta de segurança do servidor de desenvolvimento da 6.4.4 |
| Estilo | Tailwind CSS 4.3 com tokens em `src/index.css` | Mesmo padrão do ArgusEdu (`@theme inline`) |
| Componentes | Padrão **shadcn/ui** (cva + clsx + tailwind-merge) com **Radix** (`radix-ui`) para modal e confirmação | Os componentes ficam no projeto (`src/componentes/ui`), como no shadcn |
| Rotas | React Router 7 | Telas carregadas sob demanda (`lazy`) |
| Formulários | React Hook Form + Zod (`@hookform/resolvers`) | O ArgusEdu não usa; foram pedidos na especificação |
| Gráficos | Recharts 3 | Só baixado na tela Relatórios (pacote `graficos`) |
| Datas | date-fns 4 + `Intl` com `America/Sao_Paulo` | |
| Ícones | lucide-react | |
| Avisos | sonner (toasts) | |
| Banco | Supabase (PostgreSQL) via `@supabase/supabase-js` | Único banco |
| Testes | Vitest + PGlite (Postgres real em memória) | Mesmo método do ArgusEdu para testar migration e RLS |
| Fontes | Fraunces (títulos) e Figtree (texto), servidas pelo próprio app (`@fontsource`) | Nada de CDN externa (CSP restrita) |

O ArgusEdu desenha gráficos em SVG próprio e não usa RHF/Zod. Aqui seguimos a especificação (Recharts, RHF, Zod) e não instalamos nada redundante: um só componente de modal (Radix), um só sistema de avisos (sonner).

## Pastas

```
src/
  dominio/        Regras de negócio PURAS (sem React, sem Supabase), todas testadas
    tipos.ts        Tipos do domínio (Cultura, Plantio, Evento, Colheita, Unidade)
    opcoes.ts       Rótulos das listas (os mesmos valores das CHECKs do banco); NOME_DO_SISTEMA
    datas.ts        "Hoje" em Brasília, idade aproximada, períodos
    calendario.ts   Meses por fase, janelas "dias após o plantio", próximas previsões
    producao.ts     kg (só unidades conversíveis), totais por unidade, mensal, anual, por cultura/destino, comparação
    sugestoes.ts    "O que está acontecendo no pomar?": regras explicáveis (cada aviso tem um motivo)
  validacao/      Esquemas Zod dos formulários (mesmos limites do banco)
  servicos/       Acesso ao Supabase: único lugar que conhece tabelas e colunas
    cliente.ts      Cliente com a chave pública; sem sessão (MVP sem login)
    pomar.ts        Leitura paginada e gravação; converte linhas do banco ↔ domínio
    erros.ts        Erros do banco em frases do dia a dia
  estado/
    pomar.tsx       Context: carrega tudo uma vez e aplica cada gravação na memória
    registro.tsx    Context: abre "Registrar acontecimento/colheita" de qualquer tela
  componentes/
    ui/             Botão, campos, cartões, modal, confirmação, chips, esqueleto, estado vazio
    formularios/    Acontecimento, colheita, plantio, cultura, unidades
    Layout.tsx      Menu lateral (computador) e barra inferior + botão flutuante (celular)
    Historico.tsx   Linha do tempo (editar/excluir com confirmação)
    FaixaDeMeses.tsx, Graficos.tsx, FiltroPeriodo.tsx, Marca.tsx, icones.tsx
  paginas/        Inicio, MeuPomar, CulturaPagina, Calendario, Acontecimentos, Colheitas, Relatorios
supabase/
  migrations/     SQL versionado (0001 = estrutura + dados da planilha)
  tests/          Testes da migration, integridade e RLS em PGlite
```

## Decisões

**Carregar tudo uma vez.** Um sítio tem dezenas de culturas e poucos milhares de registros por ano. O app busca as cinco tabelas em paralelo ao abrir (paginando de 1.000 em 1.000, o limite do Supabase). Depois de gravar, o registro devolvido pelo banco substitui o da memória. Painel, histórico e relatórios se atualizam sem nova consulta. Se o volume crescer muito (vários anos com milhares de colheitas), o caminho é filtrar por ano em `servicos/pomar.ts` ou criar visões agregadas no banco. As telas não mudam.

**Regras importantes no banco.** Datas não futuras (fuso de Brasília), plantio do evento/colheita da mesma cultura (chave estrangeira composta), plantas afetadas ≤ quantidade do plantio, cultura inativa sem registros novos, unidades do sistema protegidas, limites de texto e de números. O frontend valida o mesmo para dar retorno rápido, mas o banco é quem garante.

**Cálculos no domínio.** Os totais e as sugestões são funções puras em `src/dominio`, testadas sem tela nem banco. A conversão para kg usa o `fator_kg` da tabela `unidades_medida`: só kg e g convertem, e nunca se somam unidades diferentes.

**Previsões nunca inventadas.** Os textos da planilha ficam intactos. Os meses só existem quando o texto cita uma estação ou quando o proprietário marca. Ciclos “X–Y dias após a semeadura” só viram janela quando há data de plantio. Toda sugestão do painel tem um “por quê?”.

**Preparado para login futuro sem antecipar complexidade.** O acesso fica todo em `servicos/`. As políticas do MVP têm nome próprio (`mvp_anon_*`) e são trocáveis. Ver [EVOLUCAO_FUTURA.md](EVOLUCAO_FUTURA.md).

## Linguagem da interface

O usuário entende de roça, não de sistemas. As telas usam palavras do dia a dia. O código e o banco mantêm os nomes técnicos, e nenhum nome de tabela ou coluna mudou:

| No código / banco | Na tela |
|---|---|
| cultura (`culturas`) | planta |
| grupo | tipo (Frutífera, Anual…) |
| plantio (`plantios`) | local (“onde está plantada”, “quantos pés”) |
| evento / acontecimento (`eventos`) | anotação · “Anotar o que aconteceu” (rota `/anotacoes`) |
| inativa (`ativo = false`) | arquivada |
| estágio · estado atual | fase da planta · como está |
| intensidade · ação realizada | quanto? · o que você fez |
| destino · unidade | para onde foi · medida |
| meses estimados | aproximado pela estação |
| excluir | apagar |

Texto novo deve seguir essa tabela: frases curtas, sem jargão de sistema (cadastrar, registro, período, indicador), e as previsões sempre como referência (“pode estar florindo”), nunca como certeza.

## Identidade visual

“Diário de cultivo”: fundo bege (`#F5F1E8`), verde folha (`#397A4A`) para ações, verde-escuro (`#183D2B`) no menu e no destaque do início, terra (`#80664B`) e sol (`#E9C46A`). As fases do calendário têm cores distintas: floração amarela, frutificação verde, colheita terracota. Meses **estimados** aparecem listrados, para não parecerem certeza. Os botões têm pelo menos 48 px de altura. No celular, os modais viram folhas que sobem do rodapé, e os selects são nativos, abrindo o seletor do próprio aparelho.

Gráficos: uma série por gráfico, com a cor da identidade. A comparação entre anos usa verde × azul (`#2F6DB0`, tracejado), par validado para daltonismo. Verde × terracota falhou em protanopia. Cada gráfico tem “Ver em tabela” com os mesmos números.

Acessibilidade: rótulos visíveis em todos os campos, erros ligados ao campo (`aria-describedby`), modais com foco preso (Radix), “Ir para o conteúdo”, contraste ≥ 4,5:1 nos textos e respeito a “reduzir movimento”.
