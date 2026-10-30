// Cálculos de produção. Unidades diferentes NUNCA são somadas entre si: só entram no total em kg as colheitas cuja
// unidade tem fator de conversão confiável (kg e g, ou o que o proprietário declarar). O resto é somado por unidade.
import { anoDe, dentroDoPeriodo, mesDe, type Periodo } from './datas';
import type { Colheita, Destino, Evento, Unidade } from './tipos';

export type MapaUnidades = ReadonlyMap<string, Unidade>;
export const mapaDeUnidades = (u: Unidade[]): MapaUnidades => new Map(u.map((x) => [x.codigo, x]));

/** Arredonda para 3 casas (evita 0.30000000000000004 nas somas). */
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** Quantidade em kg, ou null se a unidade não converte com segurança. */
export function emKg(c: Colheita, unidades: MapaUnidades): number | null {
  const f = unidades.get(c.unidade)?.fatorKg;
  return f ? c.quantidade * f : null;
}

export interface TotalKg { kg: number; convertidas: number; semConversao: number }
export function totalKg(colheitas: Colheita[], unidades: MapaUnidades): TotalKg {
  let kg = 0, convertidas = 0, semConversao = 0;
  for (const c of colheitas) {
    const v = emKg(c, unidades);
    if (v === null) semConversao++; else { kg += v; convertidas++; }
  }
  return { kg: r3(kg), convertidas, semConversao };
}

export interface TotalUnidade { unidade: string; total: number; registros: number }
/** Totais por unidade original (10 kg e 20 cachos ficam separados). Ordem: mais registros primeiro. */
export function totaisPorUnidade(colheitas: Colheita[]): TotalUnidade[] {
  const m = new Map<string, TotalUnidade>();
  for (const c of colheitas) {
    const t = m.get(c.unidade) ?? { unidade: c.unidade, total: 0, registros: 0 };
    t.total = r3(t.total + c.quantidade);
    t.registros++;
    m.set(c.unidade, t);
  }
  return [...m.values()].sort((a, b) => b.registros - a.registros || a.unidade.localeCompare(b.unidade));
}

/** Totais por unidade que NÃO convertem para kg (o complemento do total em kg). */
export const totaisSemConversao = (colheitas: Colheita[], unidades: MapaUnidades) =>
  totaisPorUnidade(colheitas.filter((c) => emKg(c, unidades) === null));

export interface FiltroColheitas { culturaId?: string | null; destino?: Destino | null; periodo?: Periodo }
export function filtrarColheitas(colheitas: Colheita[], f: FiltroColheitas): Colheita[] {
  return colheitas.filter((c) =>
    (!f.culturaId || c.culturaId === f.culturaId) && (!f.destino || c.destino === f.destino) && (!f.periodo || dentroDoPeriodo(c.data, f.periodo)));
}

export const doAno = <T extends { data: string }>(lista: T[], ano: number) => lista.filter((x) => anoDe(x.data) === ano);

export interface ProducaoMes { mes: number; kg: number; registros: number }
/** 12 meses do ano: kg convertidos e número de colheitas (todas as unidades). */
export function producaoMensal(colheitas: Colheita[], ano: number, unidades: MapaUnidades): ProducaoMes[] {
  const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, kg: 0, registros: 0 }));
  for (const c of doAno(colheitas, ano)) {
    const m = meses[mesDe(c.data) - 1]!;
    m.registros++;
    m.kg = r3(m.kg + (emKg(c, unidades) ?? 0));
  }
  return meses;
}

export interface ProducaoAno { ano: number; kg: number; registros: number }
export function producaoAnual(colheitas: Colheita[], unidades: MapaUnidades): ProducaoAno[] {
  const m = new Map<number, ProducaoAno>();
  for (const c of colheitas) {
    const ano = anoDe(c.data);
    const t = m.get(ano) ?? { ano, kg: 0, registros: 0 };
    t.registros++;
    t.kg = r3(t.kg + (emKg(c, unidades) ?? 0));
    m.set(ano, t);
  }
  return [...m.values()].sort((a, b) => a.ano - b.ano);
}

export interface ProducaoCultura { culturaId: string; kg: number; percentualKg: number | null; outras: TotalUnidade[]; registros: number }
/** Por cultura, da mais produtiva (kg) para a menos. percentualKg = parte do total em kg (null sem kg no total). */
export function producaoPorCultura(colheitas: Colheita[], unidades: MapaUnidades): ProducaoCultura[] {
  const grupos = new Map<string, Colheita[]>();
  for (const c of colheitas) grupos.set(c.culturaId, [...(grupos.get(c.culturaId) ?? []), c]);
  const total = totalKg(colheitas, unidades).kg;
  return [...grupos.entries()].map(([culturaId, lista]) => {
    const kg = totalKg(lista, unidades).kg;
    return { culturaId, kg, percentualKg: total > 0 ? Math.round((kg / total) * 1000) / 10 : null, outras: totaisSemConversao(lista, unidades), registros: lista.length };
  }).sort((a, b) => b.kg - a.kg || b.registros - a.registros);
}

export interface ProducaoDestino { destino: Destino; kg: number; registros: number }
export function producaoPorDestino(colheitas: Colheita[], unidades: MapaUnidades): ProducaoDestino[] {
  const m = new Map<Destino, ProducaoDestino>();
  for (const c of colheitas) {
    const t = m.get(c.destino) ?? { destino: c.destino, kg: 0, registros: 0 };
    t.registros++;
    t.kg = r3(t.kg + (emKg(c, unidades) ?? 0));
    m.set(c.destino, t);
  }
  return [...m.values()].sort((a, b) => b.kg - a.kg || b.registros - a.registros);
}

export interface Comparacao { atual: number; anterior: number; diferenca: number; percentual: number | null }
/** Variação percentual só quando o período anterior tem valor (sem divisão por zero). */
export function comparar(atual: number, anterior: number): Comparacao {
  return { atual, anterior, diferenca: r3(atual - anterior), percentual: anterior > 0 ? Math.round(((atual - anterior) / anterior) * 1000) / 10 : null };
}

/** Número de eventos por mês do ano. */
export function eventosPorMes(eventos: Evento[], ano: number): number[] {
  const n = Array<number>(12).fill(0);
  for (const e of doAno(eventos, ano)) n[mesDe(e.data) - 1]!++;
  return n;
}

/** Anos que têm algum registro (colheita ou evento), do mais recente para o mais antigo; inclui o ano atual. */
export function anosComRegistros(colheitas: Colheita[], eventos: Evento[], anoAtual: number): number[] {
  const anos = new Set<number>([anoAtual]);
  for (const x of [...colheitas, ...eventos]) anos.add(anoDe(x.data));
  return [...anos].sort((a, b) => b - a);
}
