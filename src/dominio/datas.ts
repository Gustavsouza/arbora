// Datas do sítio: tudo no calendário de Brasília (America/Sao_Paulo). Datas de registro são 'aaaa-mm-dd', sem hora.
import { addDays, differenceInCalendarDays, differenceInCalendarMonths, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DataISO } from './tipos';

export const FUSO = 'America/Sao_Paulo';

/** Hoje em Brasília, mesmo se o aparelho estiver em outro fuso. */
export function hojeISO(agora: Date = new Date()): DataISO {
  // en-CA formata como aaaa-mm-dd.
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
}

export const anoDe = (d: DataISO) => Number(d.slice(0, 4));
export const mesDe = (d: DataISO) => Number(d.slice(5, 7));

/** Data de calendário como Date local (meia-noite), só para contas de dias. */
export const paraDate = (d: DataISO) => parseISO(d);
export const paraISO = (d: Date): DataISO => format(d, 'yyyy-MM-dd');

export const somarDias = (d: DataISO, dias: number): DataISO => paraISO(addDays(paraDate(d), dias));
export const diasEntre = (de: DataISO, ate: DataISO) => differenceInCalendarDays(paraDate(ate), paraDate(de));

export function dataValida(d: string | null | undefined): d is DataISO {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const x = paraDate(d);
  return !Number.isNaN(x.getTime()) && paraISO(x) === d;
}

/** "12/03/2026" */
export const dataCurta = (d: DataISO) => format(paraDate(d), 'dd/MM/yyyy');
/** "12 de mar." */
export const diaEMes = (d: DataISO) => format(paraDate(d), "d 'de' MMM", { locale: ptBR });
/** "quinta, 12 de março" */
export const dataPorExtenso = (d: DataISO) => format(paraDate(d), "EEEE, d 'de' MMMM", { locale: ptBR });

/** "hoje", "ontem", "há 5 dias", ou a data. */
export function quandoFoi(d: DataISO, hoje: DataISO = hojeISO()): string {
  const n = diasEntre(d, hoje);
  if (n === 0) return 'hoje';
  if (n === 1) return 'ontem';
  if (n > 1 && n < 31) return `há ${n} dias`;
  return dataCurta(d);
}

/** Idade aproximada do plantio: "8 meses", "2 anos e 3 meses". null se a data não for válida ou estiver no futuro. */
export function idadeAproximada(dataPlantio: DataISO | null, hoje: DataISO = hojeISO()): string | null {
  if (!dataValida(dataPlantio) || dataPlantio > hoje) return null;
  const meses = differenceInCalendarMonths(paraDate(hoje), paraDate(dataPlantio)) - (Number(hoje.slice(8)) < Number(dataPlantio.slice(8)) ? 1 : 0);
  if (meses < 1) {
    const dias = diasEntre(dataPlantio, hoje);
    return dias === 1 ? '1 dia' : `${dias} dias`;
  }
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const txtAnos = anos === 1 ? '1 ano' : `${anos} anos`;
  const txtMeses = resto === 1 ? '1 mês' : `${resto} meses`;
  if (anos === 0) return txtMeses;
  return resto === 0 ? txtAnos : `${txtAnos} e ${txtMeses}`;
}

/** Filtro de período com limites inclusivos; qualquer limite pode faltar. Compara as datas como texto (aaaa-mm-dd). */
export interface Periodo { de?: DataISO | null; ate?: DataISO | null }
export function dentroDoPeriodo(d: DataISO, p: Periodo): boolean {
  if (p.de && d < p.de) return false;
  if (p.ate && d > p.ate) return false;
  return true;
}

/** Período de mesma duração imediatamente anterior (para comparação). Precisa dos dois limites. */
export function periodoAnterior(p: Periodo): { de: DataISO; ate: DataISO } | null {
  if (!p.de || !p.ate || p.de > p.ate) return null;
  const dias = diasEntre(p.de, p.ate) + 1;
  return { de: somarDias(p.de, -dias), ate: somarDias(p.de, -1) };
}
