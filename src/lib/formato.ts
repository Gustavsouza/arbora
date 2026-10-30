// Números no jeito brasileiro.
export const numero = (n: number, casas = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: casas });
export const kg = (n: number) => `${numero(n, n >= 100 ? 0 : 2)} kg`;
export const percentual = (n: number) => `${numero(n, 1)}%`;
export const plural = (n: number, um: string, varios: string) => `${numero(n, 0)} ${n === 1 ? um : varios}`;

/** Ordena textos em português (acentos e maiúsculas não atrapalham). */
export const comparaTexto = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

/** Busca sem acento e sem diferença de maiúsculas. */
export const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Número para preencher um campo editável: sem separador de milhar, vírgula decimal ("1234,5"). */
export const paraCampo = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n).replace('.', ','));
