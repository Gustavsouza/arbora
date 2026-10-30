-- =====================================================================================================================
-- Arbora — 0001: estrutura do banco, regras de integridade, acesso anônimo do MVP (RLS) e dados da planilha
-- "Calendario Pomar Marechal Floriano.xlsx" (42 culturas, 42 plantios a completar e as unidades de medida).
--
-- Aplicar UMA vez, inteira, no SQL Editor do Supabase (ou `supabase db push`). Fuso de referência: America/Sao_Paulo.
--
-- Como os textos da planilha viraram dados (detalhes em docs/BANCO_DE_DADOS.md):
--   * floracao_esperada / colheita_esperada guardam o texto ORIGINAL, sem alteração.
--   * *_padrao classifica esse texto: estacional, varias_epocas, continua, apos_plantio, variavel, a_confirmar,
--     nao_se_aplica.
--   * meses_* só foram preenchidos quando o texto cita uma estação do ano. Conversão (estações meteorológicas do
--     hemisfério sul): primavera = set–nov, verão = dez–fev, outono = mar–mai, inverno = jun–ago. Esses meses ficam com
--     meses_confirmados = false ("estimado pela estação") até o proprietário ajustar no app.
--   * *_dias_min/max só existem quando o texto traz "X–Y dias (ou meses) após a semeadura/plantio".
--   * A planilha não tem nenhuma informação de frutificação: meses_frutificacao começa vazio.
--   * Abas "Registro de eventos" e "Colheitas" estavam vazias (só os valores padrão "kg"/"Consumo familiar" nas
--     listas): nada foi importado delas. "Cadastro de plantas" só tinha o estágio "Jovem": vira um plantio por
--     cultura, com quantidade e local em branco para o proprietário completar.
-- =====================================================================================================================

-- ---------------------------------------------------------------------------------------------------------------------
-- Funções de apoio
-- ---------------------------------------------------------------------------------------------------------------------

-- "Hoje" no fuso do sítio (o servidor do Supabase roda em UTC: depois das 21h de Brasília, UTC já é amanhã).
create or replace function public.hoje_sp() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

create or replace function public.tg_atualizado_em() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at; -- a data de criação não muda
  return new;
end $$;

-- ---------------------------------------------------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------------------------------------------------

create table public.culturas (
  id                  uuid primary key default gen_random_uuid(),
  nome                text not null check (char_length(btrim(nome)) between 2 and 80),
  grupo               text not null check (char_length(btrim(grupo)) between 2 and 60),
  descricao           text check (char_length(descricao) <= 1000),
  floracao_esperada   text check (char_length(floracao_esperada) <= 200),
  colheita_esperada   text check (char_length(colheita_esperada) <= 200),
  floracao_padrao     text not null default 'a_confirmar',
  colheita_padrao     text not null default 'a_confirmar',
  meses_floracao      smallint[] not null default '{}',
  meses_frutificacao  smallint[] not null default '{}',
  meses_colheita      smallint[] not null default '{}',
  meses_confirmados   boolean not null default false,
  floracao_dias_min   integer,
  floracao_dias_max   integer,
  colheita_dias_min   integer,
  colheita_dias_max   integer,
  observacoes         text check (char_length(observacoes) <= 2000),
  ativo               boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint culturas_floracao_padrao_check check (floracao_padrao in
    ('estacional', 'varias_epocas', 'continua', 'apos_plantio', 'variavel', 'a_confirmar', 'nao_se_aplica')),
  constraint culturas_colheita_padrao_check check (colheita_padrao in
    ('estacional', 'varias_epocas', 'continua', 'apos_plantio', 'variavel', 'a_confirmar', 'nao_se_aplica')),
  constraint culturas_meses_validos check (
    meses_floracao <@ '{1,2,3,4,5,6,7,8,9,10,11,12}'::smallint[]
    and meses_frutificacao <@ '{1,2,3,4,5,6,7,8,9,10,11,12}'::smallint[]
    and meses_colheita <@ '{1,2,3,4,5,6,7,8,9,10,11,12}'::smallint[]),
  constraint culturas_dias_floracao check (
    (floracao_dias_min is null or floracao_dias_min between 0 and 3650)
    and (floracao_dias_max is null or floracao_dias_max between 0 and 3650)
    and (floracao_dias_min is null or floracao_dias_max is null or floracao_dias_min <= floracao_dias_max)),
  constraint culturas_dias_colheita check (
    (colheita_dias_min is null or colheita_dias_min between 0 and 3650)
    and (colheita_dias_max is null or colheita_dias_max between 0 and 3650)
    and (colheita_dias_min is null or colheita_dias_max is null or colheita_dias_min <= colheita_dias_max))
);
create unique index culturas_nome_unico on public.culturas (lower(btrim(nome)));
create index culturas_grupo on public.culturas (grupo);

