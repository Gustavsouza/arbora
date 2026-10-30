// Dados do pomar em memória: um sítio tem poucos milhares de registros, então tudo é carregado UMA vez (em paralelo)
// e as telas calculam em cima disso. Depois de gravar, o registro devolvido pelo banco substitui o da memória: as
// telas (painel, histórico, relatórios) se atualizam sem nova consulta.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { mapaDeUnidades, type MapaUnidades } from '@/dominio/producao';
import type { Colheita, Cultura, Evento, Plantio, Resultado, Unidade } from '@/dominio/tipos';
import * as api from '@/servicos/pomar';
import { comparaTexto } from '@/lib/formato';

interface Dados { culturas: Cultura[]; plantios: Plantio[]; eventos: Evento[]; colheitas: Colheita[]; unidades: Unidade[] }

interface Pomar extends Dados {
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  unidadesPorCodigo: MapaUnidades;
  culturaPorId: ReadonlyMap<string, Cultura>;
  salvarCultura: (c: api.NovaCultura, id?: string | null) => Promise<Resultado<Cultura>>;
  definirCulturaAtiva: (id: string, ativo: boolean) => Promise<Resultado<Cultura>>;
  salvarPlantio: (p: Partial<api.NovoPlantio>, id?: string | null) => Promise<Resultado<Plantio>>;
  apagarPlantio: (id: string) => Promise<Resultado<null>>;
  salvarEvento: (e: api.NovoEvento, id?: string | null) => Promise<Resultado<Evento>>;
  apagarEvento: (id: string) => Promise<Resultado<null>>;
  salvarColheita: (c: api.NovaColheita, id?: string | null) => Promise<Resultado<Colheita>>;
  apagarColheita: (id: string) => Promise<Resultado<null>>;
  criarUnidade: (u: { codigo: string; nome: string; fatorKg: number | null }) => Promise<Resultado<Unidade>>;
  apagarUnidade: (codigo: string) => Promise<Resultado<null>>;
}

const Contexto = createContext<Pomar | null>(null);
const VAZIO: Dados = { culturas: [], plantios: [], eventos: [], colheitas: [], unidades: [] };

/** Troca (ou inclui) o registro e mantém a ordem da lista. */
function trocar<T extends { id: string }>(lista: T[], item: T, ordem: (a: T, b: T) => number): T[] {
  const sem = lista.filter((x) => x.id !== item.id);
  return [...sem, item].sort(ordem);
}
const porNome = (a: Cultura, b: Cultura) => comparaTexto(a.nome, b.nome);
const porDataDesc = <T extends { data: string; criadoEm: string }>(a: T, b: T) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm);
/** Plantios: na ordem de cadastro (o mais antigo primeiro); editado fica no lugar, novo vai para o fim. */
function trocarNoLugar(lista: Plantio[], item: Plantio): Plantio[] {
  return lista.some((x) => x.id === item.id) ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item];
}

export function PomarProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<Dados>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    const [c, p, e, h, u] = await Promise.all([api.carregarCulturas(), api.carregarPlantios(), api.carregarEventos(), api.carregarColheitas(), api.carregarUnidades()]);
    const falha = [c, p, e, h, u].find((r) => !r.ok);
    if (falha && !falha.ok) setErro(falha.mensagem);
    else if (c.ok && p.ok && e.ok && h.ok && u.ok) {
      setDados({ culturas: [...c.valor].sort(porNome), plantios: [...p.valor].reverse(), eventos: e.valor.sort(porDataDesc), colheitas: h.valor.sort(porDataDesc), unidades: u.valor });
      setErro(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => { void recarregar(); }, [recarregar]);

  /** Executa a gravação e, se deu certo, aplica o resultado na memória. */
  const com = useCallback(<A extends unknown[], T>(f: (...a: A) => Promise<Resultado<T>>, aplicar: (d: Dados, v: T, ...a: A) => Dados) =>
    async (...a: A) => {
      const r = await f(...a);
      if (r.ok) setDados((d) => aplicar(d, r.valor, ...a));
      return r;
    }, []);

  const valor = useMemo<Pomar>(() => ({
    ...dados, carregando, erro, recarregar,
    unidadesPorCodigo: mapaDeUnidades(dados.unidades),
    culturaPorId: new Map(dados.culturas.map((c) => [c.id, c])),
    salvarCultura: com((c: api.NovaCultura, id: string | null = null) => api.salvarCultura(c, id), (d, v) => ({ ...d, culturas: trocar(d.culturas, v, porNome) })),
    definirCulturaAtiva: com(api.definirCulturaAtiva, (d, v) => ({ ...d, culturas: trocar(d.culturas, v, porNome) })),
    salvarPlantio: com((p: Partial<api.NovoPlantio>, id: string | null = null) => api.salvarPlantio(p, id), (d, v) => ({ ...d, plantios: trocarNoLugar(d.plantios, v) })),
    apagarPlantio: com(api.apagarPlantio, (d, _v, id) => ({
      ...d, plantios: d.plantios.filter((p) => p.id !== id),
      // O banco solta o vínculo (ON DELETE SET NULL): espelha aqui.
      eventos: d.eventos.map((e) => (e.plantioId === id ? { ...e, plantioId: null } : e)),
      colheitas: d.colheitas.map((c) => (c.plantioId === id ? { ...c, plantioId: null } : c)),
    })),
    salvarEvento: com((e: api.NovoEvento, id: string | null = null) => api.salvarEvento(e, id), (d, v) => ({ ...d, eventos: trocar(d.eventos, v, porDataDesc) })),
    apagarEvento: com(api.apagarEvento, (d, _v, id) => ({ ...d, eventos: d.eventos.filter((e) => e.id !== id) })),
    salvarColheita: com((c: api.NovaColheita, id: string | null = null) => api.salvarColheita(c, id), (d, v) => ({ ...d, colheitas: trocar(d.colheitas, v, porDataDesc) })),
    apagarColheita: com(api.apagarColheita, (d, _v, id) => ({ ...d, colheitas: d.colheitas.filter((c) => c.id !== id) })),
    criarUnidade: com(api.criarUnidade, (d, v) => ({ ...d, unidades: [...d.unidades, v] })),
    apagarUnidade: com(api.apagarUnidade, (d, _v, codigo) => ({ ...d, unidades: d.unidades.filter((u) => u.codigo !== codigo) })),
  }), [dados, carregando, erro, recarregar, com]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePomar(): Pomar {
  const c = useContext(Contexto);
  if (!c) throw new Error('usePomar fora do PomarProvider');
  return c;
}

/** Plantios de uma cultura (para os seletores dos formulários). */
export function rotuloDoPlantio(p: Plantio, indice: number): string {
  const partes = [p.localizacao || `Local ${indice + 1}`];
  if (p.quantidade) partes.push(`${p.quantidade} ${p.quantidade === 1 ? 'pé' : 'pés'}`);
  return partes.join(' · ');
}
