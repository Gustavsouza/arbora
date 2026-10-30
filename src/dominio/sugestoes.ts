// "Inteligência" por regras: cruza o calendário cadastrado com os registros. Toda sugestão diz de onde veio (motivo)
// e nenhuma afirma que a planta está atrasada, doente ou produzindo sem um registro correspondente.
import { janelaAberta, janelasDoPlantio, mesesDaFase, textoDaFase } from './calendario';
import { dataCurta, diasEntre, idadeAproximada, mesDe, anoDe } from './datas';
import { EVENTOS_DE_ALERTA, EVENTOS_DE_FLORACAO, TIPO_EVENTO } from './opcoes';
import type { Colheita, Cultura, DataISO, Evento, Fase, Plantio } from './tipos';

/** Dias sem nenhum registro para sugerir uma atualização. */
export const DIAS_SEM_REGISTRO = 60;
/** Problemas registrados nesse prazo aparecem em "precisam de atenção". */
export const DIAS_DE_ALERTA = 30;

export interface Sugestao {
  chave: string;
  culturaId: string;
  titulo: string;
  texto: string;
  /** Por que o sistema mostra isso (explicável). */
  motivo: string;
  /** Já há registro correspondente no mês (aparece antes das previsões). */
  registrado?: boolean;
}

export interface Dados { culturas: Cultura[]; plantios: Plantio[]; eventos: Evento[]; colheitas: Colheita[] }

const doMes = (d: DataISO, hoje: DataISO) => anoDe(d) === anoDe(hoje) && mesDe(d) === mesDe(hoje);

function motivoDoCalendario(c: Cultura, fase: Fase): string {
  const texto = textoDaFase(c, fase);
  const origem = c.mesesConfirmados ? 'meses marcados por você' : 'meses aproximados pela estação escrita na planilha';
  return texto ? `Pela planilha: “${texto}” (${origem}).` : `Pelo calendário: ${origem}.`;
}

/** Último registro (evento ou colheita) de cada cultura. */
export function ultimoRegistro(dados: Pick<Dados, 'eventos' | 'colheitas'>): Map<string, DataISO> {
  const m = new Map<string, DataISO>();
  for (const x of [...dados.eventos, ...dados.colheitas]) {
    const atual = m.get(x.culturaId);
    if (!atual || x.data > atual) m.set(x.culturaId, x.data);
  }
  return m;
}

export interface Panorama {
  floracao: Sugestao[];
  colheita: Sugestao[];
  atencao: Sugestao[];
  semRegistro: { culturaId: string; dias: number | null }[];
}

