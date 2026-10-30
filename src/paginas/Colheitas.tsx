import { ArrowDownRight, ArrowUpRight, Plus, Ruler, ShoppingBasket } from 'lucide-react';
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
import { PainelDeFiltros } from '@/componentes/PainelDeFiltros';
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
  const anoAtual = atalhosDePeriodo().find((a) => a.chave === 'ano')!.periodo;
  const [periodo, setPeriodo] = useState<Periodo>(anoAtual);
  const [limite, setLimite] = useState(PAGINA);
  const [unidadesAbertas, setUnidadesAbertas] = useState(false);

  const filtro = { culturaId, destino: destino || null, periodo };
  const filtradas = filtrarColheitas(colheitas, filtro);
  const total = totalKg(filtradas, unidadesPorCodigo);
  const porUnidade = totaisPorUnidade(filtradas);
  const anterior = periodoAnterior(periodo);
  const comparacao = anterior ? comparar(total.kg, totalKg(filtrarColheitas(colheitas, { ...filtro, periodo: anterior }), unidadesPorCodigo).kg) : null;
  const nomeUnidade = (c: string) => unidadesPorCodigo.get(c)?.nome ?? c;

  return (
    <>
      <CabecalhoPagina titulo="Colheitas" descricao="Quanto foi colhido, de qual planta e para onde foi. Medidas diferentes (kg, cachos…) não se somam."
        acoes={<>
          <Botao onClick={() => registrarColheita(culturaId ? { culturaId } : undefined)}><Plus aria-hidden />Anotar colheita</Botao>
          <Botao variante="secundaria" onClick={() => setUnidadesAbertas(true)}><Ruler aria-hidden />Medidas</Botao>
        </>} />

      <div className="grid gap-4">
        <PainelDeFiltros ligado={Boolean(culturaId || destino) || periodo.de !== anoAtual.de || periodo.ate !== anoAtual.ate}
          aoLimpar={() => { setCulturaId(''); setDestino(''); setPeriodo(anoAtual); }}>
          <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
            <Seletor rotulo="Planta" value={culturaId} onChange={(e) => { setCulturaId(e.target.value); setLimite(PAGINA); }}><OpcoesDeCultura vazio="Todas as plantas" /></Seletor>
            <Seletor rotulo="Para onde foi" value={destino} onChange={(e) => { setDestino(e.target.value as Destino | ''); setLimite(PAGINA); }}>
              <option value="">Todos</option>
              {DESTINOS.map((d) => <option key={d} value={d}>{DESTINO[d]}</option>)}
            </Seletor>
            <div className="@xl:col-span-2 @4xl:col-span-1"><FiltroPeriodo periodo={periodo} aoMudar={(p) => { setPeriodo(p); setLimite(PAGINA); }} /></div>
          </div>
        </PainelDeFiltros>

        <div className="grid gap-4">
          {/* Resumo do que está filtrado */}
          <Cartao className="@container grid gap-4 p-5">
            <TituloSecao icone={<ShoppingBasket />} titulo="Resumo"
              descricao={periodo.de || periodo.ate ? `${periodo.de ? dataCurta(periodo.de) : 'desde o começo'} a ${periodo.ate ? dataCurta(periodo.ate) : 'hoje'}` : 'Tudo o que foi anotado'} />
            <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-3">
              <div className="rounded-controle bg-terra-suave/60 p-4">
                <p className="text-sm text-texto-suave">Total em kg</p>
                <p className="font-titulo text-[1.75rem] leading-tight font-semibold tabular-nums">{kg(total.kg)}</p>
                <p className="text-xs text-texto-suave">somando {plural(total.convertidas, 'colheita', 'colheitas')} em kg ou gramas</p>
              </div>
              <div className="rounded-controle bg-superficie-suave p-4">
                <p className="text-sm text-texto-suave">Colheitas</p>
                <p className="font-titulo text-[1.75rem] leading-tight font-semibold tabular-nums">{filtradas.length}</p>
                <p className="text-xs text-texto-suave">{total.semConversao ? `${total.semConversao} em outras medidas` : 'todas em kg ou gramas'}</p>
              </div>
              <div className="col-span-2 rounded-controle bg-superficie-suave p-4 @2xl:col-span-1">
                <p className="text-sm text-texto-suave">Comparado com antes</p>
                {comparacao && anterior ? (
                  <>
                    <p className={cn('flex items-center gap-1 font-titulo text-[1.75rem] leading-tight font-semibold tabular-nums',
                      comparacao.diferenca > 0 ? 'text-ok' : comparacao.diferenca < 0 ? 'text-terra' : '')}>
                      {comparacao.diferenca > 0 ? <ArrowUpRight aria-hidden /> : comparacao.diferenca < 0 ? <ArrowDownRight aria-hidden /> : null}
                      {comparacao.percentual !== null ? percentual(Math.abs(comparacao.percentual)) : '—'}
                    </p>
                    <p className="text-xs text-texto-suave">{kg(comparacao.anterior)} de {dataCurta(anterior.de)} a {dataCurta(anterior.ate)}{comparacao.percentual === null && ' (nada colhido antes para comparar)'}</p>
                  </>
                ) : <p className="text-sm text-texto-suave">Escolha uma data de início e de fim para comparar.</p>}
              </div>
            </div>
            {porUnidade.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold">Por medida</p>
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
                ? <EstadoVazio icone={<ShoppingBasket />} titulo="Nenhuma colheita anotada" texto="A cada colheita, anote quanto colheu e para onde foi. Usar sempre a mesma medida para cada planta ajuda a comparar as safras."
                    acao={<Botao onClick={() => registrarColheita()}><Plus aria-hidden />Anotar a primeira</Botao>} />
                : <EstadoVazio icone={<ShoppingBasket />} titulo="Nada encontrado" texto="Tente outras datas, outra planta ou outro destino." />
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
