import {
  ArrowLeft, CalendarDays, History, Lightbulb, MapPin, Minus, Pencil, Plus, Power, ShoppingBasket, Sprout, Sun, Trash2,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { padraoDaFase, textoDaFase } from '@/dominio/calendario';
import { dataCurta, hojeISO, idadeAproximada, mesDe } from '@/dominio/datas';
import { ESTADO, ESTAGIO, PADRAO } from '@/dominio/opcoes';
import { totalKg, totaisSemConversao } from '@/dominio/producao';
import { sugestoesDaCultura } from '@/dominio/sugestoes';
import type { Cultura, EstadoAtual, Plantio } from '@/dominio/tipos';
import { usePomar } from '@/estado/pomar';
import { useRegistro } from '@/estado/registro';
import { kg, numero, plural } from '@/lib/formato';
import { FaixaDeMeses, LegendaFases } from '@/componentes/FaixaDeMeses';
import { juntarHistorico, LinhaDoTempo } from '@/componentes/Historico';
import { FormCultura, ID_FORM_CULTURA } from '@/componentes/formularios/FormCultura';
import { BotoesDoForm } from '@/componentes/formularios/FormEvento';
import { FormPlantio, ID_FORM_PLANTIO } from '@/componentes/formularios/FormPlantio';
import { Botao } from '@/componentes/ui/botao';
import { Cartao, TituloSecao } from '@/componentes/ui/cartao';
import { Dialogo, useConfirmar } from '@/componentes/ui/dialogo';
import { CabecalhoPagina, EstadoVazio, Selo } from '@/componentes/ui/diversos';

export function CulturaPagina() {
  const { id = '' } = useParams();
  const pomar = usePomar();
  const cultura = pomar.culturaPorId.get(id);
  if (!cultura) {
    return (
      <EstadoVazio icone={<Sprout />} titulo="Planta não encontrada" texto="O endereço pode estar incompleto. Volte para a lista e escolha de novo."
        acao={<Link to="/pomar" className="font-semibold text-primaria hover:underline">Voltar para Meu pomar</Link>} />
    );
  }
  return <Detalhe cultura={cultura} />;
}

function Detalhe({ cultura: c }: { cultura: Cultura }) {
  const { plantios, eventos, colheitas, unidadesPorCodigo, definirCulturaAtiva } = usePomar();
  const { registrarEvento, registrarColheita } = useRegistro();
  const confirmar = useConfirmar();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const hoje = hojeISO();

  const meusPlantios = plantios.filter((p) => p.culturaId === c.id);
  const meusEventos = eventos.filter((e) => e.culturaId === c.id);
  const minhasColheitas = colheitas.filter((h) => h.culturaId === c.id);
  const sugestoes = sugestoesDaCultura(c, { culturas: [c], plantios, eventos, colheitas }, hoje);
  const total = totalKg(minhasColheitas, unidadesPorCodigo);
  const outras = totaisSemConversao(minhasColheitas, unidadesPorCodigo);

  async function alternarAtiva() {
    if (c.ativo && !(await confirmar({
      titulo: `Arquivar ${c.nome}?`, acao: 'Arquivar', perigo: false,
      texto: 'Ela sai da lista e do calendário, mas as anotações ficam guardadas. Dá para trazer de volta quando quiser.',
    }))) return;
    const r = await definirCulturaAtiva(c.id, !c.ativo);
    if (r.ok) toast.success(c.ativo ? 'Planta arquivada.' : 'Planta de volta ao pomar.'); else toast.error(r.mensagem);
  }

  return (
    <>
      <Link to="/pomar" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-texto-suave hover:text-primaria">
        <ArrowLeft aria-hidden className="size-4" />Meu pomar
      </Link>
      <CabecalhoPagina titulo={c.nome} sobretitulo={<span className="flex flex-wrap items-center gap-2">{c.grupo}{!c.ativo && <Selo>Arquivada</Selo>}</span>}
        descricao={c.descricao ?? undefined}
        acoes={<>
          {c.ativo && <Botao onClick={() => registrarEvento({ culturaId: c.id })}><Plus aria-hidden />Anotar</Botao>}
          {c.ativo && <Botao variante="secundaria" onClick={() => registrarColheita({ culturaId: c.id })}><ShoppingBasket aria-hidden />Colheita</Botao>}
          <Botao variante="secundaria" onClick={() => setEditando(true)}><Pencil aria-hidden />Mudar dados</Botao>
          <Botao variante="discreta" onClick={() => void alternarAtiva()}><Power aria-hidden />{c.ativo ? 'Arquivar' : 'Trazer de volta'}</Botao>
        </>} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          {sugestoes.length > 0 && (
            <Cartao className="grid gap-3 p-5">
              <TituloSecao icone={<Lightbulb />} titulo="Para acompanhar agora" />
              <ul className="grid gap-2">
                {sugestoes.map((s) => (
                  <li key={s.chave} className="rounded-controle bg-superficie-suave p-3">
                    <p className="font-semibold">{s.titulo}</p>
                    <p className="text-sm text-texto-suave">{s.texto}</p>
                    <p className="mt-1 text-xs text-texto-suave">{s.motivo}</p>
                  </li>
                ))}
              </ul>
            </Cartao>
          )}

          <Cartao className="grid gap-4 p-5">
            <TituloSecao icone={<CalendarDays />} titulo="Época do ano" descricao="É só uma referência: cada ano pode ser diferente." />
            <dl className="grid gap-3 sm:grid-cols-2">
              {(['floracao', 'colheita'] as const).map((f) => (
                <div key={f} className="rounded-controle bg-superficie-suave p-3">
                  <dt className="text-xs font-semibold tracking-wide text-texto-suave uppercase">{f === 'floracao' ? 'Costuma florir' : 'Costuma dar colheita'}</dt>
                  <dd className="mt-0.5 font-medium">{textoDaFase(c, f) ?? 'Não sabemos ainda'}</dd>
                  <dd className="mt-1"><Selo>{PADRAO[padraoDaFase(c, f) ?? 'a_confirmar']}</Selo></dd>
                </div>
              ))}
            </dl>
            <FaixaDeMeses cultura={c} mesAtual={mesDe(hoje)} />
            <LegendaFases comEstimado={!c.mesesConfirmados} />
            {(c.floracaoDias || c.colheitaDias) && (
              <p className="text-sm text-texto-suave">
                Contando do dia em que foi plantado:
                {c.floracaoDias && <> floração {c.floracaoDias.min}–{c.floracaoDias.max} dias;</>}
                {c.colheitaDias && <> colheita {c.colheitaDias.min}–{c.colheitaDias.max} dias.</>}
                {' '}Informe quando foi plantado para o app calcular as datas.
              </p>
            )}
            {c.observacoes && <p className="rounded-controle border-l-4 border-sol bg-sol-suave/60 p-3 text-sm"><strong>Cuidados:</strong> {c.observacoes}</p>}
          </Cartao>

          <Plantios cultura={c} plantios={meusPlantios} />
        </div>

        <Cartao className="grid content-start gap-4 p-5">
          <TituloSecao icone={<History />} titulo="Anotações" descricao={`${plural(meusEventos.length, 'anotação', 'anotações')} e ${plural(minhasColheitas.length, 'colheita', 'colheitas')}`} />
          {minhasColheitas.length > 0 && (
            <div className="rounded-controle bg-terra-suave/60 p-3 text-sm">
              <strong>Total colhido:</strong>{' '}
              {[...(total.convertidas > 0 ? [kg(total.kg)] : []), ...outras.map((o) => `${numero(o.total)} ${unidadesPorCodigo.get(o.unidade)?.nome ?? o.unidade}`)].join(' + ')}
              <span className="block text-xs text-texto-suave">Medidas diferentes (kg, cachos…) não se somam.</span>
            </div>
          )}
          {meusEventos.length + minhasColheitas.length === 0
            ? <EstadoVazio icone={<History />} titulo="Nada anotado ainda" texto="Florada, poda, adubação, colheita… tudo o que você anotar aparece aqui."
                acao={c.ativo ? <Botao onClick={() => registrarEvento({ culturaId: c.id })}><Plus aria-hidden />Anotar o que aconteceu</Botao> : undefined} />
            : <LinhaDoTempo itens={juntarHistorico(meusEventos, minhasColheitas)} mostrarCultura={false} />}
        </Cartao>
      </div>

      <Dialogo aberto={editando} aoMudar={(v) => { if (!salvando) setEditando(v); }} titulo={`Mudar dados: ${c.nome}`} largura="max-w-2xl"
        rodape={<BotoesDoForm form={ID_FORM_CULTURA} salvando={salvando} aoCancelar={() => setEditando(false)} rotulo="Salvar mudanças" />}>
        <FormCultura cultura={c} aoSalvando={setSalvando} aoConcluir={() => setEditando(false)} />
      </Dialogo>
    </>
  );
}

function Plantios({ cultura: c, plantios }: { cultura: Cultura; plantios: Plantio[] }) {
  const { salvarPlantio, apagarPlantio } = usePomar();
  const confirmar = useConfirmar();
  const [editando, setEditando] = useState<Plantio | 'novo' | null>(null);
  const [salvando, setSalvando] = useState(false);
  const hoje = hojeISO();

  async function atualizar(p: Plantio, mudanca: Partial<Plantio>, aviso: string) {
    const r = await salvarPlantio(mudanca, p.id);
    if (r.ok) toast.success(aviso); else toast.error(r.mensagem);
  }

  async function excluir(p: Plantio) {
    if (!(await confirmar({ titulo: 'Apagar este local?', acao: 'Apagar', texto: 'As anotações e colheitas continuam guardadas na planta. Só não vão mais dizer em qual local foi.' }))) return;
    const r = await apagarPlantio(p.id);
    if (r.ok) toast.success('Local apagado.'); else toast.error(r.mensagem);
  }

  return (
    <Cartao className="grid gap-4 p-5">
      <TituloSecao icone={<Sprout />} titulo="Onde está plantada" descricao="Cada lugar do sítio onde tem essa planta, e quantos pés."
        acao={c.ativo ? <Botao variante="secundaria" tamanho="compacto" onClick={() => setEditando('novo')}><Plus aria-hidden />Local</Botao> : undefined} />
      {plantios.length === 0 && <p className="text-sm text-texto-suave">Nenhum local anotado.</p>}
      <ul className="grid gap-3">
        {plantios.map((p, i) => {
          const idade = idadeAproximada(p.dataPlantio, hoje);
          const incompleto = p.quantidade === null || !p.localizacao;
          return (
            <li key={p.id} className="grid gap-3 rounded-controle border border-linha p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold"><MapPin aria-hidden className="size-4 text-texto-suave" />{p.localizacao || `Local ${i + 1}`}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.estagio && <Selo tom="verde">{ESTAGIO[p.estagio]}</Selo>}
                    {p.estadoAtual && <Selo tom={p.estadoAtual === 'precisa_atencao' ? 'erro' : 'neutro'}>{ESTADO[p.estadoAtual]}</Selo>}
                    {incompleto && <Selo tom="sol">Falta informar</Selo>}
                  </div>
                </div>
                <div className="-mt-1 -mr-2 flex shrink-0">
                  <Botao variante="discreta" tamanho="icone" aria-label="Mudar dados do local" className="text-texto-suave" onClick={() => setEditando(p)}><Pencil /></Botao>
                  <Botao variante="discreta" tamanho="icone" aria-label="Apagar local" className="text-texto-suave hover:bg-erro-suave hover:text-erro" onClick={() => void excluir(p)}><Trash2 /></Botao>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {/* Quantidade com + e − (atualização rápida no campo) */}
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-xs font-semibold text-texto-suave uppercase">Quantos pés</span>
                  <div className="mt-1 flex items-center gap-2">
                    <Botao variante="secundaria" tamanho="icone" aria-label="Um pé a menos" disabled={!p.quantidade || p.quantidade <= 1}
                      onClick={() => void atualizar(p, { quantidade: (p.quantidade ?? 1) - 1 }, 'Quantidade de pés atualizada.')}><Minus /></Botao>
                    <span className="min-w-12 text-center font-titulo text-xl font-semibold tabular-nums" aria-live="polite">{p.quantidade ?? '—'}</span>
                    <Botao variante="secundaria" tamanho="icone" aria-label="Um pé a mais"
                      onClick={() => void atualizar(p, { quantidade: (p.quantidade ?? 0) + 1 }, 'Quantidade de pés atualizada.')}><Plus /></Botao>
                  </div>
                </div>
                <Info rotulo="Plantado em" valor={p.dataPlantio ? `${dataCurta(p.dataPlantio)}${idade ? ` (${idade})` : ''}` : 'Não informado'} />
                <Info rotulo="Sol" valor={p.exposicaoSolarHoras !== null ? <span className="inline-flex items-center gap-1"><Sun aria-hidden className="size-4 text-sol-forte" />{numero(p.exposicaoSolarHoras, 1)} h/dia</span> : 'Não informado'} />
              </div>

              <label className="grid gap-1 text-sm">
                <span className="text-xs font-semibold text-texto-suave uppercase">Como está</span>
                <select value={p.estadoAtual ?? ''} onChange={(e) => void atualizar(p, { estadoAtual: (e.target.value || null) as EstadoAtual | null }, 'Anotado como está.')}
                  className="min-h-11 rounded-controle border border-borda/70 bg-superficie px-3">
                  <option value="">Não sei / sem anotação</option>
                  {(Object.keys(ESTADO) as EstadoAtual[]).map((e) => <option key={e} value={e}>{ESTADO[e]}</option>)}
                </select>
              </label>
              {p.observacoes && <p className="text-sm whitespace-pre-line text-texto-suave">{p.observacoes}</p>}
            </li>
          );
        })}
      </ul>

      <Dialogo aberto={editando !== null} aoMudar={(v) => { if (!salvando && !v) setEditando(null); }}
        titulo={editando === 'novo' ? `Novo local: ${c.nome}` : `Mudar local: ${c.nome}`}
        rodape={<BotoesDoForm form={ID_FORM_PLANTIO} salvando={salvando} aoCancelar={() => setEditando(null)} />}>
        {editando !== null && (
          <FormPlantio key={editando === 'novo' ? 'novo' : editando.id} culturaId={c.id} plantio={editando === 'novo' ? undefined : editando}
            aoSalvando={setSalvando} aoConcluir={() => setEditando(null)} />
        )}
      </Dialogo>
    </Cartao>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div>
      <span className="text-xs font-semibold text-texto-suave uppercase">{rotulo}</span>
      <p className="mt-1 font-medium">{valor}</p>
    </div>
  );
}