/** "O que está acontecendo no pomar?" para o mês de `hoje`. */
export function panoramaDoMes(dados: Dados, hoje: DataISO): Panorama {
  const mes = mesDe(hoje);
  const ativas = dados.culturas.filter((c) => c.ativo);
  const floracao: Sugestao[] = [];
  const colheita: Sugestao[] = [];

  for (const c of ativas) {
    const eventosNoMes = dados.eventos.filter((e) => e.culturaId === c.id && doMes(e.data, hoje));
    const colheitasNoMes = dados.colheitas.filter((h) => h.culturaId === c.id && doMes(h.data, hoje));
    const janelas = janelasDoPlantio(c, dados.plantios).filter((j) => janelaAberta(j, hoje));

    const floracaoPrevista = mesesDaFase(c, 'floracao').includes(mes);
    const janelaFlor = janelas.find((j) => j.fase === 'floracao');
    if (floracaoPrevista || janelaFlor) {
      const vista = eventosNoMes.filter((e) => EVENTOS_DE_FLORACAO.includes(e.tipo)).sort((a, b) => b.data.localeCompare(a.data))[0];
      floracao.push({
        chave: `flor-${c.id}`, culturaId: c.id, registrado: Boolean(vista),
        titulo: vista ? `${c.nome}: florada anotada` : `${c.nome}: época de florada`,
        texto: vista ? `${TIPO_EVENTO[vista.tipo].rotulo} em ${dataCurta(vista.data)}.` : 'Já viu flores? Anote a data. Assim o calendário fica do jeito do seu sítio.',
        motivo: janelaFlor && !floracaoPrevista
          ? `Plantado em ${dataCurta(somenteData(dados.plantios, janelaFlor.plantioId))}: “${c.floracaoEsperada ?? ''}”, ou seja, entre ${dataCurta(janelaFlor.inicio)} e ${dataCurta(janelaFlor.fim)}.`
          : motivoDoCalendario(c, 'floracao'),
      });
    }

    const colheitaPrevista = mesesDaFase(c, 'colheita').includes(mes);
    const janelaColheita = janelas.find((j) => j.fase === 'colheita');
    if (colheitaPrevista || janelaColheita) {
      colheita.push({
        chave: `colh-${c.id}`, culturaId: c.id, registrado: colheitasNoMes.length > 0,
        titulo: colheitasNoMes.length ? `${c.nome}: colheita anotada` : `${c.nome}: época de colheita`,
        texto: colheitasNoMes.length
          ? `${colheitasNoMes.length} ${colheitasNoMes.length === 1 ? 'colheita anotada' : 'colheitas anotadas'} neste mês.`
          : 'Pelo calendário, é época de colheita. Já viu frutos maduros?',
        motivo: janelaColheita && !colheitaPrevista
          ? `Plantado em ${dataCurta(somenteData(dados.plantios, janelaColheita.plantioId))}: “${c.colheitaEsperada ?? ''}”, ou seja, entre ${dataCurta(janelaColheita.inicio)} e ${dataCurta(janelaColheita.fim)}.`
          : motivoDoCalendario(c, 'colheita'),
      });
    }
  }

  const atencao: Sugestao[] = [];
  const nome = new Map(dados.culturas.map((c) => [c.id, c.nome]));
  for (const p of dados.plantios) {
    if (p.estadoAtual !== 'precisa_atencao') continue;
    atencao.push({
      chave: `plantio-${p.id}`, culturaId: p.culturaId, titulo: `${nome.get(p.culturaId) ?? 'Planta'}${p.localizacao ? ` · ${p.localizacao}` : ''}`,
      texto: p.observacoes || 'Você marcou como “precisa de atenção”.', motivo: 'Você marcou assim em “Como está”.',
    });
  }
  const recentes = dados.eventos
    .filter((e) => EVENTOS_DE_ALERTA.includes(e.tipo) && diasEntre(e.data, hoje) >= 0 && diasEntre(e.data, hoje) <= DIAS_DE_ALERTA)
    .sort((a, b) => b.data.localeCompare(a.data));
  for (const e of recentes) {
    atencao.push({
      chave: `evento-${e.id}`, culturaId: e.culturaId, titulo: `${nome.get(e.culturaId) ?? 'Planta'}: ${TIPO_EVENTO[e.tipo].rotulo.toLowerCase()}`,
      texto: e.observacoes || e.acaoRealizada || 'Sem observações.', motivo: `Anotado em ${dataCurta(e.data)} (nos últimos ${DIAS_DE_ALERTA} dias).`,
    });
  }

  const ultimo = ultimoRegistro(dados);
  const semRegistro = ativas
    .map((c) => { const u = ultimo.get(c.id); return { culturaId: c.id, dias: u ? diasEntre(u, hoje) : null }; })
    .filter((x) => x.dias === null || x.dias > DIAS_SEM_REGISTRO);

  const registradosPrimeiro = (a: Sugestao, b: Sugestao) => Number(Boolean(b.registrado)) - Number(Boolean(a.registrado));
  return { floracao: floracao.sort(registradosPrimeiro), colheita: colheita.sort(registradosPrimeiro), atencao, semRegistro };
}

function somenteData(plantios: Plantio[], id: string): DataISO {
  return plantios.find((p) => p.id === id)?.dataPlantio ?? '';
}

/** Sugestões da página de uma cultura. */
export function sugestoesDaCultura(c: Cultura, dados: Dados, hoje: DataISO): Sugestao[] {
  const out: Sugestao[] = [];
  const doMesmo = { ...dados, culturas: [c] };
  const p = panoramaDoMes(doMesmo, hoje);
  out.push(...p.floracao, ...p.colheita, ...p.atencao);

  for (const pl of dados.plantios.filter((x) => x.culturaId === c.id && x.estagio && ['muda_recente', 'jovem'].includes(x.estagio))) {
    const idade = idadeAproximada(pl.dataPlantio, hoje);
    if (idade) {
      out.push({
        chave: `idade-${pl.id}`, culturaId: c.id, titulo: `Planta nova, com cerca de ${idade}`,
        texto: pl.localizacao ? `Local: ${pl.localizacao}.` : 'Planta nova pode demorar alguns anos para florescer. Anotar ajuda a acompanhar.',
        motivo: `Plantada em ${dataCurta(pl.dataPlantio!)}.`,
      });
    }
  }

  const sem = p.semRegistro[0];
  if (sem && c.ativo) {
    out.push({
      chave: `sem-${c.id}`, culturaId: c.id,
      titulo: sem.dias === null ? 'Ainda sem anotações' : `Sem anotações há ${sem.dias} dias`,
      texto: 'Que tal anotar como a planta está? Uma anotação rápida já ajuda.',
      motivo: `Nada anotado nos últimos ${DIAS_SEM_REGISTRO} dias.`,
    });
  }
  return out;
}
