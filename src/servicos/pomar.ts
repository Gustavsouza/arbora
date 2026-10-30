// Acesso ao banco. Único lugar que conhece os nomes das tabelas e colunas; o resto do app usa os tipos do domínio.
import type { Colheita, Cultura, Evento, Plantio, Resultado, Unidade } from '@/dominio/tipos';
import { supabase } from './cliente';
import { mensagemDeErro } from './erros';

// ---------------------------------------------------------------------------------------------------------------------
// Linhas do banco ↔ domínio
// ---------------------------------------------------------------------------------------------------------------------

type LinhaCultura = {
  id: string; nome: string; grupo: string; descricao: string | null; floracao_esperada: string | null; colheita_esperada: string | null;
  floracao_padrao: Cultura['floracaoPadrao']; colheita_padrao: Cultura['colheitaPadrao']; meses_floracao: number[]; meses_frutificacao: number[];
  meses_colheita: number[]; meses_confirmados: boolean; floracao_dias_min: number | null; floracao_dias_max: number | null;
  colheita_dias_min: number | null; colheita_dias_max: number | null; observacoes: string | null; ativo: boolean;
};
const intervalo = (min: number | null, max: number | null) => (min === null && max === null ? null : { min, max });
const paraCultura = (l: LinhaCultura): Cultura => ({
  id: l.id, nome: l.nome, grupo: l.grupo, descricao: l.descricao, floracaoEsperada: l.floracao_esperada, colheitaEsperada: l.colheita_esperada,
  floracaoPadrao: l.floracao_padrao, colheitaPadrao: l.colheita_padrao, mesesFloracao: l.meses_floracao ?? [], mesesFrutificacao: l.meses_frutificacao ?? [],
  mesesColheita: l.meses_colheita ?? [], mesesConfirmados: l.meses_confirmados, floracaoDias: intervalo(l.floracao_dias_min, l.floracao_dias_max),
  colheitaDias: intervalo(l.colheita_dias_min, l.colheita_dias_max), observacoes: l.observacoes, ativo: l.ativo,
});

type LinhaPlantio = {
  id: string; cultura_id: string; quantidade: number | null; data_plantio: string | null; estagio: Plantio['estagio']; localizacao: string | null;
  exposicao_solar_horas: number | string | null; estado_atual: Plantio['estadoAtual']; observacoes: string | null; updated_at: string;
};
const paraPlantio = (l: LinhaPlantio): Plantio => ({
  id: l.id, culturaId: l.cultura_id, quantidade: l.quantidade, dataPlantio: l.data_plantio, estagio: l.estagio, localizacao: l.localizacao,
  exposicaoSolarHoras: l.exposicao_solar_horas === null ? null : Number(l.exposicao_solar_horas), estadoAtual: l.estado_atual,
  observacoes: l.observacoes, atualizadoEm: l.updated_at,
});

type LinhaEvento = {
  id: string; cultura_id: string; plantio_id: string | null; tipo_evento: Evento['tipo']; data_evento: string; intensidade: Evento['intensidade'];
  quantidade_plantas_afetadas: number | null; condicoes_climaticas: string | null; observacoes: string | null; acao_realizada: string | null; created_at: string;
};
const paraEvento = (l: LinhaEvento): Evento => ({
  id: l.id, culturaId: l.cultura_id, plantioId: l.plantio_id, tipo: l.tipo_evento, data: l.data_evento, intensidade: l.intensidade,
  plantasAfetadas: l.quantidade_plantas_afetadas, clima: l.condicoes_climaticas, observacoes: l.observacoes, acaoRealizada: l.acao_realizada, criadoEm: l.created_at,
});

type LinhaColheita = {
  id: string; cultura_id: string; plantio_id: string | null; data_colheita: string; quantidade: number | string; unidade: string;
  destino: Colheita['destino']; qualidade: Colheita['qualidade']; quantidade_plantas_colhidas: number | null; observacoes: string | null; created_at: string;
};
// numeric chega como texto pelo PostgREST: converte aqui, uma vez.
const paraColheita = (l: LinhaColheita): Colheita => ({
  id: l.id, culturaId: l.cultura_id, plantioId: l.plantio_id, data: l.data_colheita, quantidade: Number(l.quantidade), unidade: l.unidade,
  destino: l.destino, qualidade: l.qualidade, plantasColhidas: l.quantidade_plantas_colhidas, observacoes: l.observacoes, criadoEm: l.created_at,
});

type LinhaUnidade = { codigo: string; nome: string; fator_kg: number | string | null; padrao: boolean };
const paraUnidade = (l: LinhaUnidade): Unidade => ({ codigo: l.codigo, nome: l.nome, fatorKg: l.fator_kg === null ? null : Number(l.fator_kg), padrao: l.padrao });

// ---------------------------------------------------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------------------------------------------------

/** O Supabase devolve no máximo 1.000 linhas por pedido: busca em páginas, com ordem estável (desempate pelo id). */
const PAGINA = 1000;
async function todasAsLinhas<T>(tabela: string, ordem: string): Promise<T[]> {
  const out: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await supabase().from(tabela).select('*').order(ordem, { ascending: false }).order('id').range(de, de + PAGINA - 1);
    if (error) throw error;
    out.push(...(data as T[]));
    if (data.length < PAGINA) return out;
  }
}

export interface DadosDoPomar { culturas: Cultura[]; plantios: Plantio[]; eventos: Evento[]; colheitas: Colheita[]; unidades: Unidade[] }

async function tentar<T>(f: () => Promise<T>): Promise<Resultado<T>> {
  try { return { ok: true, valor: await f() }; } catch (e) { console.error(e); return { ok: false, mensagem: mensagemDeErro(e) }; }
}

