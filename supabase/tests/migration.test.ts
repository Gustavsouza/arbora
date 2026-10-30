// Migration 0001: dados importados da planilha, integridade e acesso anônimo do MVP.
import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { comoSistema, comoVisitante, novoBanco } from './banco';

let db: PGlite;
beforeAll(async () => { db = await novoBanco(); });
afterAll(async () => { await db.close(); });
beforeEach(async () => { await comoSistema(db); });

async function linhas<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return (await db.query<T>(sql, params)).rows;
}
async function idDaCultura(nome: string) {
  return (await linhas<{ id: string }>('select id from public.culturas where nome = $1', [nome]))[0]!.id;
}
async function plantioDa(nome: string) {
  return (await linhas<{ id: string }>('select p.id from public.plantios p join public.culturas c on c.id = p.cultura_id where c.nome = $1', [nome]))[0]!.id;
}

describe('dados da planilha', () => {
  it('importa as 42 culturas com os textos originais', async () => {
    const [{ n }] = await linhas<{ n: number }>('select count(*)::int as n from public.culturas') as [{ n: number }];
    expect(n).toBe(42);
    const [jab] = await linhas<{ grupo: string; floracao_esperada: string; colheita_esperada: string; observacoes: string }>(
      `select grupo, floracao_esperada, colheita_esperada, observacoes from public.culturas where nome = 'Jabuticaba'`);
    expect(jab).toEqual({
      grupo: 'Frutífera', floracao_esperada: 'Primavera–verão; pode repetir', colheita_esperada: 'Após floradas; variável',
      observacoes: 'Irrigação e chuvas podem influenciar floradas; anote cada uma.',
    });
  });

  it('só estima meses quando o texto cita estação; nada de frutificação inventada', async () => {
    const r = await linhas<{ nome: string; meses_floracao: number[]; meses_colheita: number[]; meses_confirmados: boolean }>(
      `select nome, meses_floracao, meses_colheita, meses_confirmados from public.culturas where nome in ('Laranja Bahia', 'Graviola', 'Limão Taiti')
       order by nome`);
    expect(r).toEqual([
      { nome: 'Graviola', meses_floracao: [], meses_colheita: [], meses_confirmados: false },
      { nome: 'Laranja Bahia', meses_floracao: [9, 10, 11], meses_colheita: [3, 4, 5, 6, 7, 8], meses_confirmados: false },
      { nome: 'Limão Taiti', meses_floracao: [], meses_colheita: [], meses_confirmados: false },
    ]);
    const [{ n }] = await linhas<{ n: number }>(`select count(*)::int as n from public.culturas where meses_frutificacao <> '{}'`) as [{ n: number }];
    expect(n).toBe(0);
    // Meses só existem para padrão estacional.
    const [{ m }] = await linhas<{ m: number }>(
      `select count(*)::int as m from public.culturas where (meses_floracao <> '{}' and floracao_padrao <> 'estacional')
         or (meses_colheita <> '{}' and colheita_padrao <> 'estacional')`) as [{ m: number }];
    expect(m).toBe(0);
  });

  it('ciclos "após a semeadura" ficam em dias', async () => {
    const [a] = await linhas(`select floracao_dias_min, floracao_dias_max, colheita_dias_min, colheita_dias_max
                              from public.culturas where nome = 'Amendoim'`);
    expect(a).toEqual({ floracao_dias_min: 25, floracao_dias_max: 45, colheita_dias_min: 90, colheita_dias_max: 130 });
  });

  it('cria um plantio "Jovem" por cultura, sem quantidade inventada, e as 7 unidades da planilha', async () => {
    const [p] = await linhas<{ n: number; jovens: number; com_qtd: number }>(
      `select count(*)::int n, count(*) filter (where estagio = 'jovem')::int jovens, count(quantidade)::int com_qtd from public.plantios`);
    expect(p).toEqual({ n: 42, jovens: 42, com_qtd: 0 });
    const u = await linhas<{ codigo: string; fator_kg: string | null }>('select codigo, fator_kg from public.unidades_medida order by ordem');
    expect(u.map((x) => x.codigo)).toEqual(['kg', 'g', 'unidades', 'cachos', 'macos', 'litros', 'caixas']);
    expect(u.filter((x) => x.fator_kg !== null).map((x) => x.codigo)).toEqual(['kg', 'g']);
  });

  it('não importa eventos nem colheitas (abas vazias)', async () => {
    expect(await linhas('select 1 from public.eventos')).toHaveLength(0);
    expect(await linhas('select 1 from public.colheitas')).toHaveLength(0);
  });
});

