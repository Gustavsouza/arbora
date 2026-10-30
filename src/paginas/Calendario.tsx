import { CalendarDays, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { FASES, janelaNoMes, janelasDoPlantio, mesesDaFase, padraoDaFase } from '@/dominio/calendario';
import { anoDe, dataCurta, hojeISO, mesDe } from '@/dominio/datas';
import { FASE, MESES_CURTOS, nomeDoMes, PADRAO } from '@/dominio/opcoes';
import type { Cultura, Fase } from '@/dominio/tipos';
import { usePomar } from '@/estado/pomar';
import { cn } from '@/lib/cn';
import { comparaTexto } from '@/lib/formato';
import { COR_FASE, LegendaFases } from '@/componentes/FaixaDeMeses';
import { juntarHistorico, LinhaDoTempo } from '@/componentes/Historico';
import { Botao } from '@/componentes/ui/botao';
import { Seletor } from '@/componentes/ui/campos';
import { Cartao, TituloSecao } from '@/componentes/ui/cartao';
import { CabecalhoPagina, EstadoVazio } from '@/componentes/ui/diversos';

type Visao = 'anual' | 'mensal';
const temMeses = (c: Cultura) => FASES.some((f) => mesesDaFase(c, f).length > 0);

export function Calendario() {
  const { culturas } = usePomar();
  const [params, setParams] = useSearchParams();
  const visao: Visao = params.get('visao') === 'mensal' ? 'mensal' : 'anual';
  const grupo = params.get('grupo') ?? '';
  const definir = (k: string, v: string) => setParams((p) => { if (v) p.set(k, v); else p.delete(k); return p; }, { replace: true });

  const grupos = useMemo(() => [...new Set(culturas.map((c) => c.grupo))].sort(comparaTexto), [culturas]);
  const filtradas = culturas.filter((c) => c.ativo && (!grupo || c.grupo === grupo));

  return (
    <>
      <CabecalhoPagina titulo="Calendário do pomar"
        descricao="Quando cada planta costuma florir, formar frutos e dar colheita. É só uma referência: altura do terreno, variedade, idade da planta e o tempo mudam tudo." />
      <div className="mb-4 grid gap-3 sm:flex sm:items-end sm:justify-between">
        <div role="radiogroup" aria-label="Ver" className="grid grid-cols-2 rounded-controle border border-linha bg-superficie p-1 sm:w-72">
          {(['anual', 'mensal'] as Visao[]).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={visao === v} onClick={() => definir('visao', v === 'anual' ? '' : v)}
              className={cn('min-h-10 rounded-lg text-sm font-semibold', visao === v ? 'bg-primaria text-white' : 'text-texto-suave hover:bg-fundo')}>
              {v === 'anual' ? 'Ano inteiro' : 'Mês a mês'}
            </button>
          ))}
        </div>
        <Seletor rotulo="Tipo de planta" value={grupo} onChange={(e) => definir('grupo', e.target.value)} className="sm:w-64">
          <option value="">Todos os tipos</option>
          {grupos.map((g) => <option key={g} value={g}>{g}</option>)}
        </Seletor>
      </div>
      {visao === 'anual' ? <VisaoAnual culturas={filtradas} /> : <VisaoMensal culturas={filtradas} />}
    </>
  );
}

