import {
  ArrowRight, CalendarDays, ClipboardList, Flower2, Info, NotebookPen, Plus, Scale, ShoppingBasket, Sprout, TreeDeciduous, TriangleAlert,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { proximasPrevisoes } from '@/dominio/calendario';
import { anoDe, dataPorExtenso, hojeISO, mesDe } from '@/dominio/datas';
import { FASE, nomeDoMes } from '@/dominio/opcoes';
import { doAno, totalKg, totaisSemConversao } from '@/dominio/producao';
import { panoramaDoMes, type Sugestao } from '@/dominio/sugestoes';
import { usePomar } from '@/estado/pomar';
import { useRegistro } from '@/estado/registro';
import { cn } from '@/lib/cn';
import { kg, numero, plural } from '@/lib/formato';
import { juntarHistorico, LinhaDoTempo } from '@/componentes/Historico';
import { COR_FASE } from '@/componentes/FaixaDeMeses';
import { Botao } from '@/componentes/ui/botao';
import { Cartao, Indicador, TituloSecao } from '@/componentes/ui/cartao';
import { EstadoVazio, Selo } from '@/componentes/ui/diversos';

function saudacao(): string {
  const h = Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(new Date()));
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export function Inicio() {
  const pomar = usePomar();
  const { culturas, plantios, eventos, colheitas, unidadesPorCodigo, culturaPorId } = pomar;
  const { registrarEvento, registrarColheita } = useRegistro();
  const hoje = hojeISO();
  const ano = anoDe(hoje);
  const mes = mesDe(hoje);

  const ativas = culturas.filter((c) => c.ativo);
  const panorama = useMemo(() => panoramaDoMes({ culturas, plantios, eventos, colheitas }, hoje), [culturas, plantios, eventos, colheitas, hoje]);
  const previsoes = useMemo(() => proximasPrevisoes(culturas, plantios, hoje, 3), [culturas, plantios, hoje]);
  const colheitasAno = doAno(colheitas, ano);
  const kgAno = totalKg(colheitasAno, unidadesPorCodigo);
  const outrasAno = totaisSemConversao(colheitasAno, unidadesPorCodigo);
  const plantas = plantios.reduce((s, p) => s + (p.quantidade ?? 0), 0);
  const plantiosSemQtd = plantios.filter((p) => p.quantidade === null && culturaPorId.get(p.culturaId)?.ativo).length;
  const recentes = juntarHistorico(eventos.slice(0, 5), colheitas.slice(0, 5)).slice(0, 5);

  return (
    <div className="grid gap-6">
      {/* Abertura */}
      <section className="textura-folhas surgir relative overflow-hidden rounded-cartao bg-mata p-5 text-white sm:p-7">
        <p className="text-sm font-medium text-white/70 first-letter:uppercase">{dataPorExtenso(hoje)}</p>
        <h1 className="mt-1 text-[1.875rem] text-white sm:text-[2.25rem]">{saudacao()}! {nomeDoMes(mes).replace(/^./, (l) => l.toUpperCase())} no pomar</h1>
        <p className="mt-2 max-w-xl text-white/80">
          {panorama.floracao.length || panorama.colheita.length
            ? <>Pela época do ano, {plural(panorama.floracao.length, 'planta pode', 'plantas podem')} estar florindo e {plural(panorama.colheita.length, 'pode', 'podem')} estar dando colheita. Confira no sítio e anote o que viu.</>
            : <>Pelo calendário, nada deve florir nem dar colheita neste mês. Anote o que você vir no sítio.</>}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Botao variante="sol" onClick={() => registrarEvento()}><Plus aria-hidden />Anotar o que aconteceu</Botao>
          <Botao onClick={() => registrarColheita()} className="bg-white/12 hover:bg-white/20"><ShoppingBasket aria-hidden />Anotar colheita</Botao>
        </div>
      </section>

      {/* Indicadores */}
      <section aria-label="Números do sítio" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador icone={<TreeDeciduous />} rotulo="Plantas no pomar" valor={ativas.length} detalhe={culturas.length > ativas.length ? `${culturas.length - ativas.length} arquivadas` : 'tipos de planta'} />
        <Indicador icone={<Sprout />} rotulo="Pés / touceiras" valor={numero(plantas, 0)}
          detalhe={plantiosSemQtd ? `falta contar em ${plural(plantiosSemQtd, 'local', 'locais')}` : 'somando todos os locais'} />
        <Indicador icone={<NotebookPen />} rotulo={`Anotações em ${ano}`} valor={doAno(eventos, ano).length} tom="sol" />
        <Indicador icone={<ShoppingBasket />} rotulo={`Colheitas em ${ano}`} valor={colheitasAno.length} tom="terra" />
        <Indicador icone={<Scale />} rotulo={`Colhido em ${ano}`} valor={kg(kgAno.kg)} tom="terra"
          detalhe={outrasAno.length ? `+ ${outrasAno.map((o) => `${numero(o.total)} ${pomar.unidadesPorCodigo.get(o.unidade)?.nome ?? o.unidade}`).join(', ')}` : 'somando kg e gramas'} />
        <Indicador icone={<Flower2 />} rotulo="Época de florada" valor={panorama.floracao.length} tom="sol" detalhe="plantas neste mês" />
        <Indicador icone={<CalendarDays />} rotulo="Época de colheita" valor={panorama.colheita.length} tom="terra" detalhe="plantas neste mês" />
        <Indicador icone={<ClipboardList />} rotulo="Falta informar" valor={plantiosSemQtd} detalhe="quantos pés tem" />
      </section>

      {/* O que está acontecendo */}
      <section aria-labelledby="acontecendo" className="grid gap-4">
        <div>
          <h2 id="acontecendo" className="text-[1.5rem]">O que está acontecendo no pomar?</h2>
          <p className="text-sm text-texto-suave">Juntamos a época de cada planta com o que você anotou. Toque em “por quê?” para ver de onde veio cada aviso.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ListaDeSugestoes titulo="Podem estar florindo" icone={<Flower2 />} itens={panorama.floracao} vazio="Pelo calendário, nenhuma planta floresce neste mês." tom="sol" />
          <ListaDeSugestoes titulo="Época de colheita" icone={<ShoppingBasket />} itens={panorama.colheita} vazio="Pelo calendário, nenhuma planta dá colheita neste mês." tom="terra" />
          <ListaDeSugestoes titulo="Precisam de atenção" icone={<TriangleAlert />} itens={panorama.atencao} tom="erro"
            vazio="Nenhuma planta marcada como “precisa de atenção” e nenhum problema anotado nos últimos 30 dias." />
          <Cartao className="grid content-start gap-4 p-5">
            <TituloSecao icone={<NotebookPen />} titulo="Últimas anotações" acao={<Link to="/anotacoes" className="mt-1 text-sm font-semibold text-primaria hover:underline">Ver todas</Link>} />
            {recentes.length
              ? <LinhaDoTempo itens={recentes} compacto acoes={false} />
              : <p className="text-sm text-texto-suave">Nada anotado ainda. Na próxima volta pelo sítio, toque em “Anotar o que aconteceu”.</p>}
          </Cartao>
        </div>
        {panorama.semRegistro.length > 0 && <SemRegistro ids={panorama.semRegistro.map((s) => s.culturaId)} total={ativas.length} />}
      </section>

      {/* Próximos acontecimentos */}
      <section aria-labelledby="proximos">
        <Cartao className="grid gap-4 p-5">
          <TituloSecao id="proximos" icone={<CalendarDays />} titulo="O que vem por aí"
            descricao="O que deve começar nos próximos 3 meses, pela época de cada planta. É só uma referência: cada ano pode ser diferente." />
          {previsoes.length === 0 ? (
            <EstadoVazio icone={<CalendarDays />} titulo="Nada nos próximos meses" texto="Aqui aparecem as plantas com meses marcados no calendário ou com data de plantio informada." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((n) => {
                const doMes = previsoes.filter((p) => p.emMeses === n);
                const m = ((mes - 1 + n) % 12) + 1;
                return (
                  <div key={n} className="grid content-start gap-2">
                    <h3 className="text-base capitalize">{nomeDoMes(m)}</h3>
                    {doMes.length === 0 && <p className="text-sm text-texto-suave">Nada começa neste mês.</p>}
                    <ul className="grid gap-1.5">
                      {doMes.map((p) => (
                        <li key={`${p.culturaId}-${p.fase}-${p.inicio ?? ''}`}>
                          <Link to={`/pomar/${p.culturaId}`} className="flex min-h-11 items-center gap-2.5 rounded-controle border border-linha px-3 py-2 hover:border-borda">
                            <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', COR_FASE[p.fase])} />
                            <span className="min-w-0 flex-1 text-sm"><strong className="font-semibold">{culturaPorId.get(p.culturaId)?.nome}</strong> · {FASE[p.fase].toLowerCase()}</span>
                            {p.origem === 'estimado' && <Selo>aproximado</Selo>}
                            {p.origem === 'plantio' && <Selo tom="verde">pela data de plantio</Selo>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </Cartao>
      </section>
    </div>
  );
}

function ListaDeSugestoes({ titulo, icone, itens, vazio, tom }: { titulo: string; icone: ReactNode; itens: Sugestao[]; vazio: string; tom: 'sol' | 'terra' | 'erro' }) {
  const [todos, setTodos] = useState(false);
  const [explicando, setExplicando] = useState<string | null>(null);
  const visiveis = todos ? itens : itens.slice(0, 5);
  return (
    <Cartao className="grid content-start gap-4 p-5">
      <TituloSecao icone={icone} titulo={titulo} acao={itens.length > 0 ? <Selo tom={tom}>{itens.length}</Selo> : undefined} />
      {itens.length === 0 ? <p className="text-sm text-texto-suave">{vazio}</p> : (
        <ul className="grid gap-2">
          {visiveis.map((s) => (
            <li key={s.chave} className="rounded-controle bg-superficie-suave p-3">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/pomar/${s.culturaId}`} className="font-semibold leading-snug hover:text-primaria hover:underline">{s.titulo}</Link>
                <button type="button" aria-expanded={explicando === s.chave} onClick={() => setExplicando(explicando === s.chave ? null : s.chave)}
                  className="-mt-1 -mr-1 inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-texto-suave hover:bg-fundo-forte">
                  <Info aria-hidden className="size-3.5" />por quê?
                </button>
              </div>
              <p className="mt-0.5 text-sm text-texto-suave">{s.texto}</p>
              {explicando === s.chave && <p className="mt-2 border-t border-linha pt-2 text-xs text-texto-suave">{s.motivo}</p>}
            </li>
          ))}
        </ul>
      )}
      {itens.length > 5 && (
        <button type="button" onClick={() => setTodos((t) => !t)} className="justify-self-start text-sm font-semibold text-primaria hover:underline">
          {todos ? 'Mostrar menos' : `Mostrar mais ${itens.length - 5}`}
        </button>
      )}
    </Cartao>
  );
}

function SemRegistro({ ids, total }: { ids: string[]; total: number }) {
  const { culturaPorId } = usePomar();
  const [aberto, setAberto] = useState(false);
  return (
    <Cartao className="flex flex-col gap-3 border-dashed bg-superficie-suave p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{ids.length === total ? 'Nenhuma planta tem anotação nos últimos 60 dias' : `${plural(ids.length, 'planta está', 'plantas estão')} sem anotação há mais de 60 dias`}</p>
        <p className="text-sm text-texto-suave">Que tal anotar como elas estão na próxima caminhada? Uma anotação rápida já ajuda.</p>
        {aberto && <p className="mt-2 text-sm">{ids.map((id) => culturaPorId.get(id)?.nome).join(', ')}.</p>}
      </div>
      <Botao variante="secundaria" tamanho="compacto" onClick={() => setAberto((a) => !a)} aria-expanded={aberto}>
        {aberto ? 'Esconder' : 'Ver quais'}<ArrowRight aria-hidden className={cn('transition-transform', aberto && 'rotate-90')} />
      </Botao>
    </Cartao>
  );
}
