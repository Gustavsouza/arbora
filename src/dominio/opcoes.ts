// Rótulos das listas fixas (os mesmos valores das restrições do banco em 0001_estrutura_e_culturas.sql).
import type { Destino, EstadoAtual, Estagio, Fase, Intensidade, Padrao, Qualidade, TipoEvento } from './tipos';

export const NOME_DO_SISTEMA = 'Arbora';

export const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'] as const;
export const nomeDoMes = (m: number) => MESES[m - 1] ?? '';
export const mesCurto = (m: number) => MESES_CURTOS[m - 1] ?? '';

export const PADRAO: Record<Padrao, string> = {
  estacional: 'Por estação',
  varias_epocas: 'Várias épocas',
  continua: 'Ao longo do ano',
  apos_plantio: 'Conta a partir do plantio',
  variavel: 'Variável',
  a_confirmar: 'A confirmar',
  nao_se_aplica: 'Não se aplica',
};

export const FASE: Record<Fase, string> = { floracao: 'Floração', frutificacao: 'Frutificação', colheita: 'Colheita' };

export const ESTAGIO: Record<Estagio, string> = {
  muda_recente: 'Muda recente', jovem: 'Jovem', em_crescimento: 'Em crescimento', adulto: 'Adulto',
};

export const ESTADO: Record<EstadoAtual, string> = {
  bom: 'Bom', florindo: 'Florindo', frutificando: 'Com frutos', produzindo: 'Produzindo', precisa_atencao: 'Precisa de atenção',
};

export interface InfoEvento { rotulo: string; grupo: 'ciclo' | 'manejo' | 'problema' }
export const TIPO_EVENTO: Record<TipoEvento, InfoEvento> = {
  floracao_inicio: { rotulo: 'Primeira floração', grupo: 'ciclo' },
  floracao_pico: { rotulo: 'Pico da floração', grupo: 'ciclo' },
  floracao_fim: { rotulo: 'Fim da floração', grupo: 'ciclo' },
  sem_floracao: { rotulo: 'Não floresceu', grupo: 'ciclo' },
  frutificacao: { rotulo: 'Frutos formados', grupo: 'ciclo' },
  fruto_maduro: { rotulo: 'Fruto maduro', grupo: 'ciclo' },
  colheita_inicio: { rotulo: 'Primeira colheita', grupo: 'ciclo' },
  colheita_fim: { rotulo: 'Última colheita', grupo: 'ciclo' },
  poda: { rotulo: 'Poda', grupo: 'manejo' },
  adubacao: { rotulo: 'Adubação', grupo: 'manejo' },
  irrigacao: { rotulo: 'Irrigação', grupo: 'manejo' },
  problema: { rotulo: 'Problema na planta', grupo: 'problema' },
  praga_doenca: { rotulo: 'Praga ou doença', grupo: 'problema' },
  outro: { rotulo: 'Outro', grupo: 'manejo' },
};
export const TIPOS_EVENTO = Object.keys(TIPO_EVENTO) as TipoEvento[];
/** Eventos que contam como "floração observada" no mês. */
export const EVENTOS_DE_FLORACAO: TipoEvento[] = ['floracao_inicio', 'floracao_pico', 'floracao_fim'];
export const EVENTOS_DE_FRUTO: TipoEvento[] = ['frutificacao', 'fruto_maduro'];
export const EVENTOS_DE_ALERTA: TipoEvento[] = ['problema', 'praga_doenca'];

export const INTENSIDADE: Record<Intensidade, string> = { fraca: 'Fraca / pouca', moderada: 'Moderada', forte: 'Forte / muita' };

export const DESTINO: Record<Destino, string> = {
  consumo_familiar: 'Consumo familiar', venda: 'Venda', doacao: 'Doação', conserva: 'Conserva / congelamento',
  descarte: 'Perda / descarte', outro: 'Outro',
};
export const DESTINOS = Object.keys(DESTINO) as Destino[];

export const QUALIDADE: Record<Qualidade, string> = { otima: 'Ótima', boa: 'Boa', regular: 'Regular', ruim: 'Ruim' };

/** Sugestões rápidas de clima (o campo continua livre). */
export const CLIMAS = ['Sol', 'Nublado', 'Chuva', 'Garoa', 'Frio', 'Calor', 'Vento', 'Seca', 'Geada'] as const;