comment on table public.culturas is 'Espécies/variedades cultivadas no sítio, com as épocas de referência (nunca garantias).';
comment on column public.culturas.meses_confirmados is 'false = meses estimados pela estação descrita na planilha; true = ajustados pelo proprietário.';

-- Grupo de plantas da mesma cultura (ex.: 15 pés de jabuticaba perto do açude). Não é uma árvore individual.
create table public.plantios (
  id                     uuid primary key default gen_random_uuid(),
  cultura_id             uuid not null references public.culturas (id) on delete restrict,
  quantidade             integer check (quantidade between 1 and 100000),   -- null = ainda não informada
  data_plantio           date check (data_plantio >= date '1900-01-01'),     -- aproximada
  estagio                text check (estagio in ('muda_recente', 'jovem', 'em_crescimento', 'adulto')),
  localizacao            text check (char_length(localizacao) <= 120),
  exposicao_solar_horas  numeric(3,1) check (exposicao_solar_horas between 0 and 24),
  estado_atual           text check (estado_atual in ('bom', 'florindo', 'frutificando', 'produzindo', 'precisa_atencao')),
  observacoes            text check (char_length(observacoes) <= 2000),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  -- Alvo das chaves compostas: o plantio citado num evento/colheita tem de ser da MESMA cultura.
  constraint plantios_id_cultura unique (id, cultura_id)
);
create index plantios_cultura on public.plantios (cultura_id);

create table public.eventos (
  id                           uuid primary key default gen_random_uuid(),
  cultura_id                   uuid not null references public.culturas (id) on delete restrict,
  plantio_id                   uuid,
  tipo_evento                  text not null check (tipo_evento in (
                                 'floracao_inicio', 'floracao_pico', 'floracao_fim', 'sem_floracao', 'frutificacao',
                                 'fruto_maduro', 'colheita_inicio', 'colheita_fim', 'problema', 'praga_doenca', 'poda',
                                 'adubacao', 'irrigacao', 'outro')),
  data_evento                  date not null default public.hoje_sp() check (data_evento >= date '1900-01-01'),
  intensidade                  text check (intensidade in ('fraca', 'moderada', 'forte')),
  quantidade_plantas_afetadas  integer check (quantidade_plantas_afetadas between 1 and 100000),
  condicoes_climaticas         text check (char_length(condicoes_climaticas) <= 200),
  observacoes                  text check (char_length(observacoes) <= 2000),
  acao_realizada               text check (char_length(acao_realizada) <= 1000),
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  -- Apagar o plantio mantém o evento (só some o vínculo).
  constraint eventos_plantio_da_cultura foreign key (plantio_id, cultura_id)
    references public.plantios (id, cultura_id) on delete set null (plantio_id)
);
create index eventos_cultura_data on public.eventos (cultura_id, data_evento desc);
create index eventos_data on public.eventos (data_evento desc);
create index eventos_plantio on public.eventos (plantio_id) where plantio_id is not null;

-- Unidades de medida. fator_kg só existe quando a conversão é confiável (kg e g); as demais nunca viram kg.
create table public.unidades_medida (
  codigo      text primary key check (codigo ~ '^[a-z0-9_]{1,30}$'),
  nome        text not null check (char_length(btrim(nome)) between 1 and 30),
  fator_kg    numeric(12,6) check (fator_kg > 0),
  padrao      boolean not null default false,  -- unidades do sistema: não se apagam
  ordem       smallint not null default 100,
  created_at  timestamptz not null default now()
);
create unique index unidades_nome_unico on public.unidades_medida (lower(btrim(nome)));

