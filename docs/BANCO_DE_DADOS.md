# Banco de dados

PostgreSQL do Supabase, schema `public`. Migration única: `supabase/migrations/0001_estrutura_e_culturas.sql` (estrutura, regras, acesso do MVP e dados da planilha). Identificadores UUID (`gen_random_uuid()`); datas de registro em `date`, de calendário e sem fuso; carimbos em `timestamptz`. “Hoje” é sempre o dia de Brasília (`public.hoje_sp()`).

## Relacionamentos

```
culturas 1 ──< plantios
culturas 1 ──< eventos   >── 0..1 plantios   (o plantio tem de ser da mesma cultura)
culturas 1 ──< colheitas >── 0..1 plantios   (idem)
unidades_medida 1 ──< colheitas
```

## Tabelas

### `culturas`
Espécie ou variedade cultivada (ex.: Jabuticaba).

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid PK | |
| `nome` | text | 2–80, **único** (sem diferenciar maiúsculas/espaços) |
| `grupo` | text | 2–60 (Frutífera, Anual…) |
| `descricao` | text | ≤ 1000 |
| `floracao_esperada`, `colheita_esperada` | text | ≤ 200; **texto original da planilha** |
| `floracao_padrao`, `colheita_padrao` | text | `estacional`, `varias_epocas`, `continua`, `apos_plantio`, `variavel`, `a_confirmar`, `nao_se_aplica` |
| `meses_floracao`, `meses_frutificacao`, `meses_colheita` | smallint[] | só 1–12; o gatilho ordena e tira repetidos |
| `meses_confirmados` | boolean | `false` = estimados pela estação; `true` = ajustados pelo proprietário |
| `floracao_dias_min/max`, `colheita_dias_min/max` | integer | 0–3650, mín ≤ máx; ciclos “após o plantio” |
| `observacoes` | text | ≤ 2000 (coluna “Cuidados / observações”) |
| `ativo` | boolean | culturas não se apagam pela API, só se inativam |
| `created_at`, `updated_at` | timestamptz | `updated_at` por gatilho; `created_at` imutável |

### `plantios`
Grupo de plantas da mesma cultura (ex.: 15 pés de jabuticaba perto do açude). Não é uma árvore individual.

| Coluna | Tipo | Regra |
|---|---|---|
| `cultura_id` | uuid FK → culturas | `on delete restrict` |
| `quantidade` | integer | 1–100.000; **null = ainda não informada** |
| `data_plantio` | date | aproximada; não futura |
| `estagio` | text | `muda_recente`, `jovem`, `em_crescimento`, `adulto` |
| `localizacao` | text | ≤ 120 |
| `exposicao_solar_horas` | numeric(3,1) | 0–24 |
| `estado_atual` | text | `bom`, `florindo`, `frutificando`, `produzindo`, `precisa_atencao` |
| `observacoes` | text | ≤ 2000 |

`unique (id, cultura_id)` é o alvo das chaves compostas de eventos e colheitas.

### `eventos`
| Coluna | Tipo | Regra |
|---|---|---|
| `cultura_id` | uuid FK | obrigatório |
| `plantio_id` | uuid | opcional; FK composta `(plantio_id, cultura_id)`; apagar o plantio mantém o evento (`set null (plantio_id)`) |
| `tipo_evento` | text | `floracao_inicio`, `floracao_pico`, `floracao_fim`, `sem_floracao`, `frutificacao`, `fruto_maduro`, `colheita_inicio`, `colheita_fim`, `problema`, `praga_doenca`, `poda`, `adubacao`, `irrigacao`, `outro` |
| `data_evento` | date | padrão: hoje em Brasília; não futura |
| `intensidade` | text | `fraca`, `moderada`, `forte` |
| `quantidade_plantas_afetadas` | integer | 1–100.000; ≤ quantidade do plantio, quando informada |
| `condicoes_climaticas` | text | ≤ 200 |
| `observacoes`, `acao_realizada` | text | ≤ 2000 / ≤ 1000 |

### `colheitas`
| Coluna | Tipo | Regra |
|---|---|---|
| `cultura_id`, `plantio_id` | | mesmas regras dos eventos |
| `data_colheita` | date | padrão hoje; não futura |
| `quantidade` | numeric(12,3) | > 0 e ≤ 1.000.000 |
| `unidade` | text FK → `unidades_medida.codigo` | |
| `destino` | text | `consumo_familiar`, `venda`, `doacao`, `conserva`, `descarte`, `outro` |
| `qualidade` | text | `otima`, `boa`, `regular`, `ruim` |
| `quantidade_plantas_colhidas` | integer | ≤ quantidade do plantio, quando informada |

### `unidades_medida`
| Coluna | Regra |
|---|---|
| `codigo` (PK) | `^[a-z0-9_]{1,30}$` |
| `nome` | único |
| `fator_kg` | `null` = **nunca** entra em total de kg; kg = 1, g = 0,001 |
| `padrao` | unidades do sistema: não mudam nem se apagam (gatilho) |