describe('integridade', () => {
  it('recusa data no futuro (fuso de Brasília)', async () => {
    const c = await idDaCultura('Jabuticaba');
    await expect(db.query(`insert into public.eventos (cultura_id, tipo_evento, data_evento) values ($1, 'poda', public.hoje_sp() + 1)`, [c]))
      .rejects.toThrow(/DATA_NO_FUTURO/);
    await expect(db.query(`insert into public.eventos (cultura_id, tipo_evento) values ($1, 'poda')`, [c])).resolves.toBeTruthy();
  });

  it('o plantio do evento/colheita precisa ser da mesma cultura', async () => {
    const jab = await idDaCultura('Jabuticaba');
    const plantioLaranja = await plantioDa('Laranja Bahia');
    await expect(db.query(`insert into public.eventos (cultura_id, plantio_id, tipo_evento) values ($1, $2, 'poda')`, [jab, plantioLaranja]))
      .rejects.toThrow(/eventos_plantio_da_cultura/);
    await expect(db.query(`insert into public.colheitas (cultura_id, plantio_id, quantidade, unidade) values ($1, $2, 1, 'kg')`, [jab, plantioLaranja]))
      .rejects.toThrow(/colheitas_plantio_da_cultura/);
  });

  it('plantas afetadas não passam da quantidade do plantio', async () => {
    const c = await idDaCultura('Pitanga');
    const p = await plantioDa('Pitanga');
    await db.query('update public.plantios set quantidade = 3 where id = $1', [p]);
    await expect(db.query(`insert into public.eventos (cultura_id, plantio_id, tipo_evento, quantidade_plantas_afetadas) values ($1, $2, 'poda', 4)`, [c, p]))
      .rejects.toThrow(/PLANTAS_ACIMA_DO_PLANTIO/);
    await expect(db.query(`insert into public.eventos (cultura_id, plantio_id, tipo_evento, quantidade_plantas_afetadas) values ($1, $2, 'poda', 3)`, [c, p]))
      .resolves.toBeTruthy();
  });

  it('quantidade colhida positiva e unidade cadastrada', async () => {
    const c = await idDaCultura('Mamão');
    await expect(db.query(`insert into public.colheitas (cultura_id, quantidade, unidade) values ($1, 0, 'kg')`, [c])).rejects.toThrow(/check/);
    await expect(db.query(`insert into public.colheitas (cultura_id, quantidade, unidade) values ($1, 2, 'sacas')`, [c])).rejects.toThrow(/foreign key/);
  });

  it('cultura inativa não recebe registros novos', async () => {
    const c = await idDaCultura('Coco');
    await db.query('update public.culturas set ativo = false where id = $1', [c]);
    await expect(db.query(`insert into public.eventos (cultura_id, tipo_evento) values ($1, 'poda')`, [c])).rejects.toThrow(/CULTURA_INATIVA/);
    await db.query('update public.culturas set ativo = true where id = $1', [c]);
  });

  it('apagar o plantio mantém o evento, sem o vínculo', async () => {
    const c = await idDaCultura('Figo');
    const p = await plantioDa('Figo');
    const [e] = await linhas<{ id: string }>(`insert into public.eventos (cultura_id, plantio_id, tipo_evento) values ($1, $2, 'adubacao') returning id`, [c, p]);
    await db.query('delete from public.plantios where id = $1', [p]);
    expect(await linhas('select cultura_id, plantio_id from public.eventos where id = $1', [e!.id])).toEqual([{ cultura_id: c, plantio_id: null }]);
  });

  it('meses ficam sem repetição e em ordem; mês 13 é recusado; nome repetido também', async () => {
    const c = await idDaCultura('Amora');
    await db.query(`update public.culturas set meses_frutificacao = '{11,10,10}' where id = $1`, [c]);
    expect(await linhas('select meses_frutificacao from public.culturas where id = $1', [c])).toEqual([{ meses_frutificacao: [10, 11] }]);
    await expect(db.query(`update public.culturas set meses_colheita = '{13}' where id = $1`, [c])).rejects.toThrow(/culturas_meses_validos/);
    await expect(db.query(`insert into public.culturas (nome, grupo) values (' amora ', 'Frutífera')`)).rejects.toThrow(/culturas_nome_unico/);
  });
});

