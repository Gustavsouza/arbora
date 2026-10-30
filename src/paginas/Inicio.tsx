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
            ? <>Pelo calendário, {plural(panorama.floracao.length, 'cultura pode', 'culturas podem')} estar florindo e {plural(panorama.colheita.length, 'tem', 'têm')} colheita prevista neste mês. São referências aproximadas: confirme no campo e registre.</>
            : <>Nenhuma floração ou colheita prevista no calendário para este mês. Registre o que observar no campo.</>}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Botao variante="sol" onClick={() => registrarEvento()}><Plus aria-hidden />Registrar acontecimento</Botao>
          <Botao onClick={() => registrarColheita()} className="bg-white/12 hover:bg-white/20"><ShoppingBasket aria-hidden />Registrar colheita</Botao>
        </div>
      </section>

      {/* Indicadores */}
      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador icone={<TreeDeciduous />} rotulo="Culturas ativas" valor={ativas.length} detalhe={culturas.length > ativas.length ? `${culturas.length - ativas.length} inativas` : 'cadastradas'} />
        <Indicador icone={<Sprout />} rotulo="Plantas / touceiras" valor={numero(plantas, 0)}
          detalhe={plantiosSemQtd ? `${plural(plantiosSemQtd, 'plantio', 'plantios')} sem quantidade` : 'informadas nos plantios'} />
        <Indicador icone={<NotebookPen />} rotulo={`Acontecimentos em ${ano}`} valor={doAno(eventos, ano).length} tom="sol" />
        <Indicador icone={<ShoppingBasket />} rotulo={`Colheitas em ${ano}`} valor={colheitasAno.length} tom="terra" />
        <Indicador icone={<Scale />} rotulo={`Colhido em ${ano}`} valor={kg(kgAno.kg)} tom="terra"
          detalhe={outrasAno.length ? `+ ${outrasAno.map((o) => `${numero(o.total)} ${pomar.unidadesPorCodigo.get(o.unidade)?.nome ?? o.unidade}`).join(', ')}` : 'em kg e gramas'} />
        <Indicador icone={<Flower2 />} rotulo="Floração prevista no mês" valor={panorama.floracao.length} tom="sol" detalhe="culturas (referência)" />
        <Indicador icone={<CalendarDays />} rotulo="Colheita prevista no mês" valor={panorama.colheita.length} tom="terra" detalhe="culturas (referência)" />
        <Indicador icone={<ClipboardList />} rotulo="Cadastros a completar" valor={plantiosSemQtd} detalhe="plantios sem quantidade" />
      </section>

      {/* O que está acontecendo */}
      <section aria-labelledby="acontecendo" className="grid gap-4">
        <div>
          <h2 id="acontecendo" className="text-[1.5rem]">O que está acontecendo no pomar?</h2>
          <p className="text-sm text-texto-suave">Cruzamento do calendário cadastrado com os seus registros. Toque em “por quê?” para ver de onde vem cada aviso.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ListaDeSugestoes titulo="Floração esperada" icone={<Flower2 />} itens={panorama.floracao} vazio="Nenhuma floração prevista para este mês no calendário." tom="sol" />
          <ListaDeSugestoes titulo="Período de colheita" icone={<ShoppingBasket />} itens={panorama.colheita} vazio="Nenhuma colheita prevista para este mês no calendário." tom="terra" />
          <ListaDeSugestoes titulo="Precisam de atenção" icone={<TriangleAlert />} itens={panorama.atencao} tom="erro"
            vazio="Nenhum plantio marcado como “precisa de atenção” e nenhum problema registrado nos últimos 30 dias." />
          <Cartao className="grid content-start gap-4 p-5">
            <TituloSecao icone={<NotebookPen />} titulo="Últimos registros" acao={<Link to="/acontecimentos" className="mt-1 text-sm font-semibold text-primaria hover:underline">Ver todos</Link>} />
            {recentes.length
              ? <LinhaDoTempo itens={recentes} compacto acoes={false} />
              : <p className="text-sm text-texto-suave">Ainda não há acontecimentos nem colheitas. Use “Registrar acontecimento” na próxima volta pelo sítio.</p>}
          </Cartao>
        </div>
        {panorama.semRegistro.length > 0 && <SemRegistro ids={panorama.semRegistro.map((s) => s.culturaId)} total={ativas.length} />}
      </section>

      {/* Próximos acontecimentos */}
      <section aria-labelledby="proximos">
        <Cartao className="grid gap-4 p-5">
          <TituloSecao id="proximos" icone={<CalendarDays />} titulo="Próximos acontecimentos"
            descricao="Inícios previstos nos próximos 3 meses, pelo calendário cadastrado. Referências aproximadas, nunca garantia de produção." />
          {previsoes.length === 0 ? (
            <EstadoVazio icone={<CalendarDays />} titulo="Nada previsto nos próximos meses" texto="Só aparecem aqui culturas com meses marcados no calendário ou ciclos contados a partir da data do plantio." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((n) => {
                const doMes = previsoes.filter((p) => p.emMeses === n);
                const m = ((mes - 1 + n) % 12) + 1;
                return (
                  <div key={n} className="grid content-start gap-2">
                    <h3 className="text-base capitalize">{nomeDoMes(m)}</h3>
                    {doMes.length === 0 && <p className="text-sm text-texto-suave">Nenhum início previsto.</p>}
                    <ul className="grid gap-1.5">
                      {doMes.map((p) => (
                        <li key={`${p.culturaId}-${p.fase}-${p.inicio ?? ''}`}>
                          <Link to={`/pomar/${p.culturaId}`} className="flex min-h-11 items-center gap-2.5 rounded-controle border border-linha px-3 py-2 hover:border-borda">
                            <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', COR_FASE[p.fase])} />
                            <span className="min-w-0 flex-1 text-sm"><strong className="font-semibold">{culturaPorId.get(p.culturaId)?.nome}</strong> · {FASE[p.fase].toLowerCase()}</span>
                            {p.origem === 'estimado' && <Selo>estimado</Selo>}
                            {p.origem === 'plantio' && <Selo tom="verde">pelo plantio</Selo>}
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
        <p className="font-semibold">{ids.length === total ? 'Nenhuma cultura tem registros nos últimos 60 dias' : `${plural(ids.length, 'cultura está', 'culturas estão')} sem registros há mais de 60 dias`}</p>
        <p className="text-sm text-texto-suave">Que tal atualizar as observações na próxima caminhada? Um registro rápido já ajuda a montar o histórico.</p>
        {aberto && <p className="mt-2 text-sm">{ids.map((id) => culturaPorId.get(id)?.nome).join(', ')}.</p>}
      </div>
      <Botao variante="secundaria" tamanho="compacto" onClick={() => setAberto((a) => !a)} aria-expanded={aberto}>
        {aberto ? 'Esconder' : 'Ver quais'}<ArrowRight aria-hidden className={cn('transition-transform', aberto && 'rotate-90')} />
      </Botao>
    </Cartao>
  );
}