As unidades da planilha (`kg`, `g`, `unidades`, `cachos`, `macos`, `litros`, `caixas`) vêm como padrão. O proprietário pode criar outras (ex.: “sacas de 20 kg”), com peso opcional.

## Índices

`culturas (lower(btrim(nome)))` único, `culturas (grupo)`, `plantios (cultura_id)`, `eventos (cultura_id, data_evento desc)`, `eventos (data_evento desc)`, `eventos (plantio_id)` parcial, e os mesmos para `colheitas`, mais `colheitas (unidade)`.

## Gatilhos (regras no banco)

| Gatilho | Regra | Erro |
|---|---|---|
| `tg_atualizado_em` | atualiza `updated_at` e mantém `created_at` | — |
| `tg_culturas_normalizar` | apara nome/grupo; ordena e tira meses repetidos | — |
| `tg_data_nao_futura` | data > hoje em Brasília é recusada | `DATA_NO_FUTURO` |
| `tg_cultura_ativa` | cultura inativa não recebe plantio/evento/colheita | `CULTURA_INATIVA` |
| `tg_plantas_no_plantio` | plantas afetadas/colhidas ≤ quantidade do plantio | `PLANTAS_ACIMA_DO_PLANTIO` |
| `tg_unidade_protegida` | unidade padrão não muda nem se apaga | `UNIDADE_DO_SISTEMA` |

O app traduz esses códigos em frases (`src/servicos/erros.ts`).

## Importação da planilha

### Calendário anual → `culturas` (42)
- Nome, grupo, floração esperada, colheita esperada e “Cuidados / observações” foram copiados **exatamente**.
- A grade Jan–Dez da planilha estava **vazia**: só cor de fundo uniforme, sem marcação de meses. Por isso os meses vêm do texto.
- **Classificação do texto** (`*_padrao`), linha a linha, comentada na migration:
  - cita estação → `estacional`;
  - “Várias floradas/épocas” → `varias_epocas`;
  - “Ao longo do ano”, “Contínua”, “Quase contínua” → `continua`;
  - “X–Y dias após semeadura/plantio” → `apos_plantio`;
  - “Variável”, “conforme…” → `variavel`;
  - “A confirmar” → `a_confirmar`;
  - “Não se aplica…” → `nao_se_aplica`.
- **Meses** só para `estacional`, pelas estações meteorológicas do hemisfério sul: primavera = set–nov, verão = dez–fev, outono = mar–mai, inverno = jun–ago. Ex.: “Primavera–verão” = set a fev. Ficam com `meses_confirmados = false` e aparecem listrados (“estimado pela estação”). Quando o texto principal é “Variável…” (ex.: Abacate: “Variável por cultivar; frequentemente outono–primavera”), **não** viram meses.
- **Dias após o plantio:** Amendoim 25–45 / 90–130; Abóbora 30–60 / 80–120; Milho 45–70 / 70–150 (junta “verde 70–100” e “grão seco 100–150”); Aipim branco e manteiga 240–540 dias (“8–18 meses”, a 30 dias por mês). Almeirão (“semanas após plantio”) não tem número e fica sem janela.
- **Frutificação:** a planilha não tem. Começa vazia em todas as culturas.

### Cadastro de plantas → `plantios` (42)
Só a coluna “Idade/estágio” estava preenchida (“Jovem” em todas). Virou um plantio por cultura com `estagio = 'jovem'`. Quantidade, data, local, sol, estado e observações ficam em branco, e o app mostra “Cadastro a completar”.

### Registro de eventos e Colheitas
Vazios (nas colheitas, só os valores padrão “kg”/“Consumo familiar” das listas, sem data nem quantidade). **Nada importado.** O sistema começa sem produção.

### Listas da planilha
- Destinos: “Consumo familiar, Doação, Conserva/congelamento, Perda, Outro” + “Venda” (pedido na especificação) → `consumo_familiar`, `doacao`, `conserva`, `descarte` (“Perda / descarte”), `outro`, `venda`.
- Estágios: “Muda recente, Jovem, Em crescimento, Florindo, Produzindo, Adulto, Precisa de atenção” foram separados em idade (`estagio`) e situação (`estado_atual`).
- Tipos de evento: os da planilha somados aos da especificação (primeira floração, pico, fim etc.).

### Seed
Por pedido do dono do projeto, os dados iniciais estão **na própria migration 0001**, e não num `seed.sql` à parte. Assim, rodar um arquivo só já deixa o banco pronto para a demonstração.

## Testes do banco

`npm run test:db` aplica a migration num PostgreSQL real em memória (PGlite), simulando os papéis do Supabase e os privilégios que ele dá por padrão em tabelas novas. Os testes conferem os dados importados, todas as regras acima e o acesso anônimo (o que pode e o que não pode). Ver `supabase/tests/migration.test.ts`.
