import { describe, expect, it } from 'vitest';
import { colheita, cultura, evento, plantio } from './fabrica.test-util';
import { panoramaDoMes, sugestoesDaCultura } from './sugestoes';

const jab = cultura({ id: 'jab', nome: 'Jabuticaba', floracaoPadrao: 'estacional', mesesFloracao: [9, 10, 11, 12, 1, 2], floracaoEsperada: 'Primavera–verão; pode repetir' });
const lar = cultura({ id: 'lar', nome: 'Laranja Bahia', mesesColheita: [3, 4, 5, 6, 7, 8], colheitaEsperada: 'Outono–inverno (varia)' });
const grav = cultura({ id: 'grav', nome: 'Graviola' });
const vazio = { plantios: [], eventos: [], colheitas: [] };

describe('o que está acontecendo no pomar', () => {
  it('floração prevista no mês, explicando de onde vem', () => {
    const p = panoramaDoMes({ ...vazio, culturas: [jab, lar, grav] }, '2026-10-30');
    expect(p.floracao.map((s) => s.titulo)).toEqual(['Jabuticaba: período esperado de floração']);
    expect(p.floracao[0]!.motivo).toContain('Primavera–verão; pode repetir');
    expect(p.floracao[0]!.motivo).toContain('estimados pela estação');
    expect(p.colheita).toEqual([]);
  });

  it('com floração registrada no mês, mostra o registro em vez da pergunta', () => {
    const p = panoramaDoMes({ ...vazio, culturas: [jab], eventos: [evento({ id: 'e', culturaId: 'jab', tipo: 'floracao_inicio', data: '2026-10-12' })] }, '2026-10-30');
    expect(p.floracao[0]!.titulo).toBe('Floração registrada: Jabuticaba');
    expect(p.floracao[0]!.texto).toBe('Primeira floração em 12/10/2026.');
  });

  it('colheita prevista sem registro: pergunta, sem afirmar atraso', () => {
    const p = panoramaDoMes({ ...vazio, culturas: [lar] }, '2026-04-10');
    expect(p.colheita[0]!.texto).toBe('Esta cultura possui período de colheita previsto. Você já observou frutos maduros?');
    expect(JSON.stringify(p)).not.toMatch(/atrasad|problema/i);
    const comRegistro = panoramaDoMes({ ...vazio, culturas: [lar], colheitas: [colheita({ id: 'c', culturaId: 'lar', data: '2026-04-02', quantidade: 3, unidade: 'kg' })] }, '2026-04-10');
    expect(comRegistro.colheita[0]!.texto).toBe('1 colheita registrada neste mês.');
  });

  it('janela calculada pela data do plantio entra no mês certo', () => {
    const milho = cultura({ id: 'mil', nome: 'Milho', colheitaPadrao: 'apos_plantio', colheitaDias: { min: 70, max: 150 } });
    const p = panoramaDoMes({ ...vazio, culturas: [milho], plantios: [plantio({ id: 'p', culturaId: 'mil', dataPlantio: '2026-07-01' })] }, '2026-10-30');
    expect(p.colheita).toHaveLength(1);
    expect(p.colheita[0]!.motivo).toContain('09/09/2026 a 28/11/2026');
  });

  it('precisa de atenção: plantio marcado e problemas dos últimos 30 dias', () => {
    const p = panoramaDoMes({
      culturas: [jab], colheitas: [],
      plantios: [plantio({ id: 'p', culturaId: 'jab', estadoAtual: 'precisa_atencao', localizacao: 'Perto do açude' })],
      eventos: [
        evento({ id: 'novo', culturaId: 'jab', tipo: 'praga_doenca', data: '2026-10-20', observacoes: 'Formigas' }),
        evento({ id: 'velho', culturaId: 'jab', tipo: 'praga_doenca', data: '2026-08-01' }),
      ],
    }, '2026-10-30');
    expect(p.atencao.map((a) => a.chave)).toEqual(['plantio-p', 'evento-novo']);
    expect(p.atencao[0]!.titulo).toBe('Jabuticaba · Perto do açude');
  });

  it('culturas sem registros recentes (60 dias)', () => {
    const p = panoramaDoMes({
      ...vazio, culturas: [jab, lar, grav],
      eventos: [evento({ id: 'a', culturaId: 'jab', data: '2026-10-01' }), evento({ id: 'b', culturaId: 'lar', data: '2026-07-01' })],
    }, '2026-10-30');
    expect(p.semRegistro).toEqual([{ culturaId: 'lar', dias: 121 }, { culturaId: 'grav', dias: null }]);
  });
});

describe('sugestões da cultura', () => {
  it('idade aproximada só para plantio jovem com data válida', () => {
    const s = sugestoesDaCultura(grav, {
      ...vazio, culturas: [grav],
      plantios: [plantio({ id: 'p', culturaId: 'grav', estagio: 'jovem', dataPlantio: '2025-07-30' }), plantio({ id: 'q', culturaId: 'grav', estagio: 'jovem' })],
    }, '2026-10-30');
    expect(s.filter((x) => x.chave.startsWith('idade')).map((x) => x.titulo)).toEqual(['Plantio jovem com cerca de 1 ano e 3 meses']);
    expect(s.some((x) => x.titulo === 'Ainda sem registros')).toBe(true);
  });
});

describe('ordem do panorama', () => {
  it('o que já foi registrado no mês aparece antes das previsões', () => {
    const abacate = cultura({ id: 'aba', nome: 'Abacate', mesesFloracao: [10] });
    const p = panoramaDoMes({ ...vazio, culturas: [abacate, jab], eventos: [evento({ id: 'e', culturaId: 'jab', tipo: 'floracao_pico', data: '2026-10-02' })] }, '2026-10-30');
    expect(p.floracao.map((s) => s.culturaId)).toEqual(['jab', 'aba']);
  });
});
