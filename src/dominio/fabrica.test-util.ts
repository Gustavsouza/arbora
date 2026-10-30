// Registros de teste (dados fictícios, só para os testes das regras).
import type { Colheita, Cultura, Evento, Plantio, Unidade } from './tipos';

export function cultura(p: Partial<Cultura> & { id: string }): Cultura {
  return {
    nome: p.id, grupo: 'Frutífera', descricao: null, floracaoEsperada: null, colheitaEsperada: null, floracaoPadrao: 'variavel',
    colheitaPadrao: 'variavel', mesesFloracao: [], mesesFrutificacao: [], mesesColheita: [], mesesConfirmados: false,
    floracaoDias: null, colheitaDias: null, observacoes: null, ativo: true, ...p,
  };
}

export function plantio(p: Partial<Plantio> & { id: string; culturaId: string }): Plantio {
  return { quantidade: null, dataPlantio: null, estagio: null, localizacao: null, exposicaoSolarHoras: null, estadoAtual: null, observacoes: null, atualizadoEm: '', ...p };
}

export function evento(p: Partial<Evento> & { id: string; culturaId: string; data: string }): Evento {
  return { plantioId: null, tipo: 'outro', intensidade: null, plantasAfetadas: null, clima: null, observacoes: null, acaoRealizada: null, criadoEm: '', ...p };
}

export function colheita(p: Partial<Colheita> & { id: string; culturaId: string; data: string; quantidade: number; unidade: string }): Colheita {
  return { plantioId: null, destino: 'consumo_familiar', qualidade: null, plantasColhidas: null, observacoes: null, criadoEm: '', ...p };
}

export const UNIDADES: Unidade[] = [
  { codigo: 'kg', nome: 'kg', fatorKg: 1, padrao: true },
  { codigo: 'g', nome: 'gramas', fatorKg: 0.001, padrao: true },
  { codigo: 'unidades', nome: 'unidades', fatorKg: null, padrao: true },
  { codigo: 'cachos', nome: 'cachos', fatorKg: null, padrao: true },
];
