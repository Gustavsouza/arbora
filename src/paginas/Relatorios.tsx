import { ChartColumn, NotebookPen, Scale, ShoppingBasket, Trophy } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { anoDe, hojeISO, mesDe } from '@/dominio/datas';
import { DESTINO, MESES_CURTOS, nomeDoMes } from '@/dominio/opcoes';
import {
  anosComRegistros, doAno, eventosPorMes, producaoMensal, producaoPorCultura, producaoPorDestino, totaisSemConversao, totalKg,
} from '@/dominio/producao';
import { usePomar } from '@/estado/pomar';
import { useRegistro } from '@/estado/registro';
import { kg, numero, percentual, plural } from '@/lib/formato';
import { Barras, Colunas, COR, LinhasComparadas, TabelaDoGrafico } from '@/componentes/Graficos';
import { OpcoesDeCultura } from '@/componentes/formularios/comuns';
import { Botao } from '@/componentes/ui/botao';
import { Seletor } from '@/componentes/ui/campos';
import { Cartao, Indicador, TituloSecao } from '@/componentes/ui/cartao';
import { CabecalhoPagina, EstadoVazio } from '@/componentes/ui/diversos';

export function Relatorios() {
  const { colheitas, eventos, culturaPorId, unidadesPorCodigo } = usePomar();
  const { registrarColheita, registrarEvento } = useRegistro();
  const hoje = hojeISO();
  const anos = useMemo(() => anosComRegistros(colheitas, eventos, anoDe(hoje)), [colheitas, eventos, hoje]);
  const [ano, setAno] = useState(anoDe(hoje));
  const [culturaId, setCulturaId] = useState('');

  // Tudo calculado só com os registros do banco (nada de exemplo).
  const daCultura = <T extends { culturaId: string }>(l: T[]) => (culturaId ? l.filter((x) => x.culturaId === culturaId) : l);
  const colheitasC = daCultura(colheitas);
  const eventosC = daCultura(eventos);
  const doAnoSel = doAno(colheitasC, ano);
  const total = totalKg(doAnoSel, unidadesPorCodigo);
  const outras = totaisSemConversao(doAnoSel, unidadesPorCodigo);
  const mensal = producaoMensal(colheitasC, ano, unidadesPorCodigo);
  const mensalAnterior = producaoMensal(colheitasC, ano - 1, unidadesPorCodigo);
  const porCultura = producaoPorCultura(doAnoSel, unidadesPorCodigo);
  const porDestino = producaoPorDestino(doAnoSel, unidadesPorCodigo);
  const evMes = eventosPorMes(eventosC, ano);
  const eventosAno = evMes.reduce((a, b) => a + b, 0);
  const mesMaisEventos = evMes.indexOf(Math.max(...evMes)) + 1;
  const lider = porCultura.find((p) => p.kg > 0);
  const temKgAnterior = mensalAnterior.some((m) => m.kg > 0);
  const nomeCultura = (id: string) => culturaPorId.get(id)?.nome ?? 'Cultura';
  const nomeUnidade = (c: string) => unidadesPorCodigo.get(c)?.nome ?? c;

  if (colheitas.length === 0 && eventos.length === 0) {
    return (
      <>
        <CabecalhoPagina titulo="Relatórios" />
        <EstadoVazio icone={<ChartColumn />} titulo="Os relatórios aparecem com os primeiros registros"
          texto="Aqui você verá a produção por mês, por cultura e por destino, e quantos acontecimentos foram anotados. Tudo é calculado a partir do que você registrar — comece por uma colheita ou um acontecimento."
          acao={<div className="flex flex-wrap justify-center gap-2"><Botao onClick={() => registrarColheita()}><ShoppingBasket aria-hidden />Registrar colheita</Botao><Botao variante="secundaria" onClick={() => registrarEvento()}><NotebookPen aria-hidden />Registrar acontecimento</Botao></div>} />
      </>
    );
  }

  const frases: ReactNode[] = [];
  if (total.convertidas > 0) frases.push(<>Em {ano} foram colhidos <strong>{kg(total.kg)}</strong>{culturaId ? ` de ${nomeCultura(culturaId)}` : ''} (registros em kg e gramas).</>);
  else frases.push(<>Nenhuma colheita em kg ou gramas registrada em {ano}{culturaId ? ` para ${nomeCultura(culturaId)}` : ''}.</>);
  if (outras.length) frases.push(<>Em outras unidades, somadas à parte: {outras.map((o) => `${numero(o.total)} ${nomeUnidade(o.unidade)}`).join(', ')}.</>);
  if (!culturaId && lider?.percentualKg != null && porCultura.filter((p) => p.kg > 0).length > 1)
    frases.push(<><strong>{nomeCultura(lider.culturaId)}</strong> representa {percentual(lider.percentualKg)} da produção registrada em kg.</>);
  if (eventosAno > 0) frases.push(<>Em {nomeDoMes(mesMaisEventos)} foram registrados <strong>{plural(evMes[mesMaisEventos - 1]!, 'acontecimento', 'acontecimentos')}</strong>, o mês com mais anotações de {ano}.</>);

  return (
    <>
      <CabecalhoPagina titulo="Relatórios" descricao="Calculados apenas com os registros do banco. Só kg e gramas entram nos totais em kg." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-xl">
        <Seletor rotulo="Ano" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </Seletor>
        <Seletor rotulo="Cultura" value={culturaId} onChange={(e) => setCulturaId(e.target.value)}>
          <OpcoesDeCultura vazio="Todas as culturas" />
        </Seletor>
      </div>

      <div className="grid gap-4">
        <Cartao className="grid gap-2 border-l-4 border-l-primaria p-5">
          {frases.map((f, i) => <p key={i} className="text-[1.0625rem]">{f}</p>)}
        </Cartao>

        <section aria-label="Indicadores do ano" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicador icone={<Scale />} rotulo={`Colhido em ${ano}`} valor={kg(total.kg)} tom="terra" detalhe="kg e gramas" />
          <Indicador icone={<ShoppingBasket />} rotulo="Colheitas" valor={doAnoSel.length} tom="terra" detalhe="todas as unidades" />
          <Indicador icone={<NotebookPen />} rotulo="Acontecimentos" valor={eventosAno} tom="sol" />
          <Indicador icone={<Trophy />} rotulo="Mais produtiva (kg)" valor={<span className="text-xl">{lider ? nomeCultura(lider.culturaId) : '—'}</span>}
            detalhe={lider ? kg(lider.kg) : 'sem colheitas em kg'} />
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <Cartao className="grid gap-3 p-5">
            <TituloSecao titulo="Produção mensal" descricao={`kg colhidos por mês em ${ano}`} />
            <Colunas dados={mensal.map((m) => ({ rotulo: MESES_CURTOS[m.mes - 1]!, kg: m.kg }))} chave="kg" rotulo="kg" cor={COR.producao} unidade="kg" />
            <TabelaDoGrafico titulo={`Produção mensal de ${ano}`} colunas={['Mês', 'kg', 'Colheitas']} linhas={mensal.map((m) => [nomeDoMes(m.mes), numero(m.kg), m.registros])} />
          </Cartao>

          <Cartao className="grid gap-3 p-5">
            <TituloSecao titulo="Comparação entre anos" descricao={`kg por mês: ${ano} × ${ano - 1}`} />
            {temKgAnterior || total.convertidas > 0 ? (
              <>
                <LinhasComparadas unidade="kg" atual={String(ano)} anterior={String(ano - 1)}
                  dados={mensal.map((m, i) => ({ rotulo: MESES_CURTOS[i]!, [String(ano)]: m.kg, [String(ano - 1)]: mensalAnterior[i]!.kg }))} />
                <TabelaDoGrafico titulo="Comparação entre anos" colunas={['Mês', String(ano), String(ano - 1)]}
                  linhas={mensal.map((m, i) => [nomeDoMes(m.mes), numero(m.kg), numero(mensalAnterior[i]!.kg)])} />
              </>
            ) : <p className="text-sm text-texto-suave">Sem colheitas em kg em {ano} nem em {ano - 1} para comparar.</p>}
          </Cartao>

          {!culturaId && (
            <Cartao className="grid gap-3 p-5">
              <TituloSecao titulo="Produção por cultura" descricao={`kg em ${ano}, da mais produtiva para a menos`} />
              {porCultura.some((p) => p.kg > 0) ? (
                <Barras dados={porCultura.filter((p) => p.kg > 0).slice(0, 10).map((p) => ({ rotulo: nomeCultura(p.culturaId), kg: p.kg }))} chave="kg" rotulo="kg" cor={COR.cultura} unidade="kg" />
              ) : <p className="text-sm text-texto-suave">Nenhuma colheita em kg neste ano.</p>}
              {porCultura.length > 0 && (
                <TabelaDoGrafico titulo="Produção por cultura" colunas={['Cultura', 'kg', '% do kg', 'Outras unidades', 'Colheitas']}
                  linhas={porCultura.map((p) => [nomeCultura(p.culturaId), numero(p.kg), p.percentualKg === null ? '—' : percentual(p.percentualKg),
                    p.outras.map((o) => `${numero(o.total)} ${nomeUnidade(o.unidade)}`).join(', ') || '—', p.registros])} />
              )}
            </Cartao>
          )}

          <Cartao className="grid gap-3 p-5">
            <TituloSecao titulo="Produção por destino" descricao={`kg em ${ano}`} />
            {porDestino.some((p) => p.kg > 0)
              ? <Barras dados={porDestino.filter((p) => p.kg > 0).map((p) => ({ rotulo: DESTINO[p.destino], kg: p.kg }))} chave="kg" rotulo="kg" cor={COR.producao} unidade="kg" />
              : <p className="text-sm text-texto-suave">Nenhuma colheita em kg neste ano.</p>}
            {porDestino.length > 0 && <TabelaDoGrafico titulo="Produção por destino" colunas={['Destino', 'kg', 'Colheitas']} linhas={porDestino.map((p) => [DESTINO[p.destino], numero(p.kg), p.registros])} />}
          </Cartao>

          <Cartao className="grid gap-3 p-5">
            <TituloSecao titulo="Acontecimentos por mês" descricao={`${plural(eventosAno, 'registro', 'registros')} em ${ano}`} />
            <Colunas dados={evMes.map((n, i) => ({ rotulo: MESES_CURTOS[i]!, eventos: n }))} chave="eventos" rotulo="Acontecimentos" cor={COR.eventos} unidade="registros" />
            <TabelaDoGrafico titulo="Acontecimentos por mês" colunas={['Mês', 'Acontecimentos']} linhas={evMes.map((n, i) => [nomeDoMes(i + 1), n])} />
          </Cartao>
        </div>
        <p className="text-xs text-texto-suave">Mês atual: {nomeDoMes(mesDe(hoje))}. Colheitas em unidades, cachos, caixas etc. não entram no kg (a não ser que a unidade tenha peso definido em Colheitas → Unidades).</p>
      </div>
    </>
  );
}