create table public.colheitas (
  id                           uuid primary key default gen_random_uuid(),
  cultura_id                   uuid not null references public.culturas (id) on delete restrict,
  plantio_id                   uuid,
  data_colheita                date not null default public.hoje_sp() check (data_colheita >= date '1900-01-01'),
  quantidade                   numeric(12,3) not null check (quantidade > 0 and quantidade <= 1000000),
  unidade                      text not null references public.unidades_medida (codigo) on update cascade on delete restrict,
  destino                      text not null default 'consumo_familiar' check (destino in
                                 ('consumo_familiar', 'venda', 'doacao', 'conserva', 'descarte', 'outro')),
  qualidade                    text check (qualidade in ('otima', 'boa', 'regular', 'ruim')),
  quantidade_plantas_colhidas  integer check (quantidade_plantas_colhidas between 1 and 100000),
  observacoes                  text check (char_length(observacoes) <= 2000),
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  constraint colheitas_plantio_da_cultura foreign key (plantio_id, cultura_id)
    references public.plantios (id, cultura_id) on delete set null (plantio_id)
);
create index colheitas_cultura_data on public.colheitas (cultura_id, data_colheita desc);
create index colheitas_data on public.colheitas (data_colheita desc);
create index colheitas_plantio on public.colheitas (plantio_id) where plantio_id is not null;
create index colheitas_unidade on public.colheitas (unidade);

-- ---------------------------------------------------------------------------------------------------------------------
-- Regras de integridade (no banco, valem para qualquer cliente)
-- ---------------------------------------------------------------------------------------------------------------------

create or replace function public.tg_culturas_normalizar() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.nome := btrim(new.nome);
  new.grupo := btrim(new.grupo);
  -- Meses (1–12) sem repetição e em ordem.
  new.meses_floracao := array(select distinct x from unnest(new.meses_floracao) x where x is not null order by x);
  new.meses_frutificacao := array(select distinct x from unnest(new.meses_frutificacao) x where x is not null order by x);
  new.meses_colheita := array(select distinct x from unnest(new.meses_colheita) x where x is not null order by x);
  return new;
end $$;

-- Datas de plantio, evento e colheita não podem estar no futuro (calendário de Brasília).
create or replace function public.tg_data_nao_futura() returns trigger
language plpgsql set search_path = '' as $$
declare
  d date := (to_jsonb(new) ->> tg_argv[0])::date;
begin
  if d is not null and d > public.hoje_sp() then
    raise exception 'DATA_NO_FUTURO' using errcode = 'check_violation';
  end if;
  return new;
end $$;

-- Cultura inativa não recebe plantio, evento ou colheita novos (nem registros movidos para ela).
create or replace function public.tg_cultura_ativa() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.cultura_id is distinct from old.cultura_id then
    if not exists (select 1 from public.culturas c where c.id = new.cultura_id and c.ativo) then
      raise exception 'CULTURA_INATIVA' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

-- Número de plantas afetadas/colhidas não passa da quantidade do plantio informado (quando ela é conhecida).
create or replace function public.tg_plantas_no_plantio() returns trigger
language plpgsql set search_path = '' as $$
declare
  n integer := (to_jsonb(new) ->> tg_argv[0])::integer;
  total integer;
begin
  if n is not null and new.plantio_id is not null then
    select p.quantidade into total from public.plantios p where p.id = new.plantio_id;
    if total is not null and n > total then
      raise exception 'PLANTAS_ACIMA_DO_PLANTIO' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

-- Unidades do sistema não mudam (a conversão para kg dos relatórios depende delas).
create or replace function public.tg_unidade_protegida() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.padrao then
    raise exception 'UNIDADE_DO_SISTEMA' using errcode = 'check_violation';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger culturas_normalizar before insert or update on public.culturas
  for each row execute function public.tg_culturas_normalizar();
