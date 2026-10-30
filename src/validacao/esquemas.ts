// Validação dos formulários (os mesmos limites das restrições do banco: o banco confere de novo).
// Os campos chegam como texto (inputs) e saem já no formato do domínio.
import { z } from 'zod';
import { dataValida, hojeISO } from '@/dominio/datas';
import { DESTINOS, TIPOS_EVENTO } from '@/dominio/opcoes';
import type { Destino, EstadoAtual, Estagio, Intensidade, Padrao, Qualidade, TipoEvento } from '@/dominio/tipos';

const textoOpcional = (max: number) =>
  z.string().trim().max(max, `Use no máximo ${max} caracteres.`).transform((v) => v || null);

/** "2,5" e "2.5" valem. Vazio = null. */
const numeroOpcional = (min: number, max: number, msg: string, inteiro = false) =>
  z.string().trim().transform((v, ctx) => {
    if (!v) return null;
    const n = Number(v.replace(',', '.'));
    if (!Number.isFinite(n) || n < min || n > max || (inteiro && !Number.isInteger(n))) {
      ctx.addIssue({ code: 'custom', message: msg });
      return z.NEVER;
    }
    return n;
  });

const dataNaoFutura = (rotulo: string) =>
  z.string().refine(dataValida, `Informe a ${rotulo}.`).refine((d) => d <= hojeISO(), 'A data não pode ser depois de hoje.');

const dataOpcionalNaoFutura = z.string().transform((v, ctx) => {
  if (!v) return null;
  if (!dataValida(v)) { ctx.addIssue({ code: 'custom', message: 'Data inválida.' }); return z.NEVER; }
  if (v > hojeISO()) { ctx.addIssue({ code: 'custom', message: 'A data não pode ser depois de hoje.' }); return z.NEVER; }
  return v;
});

const opcional = <T extends string>(valores: readonly T[]) =>
  z.union([z.literal(''), z.enum(valores as [T, ...T[]])]).transform((v) => (v === '' ? null : v));

const obrigatorio = (msg: string) => z.string().min(1, msg);

// ---------------------------------------------------------------------------------------------------------------------

export const esquemaEvento = z.object({
  culturaId: obrigatorio('Escolha a cultura.'),
  plantioId: z.string().transform((v) => v || null),
  tipo: z.enum(TIPOS_EVENTO as [TipoEvento, ...TipoEvento[]], { error: 'Escolha o que aconteceu.' }),
  data: dataNaoFutura('data do acontecimento'),
  intensidade: opcional<Intensidade>(['fraca', 'moderada', 'forte']),
  plantasAfetadas: numeroOpcional(1, 100000, 'Use um número inteiro de 1 a 100.000.', true),
  clima: textoOpcional(200),
  observacoes: textoOpcional(2000),
  acaoRealizada: textoOpcional(1000),
});
export type EntradaEvento = z.input<typeof esquemaEvento>;
export type SaidaEvento = z.output<typeof esquemaEvento>;

export const esquemaColheita = z.object({
  culturaId: obrigatorio('Escolha a cultura.'),
  plantioId: z.string().transform((v) => v || null),
  data: dataNaoFutura('data da colheita'),
  quantidade: numeroOpcional(0.001, 1000000, 'Informe uma quantidade maior que zero.').refine((v) => v !== null, 'Informe a quantidade colhida.')
    .transform((v) => v as number),
  unidade: obrigatorio('Escolha a unidade.'),
  destino: z.enum(DESTINOS as [Destino, ...Destino[]], { error: 'Escolha o destino.' }),
  qualidade: opcional<Qualidade>(['otima', 'boa', 'regular', 'ruim']),
  plantasColhidas: numeroOpcional(1, 100000, 'Use um número inteiro de 1 a 100.000.', true),
  observacoes: textoOpcional(2000),
});
export type EntradaColheita = z.input<typeof esquemaColheita>;
export type SaidaColheita = z.output<typeof esquemaColheita>;

export const esquemaPlantio = z.object({
  quantidade: numeroOpcional(1, 100000, 'Use um número inteiro de 1 a 100.000.', true),
  dataPlantio: dataOpcionalNaoFutura,
  estagio: opcional<Estagio>(['muda_recente', 'jovem', 'em_crescimento', 'adulto']),
  localizacao: textoOpcional(120),
  exposicaoSolarHoras: numeroOpcional(0, 24, 'Use um número de horas entre 0 e 24.'),
  estadoAtual: opcional<EstadoAtual>(['bom', 'florindo', 'frutificando', 'produzindo', 'precisa_atencao']),
  observacoes: textoOpcional(2000),
});
export type EntradaPlantio = z.input<typeof esquemaPlantio>;
export type SaidaPlantio = z.output<typeof esquemaPlantio>;

const PADROES: Padrao[] = ['estacional', 'varias_epocas', 'continua', 'apos_plantio', 'variavel', 'a_confirmar', 'nao_se_aplica'];
const dias = numeroOpcional(0, 3650, 'Use de 0 a 3.650 dias.', true);
const mes = z.number().int().min(1).max(12);

export const esquemaCultura = z.object({
  nome: z.string().trim().min(2, 'Escreva o nome (pelo menos 2 letras).').max(80, 'Use no máximo 80 caracteres.'),
  grupo: z.string().trim().min(2, 'Escreva o grupo, por exemplo: Frutífera.').max(60, 'Use no máximo 60 caracteres.'),
  descricao: textoOpcional(1000),
  floracaoEsperada: textoOpcional(200),
  colheitaEsperada: textoOpcional(200),
  floracaoPadrao: z.enum(PADROES as [Padrao, ...Padrao[]]),
  colheitaPadrao: z.enum(PADROES as [Padrao, ...Padrao[]]),
  mesesFloracao: z.array(mes),
  mesesFrutificacao: z.array(mes),
  mesesColheita: z.array(mes),
  floracaoDiasMin: dias, floracaoDiasMax: dias, colheitaDiasMin: dias, colheitaDiasMax: dias,
  observacoes: textoOpcional(2000),
}).superRefine((v, ctx) => {
  if (v.floracaoDiasMin !== null && v.floracaoDiasMax !== null && v.floracaoDiasMin > v.floracaoDiasMax)
    ctx.addIssue({ code: 'custom', path: ['floracaoDiasMax'], message: 'O máximo não pode ser menor que o mínimo.' });
  if (v.colheitaDiasMin !== null && v.colheitaDiasMax !== null && v.colheitaDiasMin > v.colheitaDiasMax)
    ctx.addIssue({ code: 'custom', path: ['colheitaDiasMax'], message: 'O máximo não pode ser menor que o mínimo.' });
});
export type EntradaCultura = z.input<typeof esquemaCultura>;
export type SaidaCultura = z.output<typeof esquemaCultura>;

export const esquemaUnidade = z.object({
  nome: z.string().trim().min(1, 'Escreva o nome da unidade.').max(30, 'Use no máximo 30 caracteres.'),
  fatorKg: numeroOpcional(0.000001, 100000, 'Use um número maior que zero, por exemplo 20 (para uma saca de 20 kg).'),
});
export type EntradaUnidade = z.input<typeof esquemaUnidade>;
export type SaidaUnidade = z.output<typeof esquemaUnidade>;

/** Código da unidade a partir do nome: "Sacas de 20 kg" → "sacas_de_20_kg". */
export function codigoDaUnidade(nome: string): string {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'unidade';
}
