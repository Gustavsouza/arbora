import { describe, expect, it } from 'vitest';
import { hojeISO, somarDias } from '@/dominio/datas';
import { codigoDaUnidade, esquemaColheita, esquemaCultura, esquemaEvento, esquemaPlantio } from './esquemas';

const hoje = hojeISO();
const colheitaBase = { culturaId: 'c', plantioId: '', data: hoje, quantidade: '2,5', unidade: 'kg', destino: 'venda', qualidade: '', plantasColhidas: '', observacoes: '' };

describe('colheita', () => {
  it('aceita vírgula decimal e converte vazios em null', () => {
    const r = esquemaColheita.parse(colheitaBase);
    expect(r).toMatchObject({ quantidade: 2.5, plantioId: null, qualidade: null, plantasColhidas: null, observacoes: null });
  });

  it('recusa quantidade zero ou vazia, data futura e plantas fracionadas', () => {
    expect(esquemaColheita.safeParse({ ...colheitaBase, quantidade: '0' }).success).toBe(false);
    expect(esquemaColheita.safeParse({ ...colheitaBase, quantidade: '' }).success).toBe(false);
    expect(esquemaColheita.safeParse({ ...colheitaBase, data: somarDias(hoje, 1) }).success).toBe(false);
    expect(esquemaColheita.safeParse({ ...colheitaBase, plantasColhidas: '1,5' }).success).toBe(false);
  });
});

describe('evento', () => {
  it('exige cultura e tipo', () => {
    const r = esquemaEvento.safeParse({ culturaId: '', plantioId: '', tipo: '', data: hoje, intensidade: '', plantasAfetadas: '', clima: '', observacoes: '', acaoRealizada: '' });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(['culturaId', 'tipo']);
    expect(r.error?.issues[0]?.message).toBe('Escolha a planta.');
  });
});

describe('plantio e cultura', () => {
  it('plantio: horas de sol entre 0 e 24, data opcional', () => {
    const base = { quantidade: '15', dataPlantio: '', estagio: 'jovem', localizacao: ' Perto do açude ', exposicaoSolarHoras: '6,5', estadoAtual: '', observacoes: '' };
    expect(esquemaPlantio.parse(base)).toMatchObject({ quantidade: 15, dataPlantio: null, localizacao: 'Perto do açude', exposicaoSolarHoras: 6.5 });
    expect(esquemaPlantio.safeParse({ ...base, exposicaoSolarHoras: '25' }).success).toBe(false);
  });

  it('cultura: dias mínimo ≤ máximo', () => {
    const base = {
      nome: 'Milho', grupo: 'Anual', descricao: '', floracaoEsperada: '', colheitaEsperada: '', floracaoPadrao: 'apos_plantio', colheitaPadrao: 'apos_plantio',
      mesesFloracao: [], mesesFrutificacao: [], mesesColheita: [], floracaoDiasMin: '70', floracaoDiasMax: '45', colheitaDiasMin: '', colheitaDiasMax: '', observacoes: '',
    };
    expect(esquemaCultura.safeParse(base).error?.issues[0]?.path).toEqual(['floracaoDiasMax']);
  });

  it('código da unidade sem acento nem espaço', () => {
    expect(codigoDaUnidade('Sacas de 20 kg')).toBe('sacas_de_20_kg');
    expect(codigoDaUnidade('Maços grandes')).toBe('macos_grandes');
  });
});