create trigger culturas_atualizado_em before update on public.culturas
  for each row execute function public.tg_atualizado_em();

create trigger plantios_atualizado_em before update on public.plantios
  for each row execute function public.tg_atualizado_em();
create trigger plantios_data before insert or update on public.plantios
  for each row execute function public.tg_data_nao_futura('data_plantio');
create trigger plantios_cultura_ativa before insert or update on public.plantios
  for each row execute function public.tg_cultura_ativa();

create trigger eventos_atualizado_em before update on public.eventos
  for each row execute function public.tg_atualizado_em();
create trigger eventos_data before insert or update on public.eventos
  for each row execute function public.tg_data_nao_futura('data_evento');
create trigger eventos_cultura_ativa before insert or update on public.eventos
  for each row execute function public.tg_cultura_ativa();
create trigger eventos_plantas before insert or update on public.eventos
  for each row execute function public.tg_plantas_no_plantio('quantidade_plantas_afetadas');

create trigger colheitas_atualizado_em before update on public.colheitas
  for each row execute function public.tg_atualizado_em();
create trigger colheitas_data before insert or update on public.colheitas
  for each row execute function public.tg_data_nao_futura('data_colheita');
create trigger colheitas_cultura_ativa before insert or update on public.colheitas
  for each row execute function public.tg_cultura_ativa();
create trigger colheitas_plantas before insert or update on public.colheitas
  for each row execute function public.tg_plantas_no_plantio('quantidade_plantas_colhidas');

create trigger unidades_protegidas before update or delete on public.unidades_medida
  for each row execute function public.tg_unidade_protegida();

-- ---------------------------------------------------------------------------------------------------------------------
-- Acesso do MVP (SEM autenticação) — leia docs/SEGURANCA.md
--
-- Quem tiver a URL do app (e, portanto, a chave pública) lê e grava o que está liberado abaixo. Isso é aceitável só
-- para demonstração, com dados não sensíveis. O que fica restrito mesmo assim:
--   * culturas nunca são apagadas pela API (só inativadas), e id/created_at/updated_at não são alteráveis;
--   * unidades de medida do sistema não mudam nem são apagadas;
--   * todas as regras de integridade acima valem;
--   * as funções internas não podem ser chamadas pela API.
-- Para ligar o login no futuro: apagar as políticas "mvp_anon_*" e criar políticas para `authenticated`
-- (ex.: por propriedade/usuário). Nada no app depende do nome das políticas.
-- ---------------------------------------------------------------------------------------------------------------------

alter table public.culturas enable row level security;
alter table public.plantios enable row level security;
alter table public.eventos enable row level security;
alter table public.colheitas enable row level security;
alter table public.unidades_medida enable row level security;

-- O Supabase dá ALL em tabelas novas do schema public para anon/authenticated: começa do zero e libera só o necessário.
revoke all on public.culturas, public.plantios, public.eventos, public.colheitas, public.unidades_medida from anon, authenticated;

grant select, insert on public.culturas to anon, authenticated;
grant update (nome, grupo, descricao, floracao_esperada, colheita_esperada, floracao_padrao, colheita_padrao,
              meses_floracao, meses_frutificacao, meses_colheita, meses_confirmados, floracao_dias_min,
              floracao_dias_max, colheita_dias_min, colheita_dias_max, observacoes, ativo)
  on public.culturas to anon, authenticated;

grant select, insert, delete on public.plantios to anon, authenticated;
grant update (cultura_id, quantidade, data_plantio, estagio, localizacao, exposicao_solar_horas, estado_atual, observacoes)
  on public.plantios to anon, authenticated;

grant select, insert, delete on public.eventos to anon, authenticated;
grant update (cultura_id, plantio_id, tipo_evento, data_evento, intensidade, quantidade_plantas_afetadas,
              condicoes_climaticas, observacoes, acao_realizada)
  on public.eventos to anon, authenticated;

