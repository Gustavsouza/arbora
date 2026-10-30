// Calendário de referência das culturas. Regra de ouro: só mostra o que está cadastrado — meses informados (estimados
// pela estação da planilha ou confirmados pelo proprietário) e janelas "X–Y dias após o plantio" com data de plantio.
// Nunca transforma "Variável", "Várias floradas" etc. em meses.
import { dataValida, diasEntre, mesDe, somarDias } from './datas';
import type { Cultura, DataISO, Fase, Padrao, Plantio } from './tipos';

export const FASES: Fase[] = ['floracao', 'frutificacao', 'colheita'];

export function mesesDaFase(c: Cultura, fase: Fase): number[] {
  return fase === 'floracao' ? c.mesesFloracao : fase === 'frutificacao' ? c.mesesFrutificacao : c.mesesColheita;
}

export function padraoDaFase(c: Cultura, fase: Fase): Padrao | null {
  // A planilha não descreve frutificação: só há o que o proprietário marcar.
  return fase === 'floracao' ? c.floracaoPadrao : fase === 'colheita' ? c.colheitaPadrao : null;
}

export function textoDaFase(c: Cultura, fase: Fase): string | null {
  return fase === 'floracao' ? c.floracaoEsperada : fase === 'colheita' ? c.colheitaEsperada : null;
}

export const previstaNoMes = (c: Cultura, fase: Fase, mes: number) => mesesDaFase(c, fase).includes(mes);

/** Mês seguinte/anterior em volta do ano (dez → jan). */
export const mesMais = (mes: number, n: number) => ((((mes - 1 + n) % 12) + 12) % 12) + 1;

/** Meses em que uma janela começa (o mês anterior não faz parte). Janela de 12 meses não tem começo. */
export function iniciosDeJanela(meses: number[]): number[] {
  if (meses.length >= 12) return [];
  return meses.filter((m) => !meses.includes(mesMais(m, -1)));
}

/** "set. a fev.", "mar. a ago.", "out." — junta meses seguidos, inclusive passando de dezembro para janeiro. */
export function descreverMeses(meses: number[], curto: (m: number) => string): string {
  if (meses.length === 0) return '';
  if (meses.length >= 12) return 'o ano todo';
  const partes = iniciosDeJanela(meses).map((inicio) => {
    let fim = inicio;
    while (meses.includes(mesMais(fim, 1)) && mesMais(fim, 1) !== inicio) fim = mesMais(fim, 1);
    return fim === inicio ? curto(inicio) : `${curto(inicio)} a ${curto(fim)}`;
  });
  return partes.join(', ');
}

export interface JanelaDoPlantio { culturaId: string; plantioId: string; fase: Fase; inicio: DataISO; fim: DataISO }

/** Janelas calculadas pela data do plantio (só culturas "X–Y dias após a semeadura" com data válida). */
export function janelasDoPlantio(c: Cultura, plantios: Plantio[]): JanelaDoPlantio[] {
  const out: JanelaDoPlantio[] = [];
  for (const p of plantios) {
    if (p.culturaId !== c.id || !dataValida(p.dataPlantio)) continue;
    for (const [fase, dias, padrao] of [['floracao', c.floracaoDias, c.floracaoPadrao], ['colheita', c.colheitaDias, c.colheitaPadrao]] as const) {
      if (padrao !== 'apos_plantio' || !dias || dias.min === null) continue;
      out.push({ culturaId: c.id, plantioId: p.id, fase, inicio: somarDias(p.dataPlantio, dias.min), fim: somarDias(p.dataPlantio, dias.max ?? dias.min) });
    }
  }
  return out;
}

export const janelaAberta = (j: JanelaDoPlantio, hoje: DataISO) => j.inicio <= hoje && hoje <= j.fim;
export const janelaNoMes = (j: JanelaDoPlantio, ano: number, mes: number) => {
  const primeiro = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const ultimo = somarDias(`${mes === 12 ? ano + 1 : ano}-${String(mesMais(mes, 1)).padStart(2, '0')}-01`, -1);
  return j.inicio <= ultimo && j.fim >= primeiro;
};

export interface Previsao {
  culturaId: string;
  fase: Fase;
  /** Mês (1–12) do início previsto. */
  mes: number;
  /** Quantos meses à frente (1 = mês que vem). */
  emMeses: number;
  /** estimado = meses vindos da estação da planilha; confirmado = ajustado pelo proprietário; plantio = pela data do plantio. */
  origem: 'estimado' | 'confirmado' | 'plantio';
  inicio?: DataISO;
  fim?: DataISO;
}

/** Próximos começos de floração/frutificação/colheita nos próximos `meses` meses (referência aproximada). */
export function proximasPrevisoes(culturas: Cultura[], plantios: Plantio[], hoje: DataISO, meses = 3): Previsao[] {
  const mesAtual = mesDe(hoje);
  const out: Previsao[] = [];
  for (const c of culturas) {
    if (!c.ativo) continue;
    for (const fase of FASES) {
      const inicios = iniciosDeJanela(mesesDaFase(c, fase));
      for (let n = 1; n <= meses; n++) {
        const mes = mesMais(mesAtual, n);
        if (inicios.includes(mes)) out.push({ culturaId: c.id, fase, mes, emMeses: n, origem: c.mesesConfirmados ? 'confirmado' : 'estimado' });
      }
    }
    for (const j of janelasDoPlantio(c, plantios)) {
      const faltam = diasEntre(hoje, j.inicio);
      if (faltam > 0 && faltam <= meses * 31) {
        const emMeses = Math.max(1, (Number(j.inicio.slice(0, 4)) - Number(hoje.slice(0, 4))) * 12 + mesDe(j.inicio) - mesAtual);
        out.push({ culturaId: c.id, fase: j.fase, mes: mesDe(j.inicio), emMeses, origem: 'plantio', inicio: j.inicio, fim: j.fim });
      }
    }
  }
  return out.sort((a, b) => a.emMeses - b.emMeses || (a.inicio ?? '').localeCompare(b.inicio ?? ''));
}