function VisaoAnual({ culturas }: { culturas: Cultura[] }) {
  const mesAtual = mesDe(hojeISO());
  const comMeses = culturas.filter(temMeses);
  const semMeses = culturas.filter((c) => !temMeses(c));
  return (
    <div className="grid grid-cols-1 gap-4">
      {/* grid-cols-1 = minmax(0, 1fr): a tabela larga rola dentro do cartão em vez de alargar a página */}
      <Cartao className="grid grid-cols-1 gap-4 p-4 sm:p-5">
        <LegendaFases />
        {comMeses.length === 0 ? (
          <EstadoVazio icone={<CalendarDays />} titulo="Nenhuma planta com meses marcados" texto="Abra uma planta em “Meu pomar”, toque em “Mudar dados” e marque os meses que você conhece." />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[17.5rem] table-fixed border-separate border-spacing-0 text-sm">
              <caption className="sr-only">Calendário do ano: plantas nas linhas, meses nas colunas</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-[6.25rem] bg-superficie pr-2 pb-2 text-left text-xs font-semibold text-texto-suave sm:w-44">Planta</th>
                  {MESES_CURTOS.map((m, i) => (
                    <th key={m} scope="col" className={cn('pb-2 text-center text-xs font-semibold', mesAtual === i + 1 ? 'text-primaria' : 'text-texto-suave')}>
                      <span aria-hidden className="sm:hidden">{m.slice(0, 1)}</span><span className="max-sm:sr-only">{m}</span>{mesAtual === i + 1 && <span className="sr-only"> (mês atual)</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comMeses.map((c) => (
                  <tr key={c.id} className="group">
                    <th scope="row" className="sticky left-0 z-10 border-t border-linha bg-superficie py-2 pr-2 text-left text-[0.8125rem] font-medium group-hover:bg-superficie-suave sm:text-sm">
                      <Link to={`/pomar/${c.id}`} title={c.nome} className="block truncate hover:text-primaria hover:underline">{c.nome}</Link>
                    </th>
                    {MESES_CURTOS.map((m, i) => {
                      const fases = FASES.filter((f) => mesesDaFase(c, f).includes(i + 1));
                      return (
                        <td key={m} className={cn('relative border-t border-linha px-px py-2 align-middle sm:px-[2px] group-hover:bg-superficie-suave', mesAtual === i + 1 && 'bg-primaria-suave/50')}>
                          <div className="grid h-7 grid-rows-3 gap-[2px]">
                            {FASES.map((f) => (
                              <span key={f} className={cn('rounded-[3px]', fases.includes(f) ? [COR_FASE[f], !c.mesesConfirmados && 'estimado'] : 'bg-transparent')} />
                            ))}
                          </div>
                          <span className="sr-only">{fases.length ? fases.map((f) => FASE[f]).join(', ') : 'nada'}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-texto-suave">Cada mês tem três faixas: floração (em cima), frutos se formando (meio) e colheita (embaixo). A planilha não tinha a época dos frutos: ela aparece quando você marcar os meses.</p>
      </Cartao>

      {semMeses.length > 0 && (
        <Cartao className="grid gap-3 p-5">
          <TituloSecao icone={<Info />} titulo="Sem época certa" descricao="Na planilha estas plantas estavam como “Variável”, “Várias floradas” etc. Por isso não têm mês marcado." />
          <ul className="grid divide-y divide-linha sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
            {semMeses.map((c) => (
              <li key={c.id} className="sm:border-b sm:border-linha">
                <Link to={`/pomar/${c.id}`} className="flex min-h-12 flex-col justify-center py-2 hover:text-primaria">
                  <span className="text-sm font-semibold">{c.nome}</span>
                  <span className="text-xs text-texto-suave">Floração: {PADRAO[c.floracaoPadrao].toLowerCase()} · Colheita: {PADRAO[c.colheitaPadrao].toLowerCase()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  );
}

function VisaoMensal({ culturas }: { culturas: Cultura[] }) {
  const { plantios, eventos, colheitas } = usePomar();
  const hoje = hojeISO();
  const [ref, setRef] = useState({ ano: anoDe(hoje), mes: mesDe(hoje) });
  const mover = (n: number) => setRef(({ ano, mes }) => {
    const t = ano * 12 + (mes - 1) + n;
    return { ano: Math.floor(t / 12), mes: (t % 12) + 1 };
  });

  const ids = new Set(culturas.map((c) => c.id));
  const doMes = (d: string) => anoDe(d) === ref.ano && mesDe(d) === ref.mes;
  const registros = juntarHistorico(eventos.filter((e) => ids.has(e.culturaId) && doMes(e.data)), colheitas.filter((h) => ids.has(h.culturaId) && doMes(h.data)));

  /** Por fase: culturas com o mês marcado e janelas calculadas pelo plantio que passam pelo mês. */
  const porFase = (f: Fase) => culturas.flatMap((c) => {
    const itens: { cultura: Cultura; nota: string }[] = [];
    if (mesesDaFase(c, f).includes(ref.mes)) itens.push({ cultura: c, nota: c.mesesConfirmados ? 'marcado por você' : 'aproximado pela estação' });
    for (const j of janelasDoPlantio(c, plantios)) {
      if (j.fase === f && janelaNoMes(j, ref.ano, ref.mes)) itens.push({ cultura: c, nota: `pela data de plantio: ${dataCurta(j.inicio)} a ${dataCurta(j.fim)}` });
    }
    return itens;
  });
  const variaveis = culturas.filter((c) => ['varias_epocas', 'continua'].includes(padraoDaFase(c, 'floracao') ?? '') || ['varias_epocas', 'continua'].includes(padraoDaFase(c, 'colheita') ?? ''));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2 rounded-cartao bg-mata p-2 text-white">
        <Botao variante="discreta" tamanho="icone" aria-label="Mês anterior" onClick={() => mover(-1)} className="text-white hover:bg-white/10"><ChevronLeft /></Botao>
        <h2 className="text-xl text-white capitalize" aria-live="polite">{nomeDoMes(ref.mes)} de {ref.ano}</h2>
        <Botao variante="discreta" tamanho="icone" aria-label="Próximo mês" onClick={() => mover(1)} className="text-white hover:bg-white/10"><ChevronRight /></Botao>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {FASES.map((f) => {
          const itens = porFase(f);
          const titulo = { floracao: 'Podem florir', frutificacao: 'Frutos se formando', colheita: 'Época de colheita' }[f];
          return (
            <Cartao key={f} className="grid content-start gap-3 p-4">
              <h3 className="flex items-center gap-2 text-base"><span aria-hidden className={cn('size-3 rounded-full', COR_FASE[f])} />{titulo}<span className="ml-auto text-sm font-normal text-texto-suave">{itens.length}</span></h3>
              {itens.length === 0 ? <p className="text-sm text-texto-suave">{f === 'frutificacao' ? 'Nenhuma planta com frutos marcados para este mês.' : 'Nenhuma planta neste mês.'}</p> : (
                <ul className="grid gap-1.5">
                  {itens.map(({ cultura, nota }) => (
                    <li key={`${cultura.id}-${nota}`}>
                      <Link to={`/pomar/${cultura.id}`} className="flex min-h-11 flex-col justify-center rounded-controle bg-superficie-suave px-3 py-1.5 hover:bg-fundo">
                        <span className="text-sm font-semibold">{cultura.nome}</span>
                        <span className="text-xs text-texto-suave">{nota}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>
          );
        })}
      </div>

      {variaveis.length > 0 && (
        <p className="rounded-controle bg-superficie-suave p-3 text-sm text-texto-suave">
          <strong className="text-texto">Podem florir ou dar colheita em qualquer época</strong> (pela planilha): {variaveis.map((c) => c.nome).join(', ')}.
        </p>
      )}

      <Cartao className="grid gap-4 p-5">
        <TituloSecao icone={<CalendarDays />} titulo="Anotado neste mês" descricao="O que você viu e anotou de verdade." />
        {registros.length === 0
          ? <p className="text-sm text-texto-suave">Nada anotado em {nomeDoMes(ref.mes)} de {ref.ano}.</p>
          : <LinhaDoTempo itens={registros} />}
      </Cartao>
    </div>
  );
}