export const carregarCulturas = () => tentar(async () => {
  const { data, error } = await supabase().from('culturas').select('*').order('nome');
  if (error) throw error;
  return (data as LinhaCultura[]).map(paraCultura);
});
export const carregarPlantios = () => tentar(async () => (await todasAsLinhas<LinhaPlantio>('plantios', 'created_at')).map(paraPlantio));
export const carregarEventos = () => tentar(async () => (await todasAsLinhas<LinhaEvento>('eventos', 'data_evento')).map(paraEvento));
export const carregarColheitas = () => tentar(async () => (await todasAsLinhas<LinhaColheita>('colheitas', 'data_colheita')).map(paraColheita));
export const carregarUnidades = () => tentar(async () => {
  const { data, error } = await supabase().from('unidades_medida').select('*').order('ordem').order('nome');
  if (error) throw error;
  return (data as LinhaUnidade[]).map(paraUnidade);
});

// ---------------------------------------------------------------------------------------------------------------------
// Gravação (devolve o registro como ficou no banco, já com as normalizações dos gatilhos)
// ---------------------------------------------------------------------------------------------------------------------

async function gravar<L, T>(tabela: string, linha: Record<string, unknown>, id: string | null, mapear: (l: L) => T): Promise<Resultado<T>> {
  return tentar(async () => {
    const q = id ? supabase().from(tabela).update(linha).eq('id', id) : supabase().from(tabela).insert(linha);
    const { data, error } = await q.select('*').single();
    if (error) throw error;
    return mapear(data as L);
  });
}

async function apagar(tabela: string, chave: string, valor: string): Promise<Resultado<null>> {
  return tentar(async () => {
    const { data, error } = await supabase().from(tabela).delete().eq(chave, valor).select(chave);
    if (error) throw error;
    if (!data?.length) throw new Error('permission denied'); // nada apagado: política ou registro já removido
    return null;
  });
}

export type NovaCultura = Omit<Cultura, 'id'>;
export function salvarCultura(c: NovaCultura, id: string | null = null) {
  return gravar<LinhaCultura, Cultura>('culturas', {
    nome: c.nome, grupo: c.grupo, descricao: c.descricao, floracao_esperada: c.floracaoEsperada, colheita_esperada: c.colheitaEsperada,
    floracao_padrao: c.floracaoPadrao, colheita_padrao: c.colheitaPadrao, meses_floracao: c.mesesFloracao, meses_frutificacao: c.mesesFrutificacao,
    meses_colheita: c.mesesColheita, meses_confirmados: c.mesesConfirmados, floracao_dias_min: c.floracaoDias?.min ?? null,
    floracao_dias_max: c.floracaoDias?.max ?? null, colheita_dias_min: c.colheitaDias?.min ?? null, colheita_dias_max: c.colheitaDias?.max ?? null,
    observacoes: c.observacoes, ativo: c.ativo,
  }, id, paraCultura);
}
export const definirCulturaAtiva = (id: string, ativo: boolean) => gravar<LinhaCultura, Cultura>('culturas', { ativo }, id, paraCultura);

export type NovoPlantio = Omit<Plantio, 'id' | 'atualizadoEm'>;
export function salvarPlantio(p: Partial<NovoPlantio>, id: string | null = null) {
  const linha: Record<string, unknown> = {};
  if (p.culturaId !== undefined) linha.cultura_id = p.culturaId;
  if (p.quantidade !== undefined) linha.quantidade = p.quantidade;
  if (p.dataPlantio !== undefined) linha.data_plantio = p.dataPlantio;
  if (p.estagio !== undefined) linha.estagio = p.estagio;
  if (p.localizacao !== undefined) linha.localizacao = p.localizacao;
  if (p.exposicaoSolarHoras !== undefined) linha.exposicao_solar_horas = p.exposicaoSolarHoras;
  if (p.estadoAtual !== undefined) linha.estado_atual = p.estadoAtual;
  if (p.observacoes !== undefined) linha.observacoes = p.observacoes;
  return gravar<LinhaPlantio, Plantio>('plantios', linha, id, paraPlantio);
}
export const apagarPlantio = (id: string) => apagar('plantios', 'id', id);

export type NovoEvento = Omit<Evento, 'id' | 'criadoEm'>;
export function salvarEvento(e: NovoEvento, id: string | null = null) {
  return gravar<LinhaEvento, Evento>('eventos', {
    cultura_id: e.culturaId, plantio_id: e.plantioId, tipo_evento: e.tipo, data_evento: e.data, intensidade: e.intensidade,
    quantidade_plantas_afetadas: e.plantasAfetadas, condicoes_climaticas: e.clima, observacoes: e.observacoes, acao_realizada: e.acaoRealizada,
  }, id, paraEvento);
}
export const apagarEvento = (id: string) => apagar('eventos', 'id', id);

export type NovaColheita = Omit<Colheita, 'id' | 'criadoEm'>;
export function salvarColheita(c: NovaColheita, id: string | null = null) {
  return gravar<LinhaColheita, Colheita>('colheitas', {
    cultura_id: c.culturaId, plantio_id: c.plantioId, data_colheita: c.data, quantidade: c.quantidade, unidade: c.unidade, destino: c.destino,
    qualidade: c.qualidade, quantidade_plantas_colhidas: c.plantasColhidas, observacoes: c.observacoes,
  }, id, paraColheita);
}
export const apagarColheita = (id: string) => apagar('colheitas', 'id', id);

export function criarUnidade(u: { codigo: string; nome: string; fatorKg: number | null }) {
  return gravar<LinhaUnidade, Unidade>('unidades_medida', { codigo: u.codigo, nome: u.nome, fator_kg: u.fatorKg, padrao: false }, null, paraUnidade);
}
export const apagarUnidade = (codigo: string) => apagar('unidades_medida', 'codigo', codigo);