grant select, insert, delete on public.colheitas to anon, authenticated;
grant update (cultura_id, plantio_id, data_colheita, quantidade, unidade, destino, qualidade,
              quantidade_plantas_colhidas, observacoes)
  on public.colheitas to anon, authenticated;

grant select, insert, delete on public.unidades_medida to anon, authenticated;

-- Políticas: uma por operação, com nome que deixa claro que são provisórias.
create policy mvp_anon_ler on public.culturas for select to anon, authenticated using (true);
create policy mvp_anon_criar on public.culturas for insert to anon, authenticated with check (true);
create policy mvp_anon_editar on public.culturas for update to anon, authenticated using (true) with check (true);

create policy mvp_anon_ler on public.plantios for select to anon, authenticated using (true);
create policy mvp_anon_criar on public.plantios for insert to anon, authenticated with check (true);
create policy mvp_anon_editar on public.plantios for update to anon, authenticated using (true) with check (true);
create policy mvp_anon_apagar on public.plantios for delete to anon, authenticated using (true);

create policy mvp_anon_ler on public.eventos for select to anon, authenticated using (true);
create policy mvp_anon_criar on public.eventos for insert to anon, authenticated with check (true);
create policy mvp_anon_editar on public.eventos for update to anon, authenticated using (true) with check (true);
create policy mvp_anon_apagar on public.eventos for delete to anon, authenticated using (true);

create policy mvp_anon_ler on public.colheitas for select to anon, authenticated using (true);
create policy mvp_anon_criar on public.colheitas for insert to anon, authenticated with check (true);
create policy mvp_anon_editar on public.colheitas for update to anon, authenticated using (true) with check (true);
create policy mvp_anon_apagar on public.colheitas for delete to anon, authenticated using (true);

create policy mvp_anon_ler on public.unidades_medida for select to anon, authenticated using (true);
-- Unidade criada pelo app nunca é "do sistema"; só as criadas pelo app podem ser apagadas (se não estiverem em uso).
create policy mvp_anon_criar on public.unidades_medida for insert to anon, authenticated with check (padrao = false);
create policy mvp_anon_apagar on public.unidades_medida for delete to anon, authenticated using (padrao = false);

-- Funções internas fora da API (os gatilhos continuam funcionando). hoje_sp fica liberada: é o valor padrão das datas.
revoke execute on function public.tg_atualizado_em(), public.tg_culturas_normalizar(), public.tg_data_nao_futura(),
  public.tg_cultura_ativa(), public.tg_plantas_no_plantio(), public.tg_unidade_protegida()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- Dados iniciais
-- ---------------------------------------------------------------------------------------------------------------------

-- Unidades da lista da planilha (kg, g, unidades, cachos, maços, litros, caixas).
insert into public.unidades_medida (codigo, nome, fator_kg, padrao, ordem) values
  ('kg', 'kg', 1, true, 1),
  ('g', 'gramas', 0.001, true, 2),
  ('unidades', 'unidades', null, true, 3),
  ('cachos', 'cachos', null, true, 4),
  ('macos', 'maços', null, true, 5),
  ('litros', 'litros', null, true, 6),
  ('caixas', 'caixas', null, true, 7);

-- As 42 culturas da aba "Calendário anual", na ordem da planilha. Textos copiados sem alteração.
-- Meses: só onde o texto cita estação (P = set,out,nov · V = dez,jan,fev · O = mar,abr,mai · I = jun,jul,ago).
insert into public.culturas (nome, grupo, floracao_esperada, colheita_esperada, observacoes,
                             floracao_padrao, colheita_padrao, meses_floracao, meses_colheita,
                             floracao_dias_min, floracao_dias_max, colheita_dias_min, colheita_dias_max)
