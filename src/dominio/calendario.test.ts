import { describe, expect, it } from 'vitest';
import { descreverMeses, iniciosDeJanela, janelaNoMes, janelasDoPlantio, proximasPrevisoes } from './calendario';
import { dataValida, dentroDoPeriodo, hojeISO, idadeAproximada, periodoAnterior, quandoFoi } from './datas';
import { cultura, plantio } from './fabrica.test-util';
import { mesCurto } from './opcoes';

describe('janelas de meses', () => {
  it('descreve janelas que passam de dezembro para janeiro', () => {
    expect(descreverMeses([1, 2, 9, 10, 11, 12], mesCurto)).toBe('Set a Fev');
    expect(descreverMeses([3, 4, 5, 6, 7, 8], mesCurto)).toBe('Mar a Ago');
    expect(descreverMeses([1, 5, 6], mesCurto)).toBe('Jan, Mai a Jun');
    expect(descreverMeses([], mesCurto)).toBe('');
    expect(descreverMeses([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], mesCurto)).toBe('o ano todo');
  });

  it('início de janela considera a virada do ano', () => {
    expect(iniciosDeJanela([12, 1, 2])).toEqual([12]);
    expect(iniciosDeJanela([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toEqual([]);
  });
});

describe('janelas após o plantio', () => {
  const amendoim = cultura({ id: 'am', floracaoPadrao: 'apos_plantio', colheitaPadrao: 'apos_plantio', floracaoDias: { min: 25, max: 45 }, colheitaDias: { min: 90, max: 130 } });

  it('calcula a partir da data do plantio', () => {
    const j = janelasDoPlantio(amendoim, [plantio({ id: 'p', culturaId: 'am', dataPlantio: '2026-09-01' })]);
    expect(j).toEqual([
      { culturaId: 'am', plantioId: 'p', fase: 'floracao', inicio: '2026-09-26', fim: '2026-10-16' },
      { culturaId: 'am', plantioId: 'p', fase: 'colheita', inicio: '2026-11-30', fim: '2027-01-09' },
    ]);
    expect(janelaNoMes(j[1]!, 2026, 12)).toBe(true);
    expect(janelaNoMes(j[1]!, 2026, 10)).toBe(false);
  });

  it('sem data de plantio (ou data inválida) não há janela', () => {
    expect(janelasDoPlantio(amendoim, [plantio({ id: 'p', culturaId: 'am' }), plantio({ id: 'q', culturaId: 'am', dataPlantio: '2026-02-31' })])).toEqual([]);
  });
});

describe('próximas previsões', () => {
  it('só culturas com meses cadastrados ou janela de plantio; "Variável" nunca vira previsão', () => {
    const laranja = cultura({ id: 'lar', floracaoPadrao: 'estacional', mesesFloracao: [9, 10, 11], colheitaPadrao: 'estacional', mesesColheita: [3, 4, 5, 6, 7, 8] });
    const graviola = cultura({ id: 'grav' });
    const nespera = cultura({ id: 'nes', mesesFloracao: [3, 4, 5, 6, 7, 8], mesesConfirmados: true });
    const p = proximasPrevisoes([laranja, graviola, nespera], [], '2026-01-15', 3);
    expect(p).toEqual([
      { culturaId: 'lar', fase: 'colheita', mes: 3, emMeses: 2, origem: 'estimado' },
      { culturaId: 'nes', fase: 'floracao', mes: 3, emMeses: 2, origem: 'confirmado' },
    ]);
  });

  it('cultura inativa não aparece', () => {
    const c = cultura({ id: 'x', mesesFloracao: [2], ativo: false });
    expect(proximasPrevisoes([c], [], '2026-01-15')).toEqual([]);
  });
});

describe('datas', () => {
  it('hoje é o dia de Brasília, mesmo quando em UTC já é amanhã', () => {
    expect(hojeISO(new Date('2026-10-31T02:30:00Z'))).toBe('2026-10-30');
    expect(hojeISO(new Date('2026-10-31T03:30:00Z'))).toBe('2026-10-31');
  });

  it('idade aproximada do plantio', () => {
    expect(idadeAproximada('2025-07-30', '2026-10-30')).toBe('1 ano e 3 meses');
    expect(idadeAproximada('2026-10-01', '2026-10-30')).toBe('29 dias');
    expect(idadeAproximada('2024-10-30', '2026-10-30')).toBe('2 anos');
    expect(idadeAproximada('2026-08-31', '2026-10-30')).toBe('1 mês');
    expect(idadeAproximada('2027-01-01', '2026-10-30')).toBeNull();
    expect(idadeAproximada(null, '2026-10-30')).toBeNull();
  });

  it('valida datas de verdade', () => {
    expect(dataValida('2026-02-28')).toBe(true);
    expect(dataValida('2026-02-30')).toBe(false);
    expect(dataValida('30/10/2026')).toBe(false);
  });

  it('período e período anterior de mesma duração', () => {
    expect(dentroDoPeriodo('2026-03-01', { de: '2026-03-01', ate: '2026-03-31' })).toBe(true);
    expect(dentroDoPeriodo('2026-04-01', { de: '2026-03-01', ate: '2026-03-31' })).toBe(false);
    expect(periodoAnterior({ de: '2026-03-01', ate: '2026-03-31' })).toEqual({ de: '2026-01-29', ate: '2026-02-28' });
    expect(periodoAnterior({ de: '2026-03-01' })).toBeNull();
  });

  it('quando foi', () => {
    expect(quandoFoi('2026-10-30', '2026-10-30')).toBe('hoje');
    expect(quandoFoi('2026-10-29', '2026-10-30')).toBe('ontem');
    expect(quandoFoi('2026-10-20', '2026-10-30')).toBe('há 10 dias');
    expect(quandoFoi('2026-01-02', '2026-10-30')).toBe('02/01/2026');
  });
});