describe('acesso anônimo do MVP (RLS)', () => {
  it('RLS ligada em todas as tabelas', async () => {
    const r = await linhas<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname`);
    expect(r.every((x) => x.relrowsecurity)).toBe(true);
    expect(r).toHaveLength(5);
  });

  it('o visitante lê, registra, edita e apaga eventos e colheitas', async () => {
    const c = await idDaCultura('Jabuticaba');
    await comoVisitante(db);
    expect((await linhas('select id from public.culturas')).length).toBe(42);
    const [e] = await linhas<{ id: string }>(`insert into public.eventos (cultura_id, tipo_evento) values ($1, 'floracao_inicio') returning id`, [c]);
    await db.query(`update public.eventos set intensidade = 'forte' where id = $1`, [e!.id]);
    const [h] = await linhas<{ id: string }>(`insert into public.colheitas (cultura_id, quantidade, unidade) values ($1, 2.5, 'kg') returning id`, [c]);
    await db.query('delete from public.colheitas where id = $1', [h!.id]);
    await db.query('delete from public.eventos where id = $1', [e!.id]);
    expect(await linhas('select 1 from public.eventos where id = $1', [e!.id])).toHaveLength(0);
  });

  it('o visitante não apaga culturas nem altera id/created_at', async () => {
    const c = await idDaCultura('Cacau');
    await comoVisitante(db);
    await expect(db.query('delete from public.culturas where id = $1', [c])).rejects.toThrow(/permission denied/);
    await expect(db.query('update public.culturas set created_at = now() where id = $1', [c])).rejects.toThrow(/permission denied/);
    await expect(db.query(`update public.culturas set id = gen_random_uuid() where id = $1`, [c])).rejects.toThrow(/permission denied/);
    await expect(db.query(`update public.culturas set ativo = false where id = $1`, [c])).resolves.toBeTruthy();
    await comoSistema(db);
    await db.query('update public.culturas set ativo = true where id = $1', [c]);
  });

  it('unidades do sistema são protegidas; a criada pelo app pode ser apagada', async () => {
    await comoVisitante(db);
    await expect(db.query(`insert into public.unidades_medida (codigo, nome, padrao) values ('x', 'x', true)`)).rejects.toThrow(/row-level security/);
    await db.query(`insert into public.unidades_medida (codigo, nome) values ('sacas', 'sacas')`);
    const apagadas = await db.query(`delete from public.unidades_medida where codigo in ('kg', 'sacas') returning codigo`);
    expect(apagadas.rows).toEqual([{ codigo: 'sacas' }]); // kg nem aparece para o visitante apagar (política)
    await expect(db.query(`update public.unidades_medida set fator_kg = 2 where codigo = 'kg'`)).rejects.toThrow(/permission denied/);
  });

  it('o visitante não chama as funções internas pela API', async () => {
    await comoVisitante(db);
    await expect(db.query(`select public.tg_atualizado_em()`)).rejects.toThrow(/permission denied/);
    await expect(db.query('select public.hoje_sp()')).resolves.toBeTruthy();
  });
});
