// Tipos do domínio (nomes do app). Os nomes das colunas do banco ficam só em src/servicos.

export type Padrao = 'estacional' | 'varias_epocas' | 'continua' | 'apos_plantio' | 'variavel' | 'a_confirmar' | 'nao_se_aplica';
export type Estagio = 'muda_recente' | 'jovem' | 'em_crescimento' | 'adulto';
export type EstadoAtual = 'bom' | 'florindo' | 'frutificando' | 'produzindo' | 'precisa_atencao';
export type TipoEvento =
  | 'floracao_inicio' | 'floracao_pico' | 'floracao_fim' | 'sem_floracao' | 'frutificacao' | 'fruto_maduro'
  | 'colheita_inicio' | 'colheita_fim' | 'problema' | 'praga_doenca' | 'poda' | 'adubacao' | 'irrigacao' | 'outro';
export type Intensidade = 'fraca' | 'moderada' | 'forte';
export type Destino = 'consumo_familiar' | 'venda' | 'doacao' | 'conserva' | 'descarte' | 'outro';
export type Qualidade = 'otima' | 'boa' | 'regular' | 'ruim';
export type Fase = 'floracao' | 'frutificacao' | 'colheita';

/** Data de calendário 'aaaa-mm-dd' (sem hora nem fuso). */
export type DataISO = string;

export interface Cultura {
  id: string;
  nome: string;
  grupo: string;
  descricao: string | null;
  floracaoEsperada: string | null;
  colheitaEsperada: string | null;
  floracaoPadrao: Padrao;
  colheitaPadrao: Padrao;
  mesesFloracao: number[];
  mesesFrutificacao: number[];
  mesesColheita: number[];
  /** false = meses estimados pela estação escrita na planilha; true = ajustados pelo proprietário. */
  mesesConfirmados: boolean;
  floracaoDias: Intervalo | null;
  colheitaDias: Intervalo | null;
  observacoes: string | null;
  ativo: boolean;
}

export interface Intervalo { min: number | null; max: number | null }

export interface Plantio {
  id: string;
  culturaId: string;
  quantidade: number | null;
  dataPlantio: DataISO | null;
  estagio: Estagio | null;
  localizacao: string | null;
  exposicaoSolarHoras: number | null;
  estadoAtual: EstadoAtual | null;
  observacoes: string | null;
  atualizadoEm: string;
}

export interface Evento {
  id: string;
  culturaId: string;
  plantioId: string | null;
  tipo: TipoEvento;
  data: DataISO;
  intensidade: Intensidade | null;
  plantasAfetadas: number | null;
  clima: string | null;
  observacoes: string | null;
  acaoRealizada: string | null;
  criadoEm: string;
}

export interface Colheita {
  id: string;
  culturaId: string;
  plantioId: string | null;
  data: DataISO;
  quantidade: number;
  unidade: string;
  destino: Destino;
  qualidade: Qualidade | null;
  plantasColhidas: number | null;
  observacoes: string | null;
  criadoEm: string;
}

export interface Unidade {
  codigo: string;
  nome: string;
  /** Só kg e g (ou o que o proprietário declarar) convertem para kg. null = nunca entra em total de kg. */
  fatorKg: number | null;
  padrao: boolean;
}

/** Resultado de uma operação com o banco: o erro já vem em frase para o usuário. */
export type Resultado<T> = { ok: true; valor: T } | { ok: false; mensagem: string };
