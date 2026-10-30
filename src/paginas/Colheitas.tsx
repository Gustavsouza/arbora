import { ArrowDownRight, ArrowUpRight, Plus, Ruler, ShoppingBasket, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { dataCurta, periodoAnterior, type Periodo } from '@/dominio/datas';
import { DESTINO, DESTINOS } from '@/dominio/opcoes';
import { comparar, filtrarColheitas, totaisPorUnidade, totalKg } from '@/dominio/producao';
import type { Destino } from '@/dominio/tipos';
import { usePomar } from '@/estado/pomar';
import { useRegistro } from '@/estado/registro';
import { cn } from '@/lib/cn';
import { kg, numero, percentual, plural } from '@/lib/formato';
import { atalhosDePeriodo, FiltroPeriodo } from '@/componentes/FiltroPeriodo';
import { juntarHistorico, LinhaDoTempo } from '@/componentes/Historico';
import { OpcoesDeCultura } from '@/componentes/formularios/comuns';
import { GerenciarUnidades } from '@/componentes/formularios/Unidades';
import { Botao } from '@/componentes/ui/botao';
import { Seletor } from '@/componentes/ui/campos';
import { Cartao, TituloSecao } from '@/componentes/ui/cartao';
import { CabecalhoPagina, EstadoVazio } from '@/componentes/ui/diversos';

const PAGINA = 40;

export function Colheitas() {
  const { colheitas, unidadesPorCodigo } = usePomar();
  const { registrarColheita } = useRegistro();
  const [culturaId, setCulturaId] = useState('');
  const [destino, setDestino] = useState<Destino | ''>('');
  // Começa no ano atual: é a pergunta mais comum ("quanto colhi este ano?").
  const [periodo, setPeriodo] = useState<Periodo>(() => atalhosDePeriodo().find((a) => a.chave === 'ano')!.periodo);
  const [limite, setLimite] = useState(PAGINA);
  const [unidadesAbertas, setUnidadesAbertas] = useState(false);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const filtro = { culturaId, destino: destino || null, periodo };
  const filtradas = filtrarColheitas(colheitas, filtro);
  const total = totalKg(filtradas, unidadesPorCodigo);
  const porUnidade = totaisPorUnidade(filtradas);
  const anterior = periodoAnterior(periodo);
  const comparacao = anterior ? comparar(total.kg, totalKg(filtrarColheitas(colheitas, { ...filtro, periodo: anterior }), unidadesPorCodigo).kg) : null;
  const nomeUnidade = (c: string) => unidadesPorCodigo.get(c)?.nome ?? c;

  return (
    <>
      <CabecalhoPagina titulo="Colheitas" descricao="Quanto foi colhido, de quê e para onde foi. Unidades diferentes nunca são somadas entre si."
        acoes={<>
          <Botao onClick={() => registrarColheita(culturaId ? { culturaId } : undefined)}><Plus aria-hidden />Registrar colheita</Botao>
          <Botao variante="secundaria" onClick={() => setUnidadesAbertas(true)}><Ruler aria-hidden />Unidades</Botao>
        </>} />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr] lg:items-start">
        <Cartao className="p-4 lg:sticky lg:top-6">
          <button type="button" className="flex min-h-10 w-full items-center justify-between font-semibold lg:hidden" aria-expanded={filtrosAbertos} onClick={() => setFiltrosAbertos((a) => !a)}>
            <span className="flex items-center gap-2"><SlidersHorizontal aria-hidden className="size-5" />Filtros</span>
            <span className="text-sm text-primaria">{filtrosAbertos ? 'Fechar' : 'Abrir'}</span>
          </button>
          <div className={cn(filtrosAbertos ? 'grid' : 'hidden', 'mt-3 gap-4 lg:mt-0 lg:grid')}>
            <Seletor rotulo="Cultura" value={culturaId} onChange={(e) => { setCulturaId(e.target.value); setLimite(PAGINA); }}><OpcoesDeCultura vazio="Todas as culturas" /></Seletor>
            <Seletor rotulo="Destino" value={destino} onChange={(e) => { setDestino(e.target.value as Destino | ''); setLimite(PAGINA); }}>
              <option value="">Todos os destinos</option>
              {DESTINOS.map((d) => <option key={d} value={d}>{DESTINO[d]}</option>)}
            </Seletor>
            <FiltroPeriodo periodo={periodo} aoMudar={(p) => { setPeriodo(p); setLimite(PAGINA); }} />
          </div>
        </Cartao>

        <div className="grid gap-4">
          {/* Resumo do que está filtrado */}
          <Cartao className="grid gap-4 p-5">
            <TituloSecao icone={<ShoppingBasket />} titulo="Resumo"
              descricao={periodo.de || periodo.ate ? `${periodo.de ? dataCurta(periodo.de) : 'início'} a ${periodo.ate ? dataCurta(periodo.ate) : 'hoje'}` : 'Todo o histórico'} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-controle bg-terra-suave/60 p-4">
                <p className="text-sm text-texto-suave">Total em kg</p>
                <p className="font-titulo text-[1.75rem] leading-tight font-semibold tabular-nums">{kg(total.kg)}</p>
                <p className="text-xs text-texto-suave">{plural(total.convertidas, 'colheita em kg ou g', 'colheitas em kg ou g')}</p>
              </div>
              <div className="rounded-controle bg-superficie-suave p-4">
                <p className="text-sm text-texto-suave">Registros</p>
                <p className="font-titulo text-[1.75rem] leading-tight font-semibold tabular-nums">{filtradas.length}</p>
                <p className="text-xs text-texto-suave">{total.semConversao ? `${total.semConversao} em outras unidades` : 'todas convertidas'}</p>
              </div>
              <div className="rounded-controle bg-superficie-suave p-4">
                <p className="text-sm text-texto-suave">Período anterior</p>
                {comparacao && anterior ? (
                  <>
                    <p className={cn('flex items-center gap-1 font-titulo text-[1.75rem] leading-tight font-semibold tabular-nums',
                      comparacao.diferenca > 0 ? 'text-ok' : comparacao.diferenca < 0 ? 'text-terra' : '')}>
                      {comparacao.diferenca > 0 ? <ArrowUpRight aria-hidden /> : comparacao.diferenca < 0 ? <ArrowDownRight aria-hidden /> : null}
                      {comparacao.percentual !== null ? percentual(Math.abs(comparacao.percentual)) : '—'}
                    </p>
                    <p className="text-xs text-texto-suave">{kg(comparacao.anterior)} de {dataCurta(anterior.de)} a {dataCurta(anterior.ate)}{comparacao.percentual === null && ' (sem base para comparar)'}</p>
                  </>
                ) : <p className="text-sm text-texto-suave">Escolha um período com início e fim para comparar.</p>}
              </div>
            </div>
            {porUnidade.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold">Por unidade</p>
                <ul className="flex flex-wrap gap-2">
                  {porUnidade.map((u) => (
                    <li key={u.unidade} className="rounded-full border border-linha px-3 py-1 text-sm">
                      <strong className="tabular-nums">{numero(u.total)}</strong> {nomeUnidade(u.unidade)} <span className="text-texto-suave">({u.registros})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Cartao>

          <Cartao className="p-5">
            {filtradas.length === 0 ? (
              colheitas.length === 0
                ? <EstadoVazio icone={<ShoppingBasket />} titulo="Nenhuma colheita registrada" texto="A cada colheita, anote quantidade, unidade e destino. Usar sempre a mesma unidade por cultura ajuda a comparar safras."
                    acao={<Botao onClick={() => registrarColheita()}><Plus aria-hidden />Registrar a primeira</Botao>} />
                : <EstadoVazio icone={<ShoppingBasket />} titulo="Nada com esses filtros" texto="Tente outro período, cultura ou destino." />
            ) : (
              <>
                <LinhaDoTempo itens={juntarHistorico([], filtradas.slice(0, limite))} />
                {filtradas.length > limite && <Botao variante="secundaria" className="mt-4 w-full" onClick={() => setLimite((l) => l + PAGINA)}>Mostrar mais</Botao>}
              </>
            )}
          </Cartao>
        </div>
      </div>

      <GerenciarUnidades aberto={unidadesAbertas} aoMudar={setUnidadesAbertas} />
    </>
  );
}