values
  ('Laranja Bahia', 'Frutífera', 'Primavera (varia)', 'Outono–inverno (varia)',
   'Floração e colheita dependem da variedade, clima e manejo.',
   'estacional', 'estacional', '{9,10,11}', '{3,4,5,6,7,8}', null, null, null, null),
  ('Mexerica Ponkan', 'Frutífera', 'Primavera', 'Outono–inverno',
   'Época varia com altitude, cultivar e clima do ano.',
   'estacional', 'estacional', '{9,10,11}', '{3,4,5,6,7,8}', null, null, null, null),
  ('Limão Taiti', 'Frutífera', 'Várias floradas', 'Várias épocas',
   'Pode florescer e produzir em mais de uma época; registre cada ciclo.',
   'varias_epocas', 'varias_epocas', '{}', '{}', null, null, null, null),
  ('Limão galego', 'Frutífera', 'Várias floradas', 'Várias épocas',
   'A época depende da variedade e das condições locais.',
   'varias_epocas', 'varias_epocas', '{}', '{}', null, null, null, null),
  ('Limão-siciliano', 'Frutífera', 'Várias floradas', 'Várias épocas',
   'Pode apresentar floradas sucessivas.',
   'varias_epocas', 'varias_epocas', '{}', '{}', null, null, null, null),
  ('Acerola grande', 'Frutífera', 'Primavera–verão; pode repetir', 'Primavera–outono; variável',
   'Em condições favoráveis, pode produzir em várias épocas.',
   'estacional', 'estacional', '{9,10,11,12,1,2}', '{9,10,11,12,1,2,3,4,5}', null, null, null, null),
  ('Jambo', 'Frutífera', 'Primavera–verão (referência)', 'Verão–outono (referência)',
   'Confirmar espécie e observar o ciclo local.',
   'estacional', 'estacional', '{9,10,11,12,1,2}', '{12,1,2,3,4,5}', null, null, null, null),
  ('Graviola', 'Frutífera tropical', 'Variável', 'Variável',
   'Frio pode limitar floração e frutificação em áreas altas.',
   'variavel', 'variavel', '{}', '{}', null, null, null, null),
  ('Figo', 'Frutífera', 'Primavera–verão (brotamento/floração discreta)', 'Verão–outono (varia)',
   'A época depende da variedade e das podas.',
   'estacional', 'estacional', '{9,10,11,12,1,2}', '{12,1,2,3,4,5}', null, null, null, null),
  ('Jabuticaba', 'Frutífera', 'Primavera–verão; pode repetir', 'Após floradas; variável',
   'Irrigação e chuvas podem influenciar floradas; anote cada uma.',
   'estacional', 'variavel', '{9,10,11,12,1,2}', '{}', null, null, null, null),
  ('Fruta do milagre', 'Frutífera tropical', 'Variável', 'Variável',
   'Espécie sensível ao frio; use observação local.',
   'variavel', 'variavel', '{}', '{}', null, null, null, null),
  ('Fruta-do-conde', 'Frutífera tropical', 'Primavera–verão (referência)', 'Verão–outono (referência)',
   'Polinização pode limitar a formação de frutos.',
   'estacional', 'estacional', '{9,10,11,12,1,2}', '{12,1,2,3,4,5}', null, null, null, null),
  ('Amendoim', 'Anual', 'Cerca de 25–45 dias após semeadura', 'Cerca de 90–130 dias após semeadura',
   'Ciclo varia conforme cultivar e temperatura; registrar datas de plantio.',
   'apos_plantio', 'apos_plantio', '{}', '{}', 25, 45, 90, 130),
  ('Amora', 'Frutífera', 'Primavera (varia)', 'Primavera–verão (varia)',
   'Depende da espécie/variedade e da poda.',
   'estacional', 'estacional', '{9,10,11}', '{9,10,11,12,1,2}', null, null, null, null),
  ('Araçá', 'Frutífera nativa', 'Primavera–verão (referência)', 'Verão–outono (referência)',
   'Nome comum pode corresponder a espécies diferentes.',
   'estacional', 'estacional', '{9,10,11,12,1,2}', '{12,1,2,3,4,5}', null, null, null, null),
  ('Araçá-una', 'Frutífera nativa', 'A confirmar', 'A confirmar',
   'Confirmar identificação botânica para prever o ciclo.',
   'a_confirmar', 'a_confirmar', '{}', '{}', null, null, null, null),
  ('Goiaba tailandesa', 'Frutífera', 'Várias floradas possíveis', 'Várias épocas possíveis',
   'Poda e manejo podem escalonar a produção.',
   'varias_epocas', 'varias_epocas', '{}', '{}', null, null, null, null),
  ('Coco', 'Frutífera tropical', 'Ao longo do ano, em clima adequado', 'Ao longo do ano, em clima adequado',
   'Frio e altitude podem limitar o desempenho.',
   'continua', 'continua', '{}', '{}', null, null, null, null),
  ('Banana-prata', 'Frutífera', 'Contínua por ciclo da touceira', 'Após desenvolvimento do cacho; variável',
   'Registre data de emissão do cacho e colheita.',
   'continua', 'variavel', '{}', '{}', null, null, null, null),
  ('Banana-maçã', 'Frutífera', 'Contínua por ciclo da touceira', 'Após desenvolvimento do cacho; variável',
   'Registre cada planta-mãe/touceira.',
   'continua', 'variavel', '{}', '{}', null, null, null, null),
  ('Banana-nanica', 'Frutífera', 'Contínua por ciclo da touceira', 'Após desenvolvimento do cacho; variável',
   'Água, nutrição e sanidade influenciam o ciclo.',
   'continua', 'variavel', '{}', '{}', null, null, null, null),
  ('Banana-naniquinha', 'Frutífera', 'Contínua por ciclo da touceira', 'Após desenvolvimento do cacho; variável',
   'Confirmar se é cultivar distinta da nanica na sua área.',
   'continua', 'variavel', '{}', '{}', null, null, null, null),
  ('Banana de três quinas', 'Frutífera', 'A confirmar', 'A confirmar',
   'Nome regional pode variar; identifique a variedade.',
   'a_confirmar', 'a_confirmar', '{}', '{}', null, null, null, null),
  ('Abacate', 'Frutífera', 'Primavera (varia por cultivar)', 'Variável por cultivar; frequentemente outono–primavera',
   'A época muda bastante entre cultivares.',
   'estacional', 'variavel', '{9,10,11}', '{}', null, null, null, null),
  ('Avocado', 'Frutífera', 'Primavera (varia por cultivar)', 'Variável por cultivar',
   'Avocado é tipo comercial de abacate; anote a cultivar se souber.',
   'estacional', 'variavel', '{9,10,11}', '{}', null, null, null, null),
  ('Cana-caiana', 'Cultura semiperene', 'Não se aplica como frutífera', 'Corte conforme maturação; frequentemente época mais seca/fria',
   'Maturação varia com variedade, plantio e clima.',
   'nao_se_aplica', 'variavel', '{}', '{}', null, null, null, null),
  ('Nêspera (ameixa-amarela)', 'Frutífera', 'Outono–inverno (referência)', 'Inverno–primavera (referência)',
   'Pode variar com altitude e cultivar.',
   'estacional', 'estacional', '{3,4,5,6,7,8}', '{6,7,8,9,10,11}', null, null, null, null),
  ('Mamão', 'Frutífera tropical', 'Quase contínua em clima favorável', 'Quase contínua após início da produção',
   'Frio e vento podem reduzir crescimento e produção.',
   'continua', 'continua', '{}', '{}', null, null, null, null),
  ('Lichia', 'Frutífera', 'Inverno–primavera, se houver indução adequada', 'Primavera–verão (varia)',
   'Floração depende de condições térmicas e cultivar; altitude desconhecida é grande incerteza.',
   'estacional', 'estacional', '{6,7,8,9,10,11}', '{9,10,11,12,1,2}', null, null, null, null),
  ('Pitanga', 'Frutífera nativa', 'Primavera–verão; pode repetir', 'Primavera–verão (variável)',
   'Pode apresentar mais de uma safra.',
   'estacional', 'estacional', '{9,10,11,12,1,2}', '{9,10,11,12,1,2}', null, null, null, null),
  ('Maracujá', 'Frutífera trepadeira', 'Várias floradas em clima favorável', 'Após a floração; várias épocas',
   'Precisa de suporte, polinização e manejo sanitário.',
   'varias_epocas', 'varias_epocas', '{}', '{}', null, null, null, null),
  ('Cacau', 'Frutífera tropical', 'Ao longo do ano em clima adequado', 'Após vários meses; ao longo do ano em clima adequado',
   'Frio e condições de umidade podem limitar o cultivo.',
   'continua', 'continua', '{}', '{}', null, null, null, null),
  ('Seriguela', 'Frutífera tropical', 'Primavera (referência)', 'Primavera–verão (referência)',
   'Pode produzir pouco em locais frios.',
   'estacional', 'estacional', '{9,10,11}', '{9,10,11,12,1,2}', null, null, null, null),
  ('Abóbora', 'Anual', 'Geralmente 30–60 dias após semeadura', 'Em geral 80–120 dias após semeadura, conforme cultivar',
   'Registrar data de plantio; ciclo depende da variedade.',
   'apos_plantio', 'apos_plantio', '{}', '{}', 30, 60, 80, 120),
  -- Milho: a janela de colheita junta "verde 70–100 dias" e "grão seco 100–150 dias" (texto original preservado).
  ('Milho', 'Anual', 'Flores masculinas/femininas geralmente 45–70 dias após plantio', 'Colheita verde geralmente 70–100 dias; grão seco 100–150 dias',
   'Intervalos indicativos; cultivar, clima e manejo mudam o ciclo.',
   'apos_plantio', 'apos_plantio', '{}', '{}', 45, 70, 70, 150),
  ('Palmito', 'Palmeira/cultura perene', 'Não se usa calendário anual simples de floração', 'Colheita conforme espécie e idade, em anos',
   'Identificar se é pupunha, palmeira-real ou outra espécie.',
   'nao_se_aplica', 'variavel', '{}', '{}', null, null, null, null),
  -- Aipim: "8–18 meses" guardado como 240–540 dias (30 dias por mês, aproximação declarada).
  ('Aipim branco', 'Raiz/cultura semiperene', 'Não se aplica como frutífera', 'Geralmente 8–18 meses após plantio, conforme cultivar',
   'Confirmar cultivar e ciclo recomendado localmente.',
   'nao_se_aplica', 'apos_plantio', '{}', '{}', null, null, 240, 540),
  ('Aipim-manteiga', 'Raiz/cultura semiperene', 'Não se aplica como frutífera', 'Geralmente 8–18 meses após plantio, conforme cultivar',
   'Confirmar cultivar e ciclo recomendado localmente.',
   'nao_se_aplica', 'apos_plantio', '{}', '{}', null, null, 240, 540),
  ('Alecrim', 'Erva perene', 'Pode florescer em épocas variadas', 'Colheita de ramos conforme crescimento',
   'Colher sem retirar excessivamente a planta; prefere drenagem.',
   'variavel', 'variavel', '{}', '{}', null, null, null, null),
  ('Louro (folha)', 'Árvore/folha', 'Floração variável, não é foco da colheita', 'Folhas conforme necessidade e crescimento',
   'Registrar podas e colheitas de folhas.',
   'variavel', 'variavel', '{}', '{}', null, null, null, null),
  -- Almeirão: "semanas após plantio" não tem número: fica sem janela calculada.
  ('Almeirão', 'Hortaliça', 'Pode florescer se deixado completar o ciclo', 'Folhas geralmente semanas após plantio',
   'Escalonar plantios para colheita contínua.',
   'variavel', 'apos_plantio', '{}', '{}', null, null, null, null),
  ('Ora-pro-nóbis', 'PANC/arbusto', 'Primavera–verão (variável)', 'Folhas ao longo do ano, em clima favorável',
   'Podas regulares estimulam brotação; evitar encharcamento.',
   'estacional', 'continua', '{9,10,11,12,1,2}', '{}', null, null, null, null);

-- Aba "Cadastro de plantas": uma linha por cultura, preenchida só com "Idade/estágio = Jovem". Vira um plantio por
-- cultura com quantidade, data e local em branco (o app mostra "cadastro a completar").
insert into public.plantios (cultura_id, estagio)
select id, 'jovem' from public.culturas;
