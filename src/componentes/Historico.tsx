// Linha do tempo de acontecimentos e colheitas (página da cultura, Acontecimentos, Colheitas, Início).
import { Pencil, ShoppingBasket, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { dataCurta, quandoFoi } from '@/dominio/datas';
import { DESTINO, INTENSIDADE, QUALIDADE, TIPO_EVENTO } from '@/dominio/opcoes';
import type { Colheita, Evento } from '@/dominio/tipos';
import { rotuloDoPlantio, usePomar } from '@/estado/pomar';
import { useRegistro } from '@/estado/registro';
import { cn } from '@/lib/cn';
import { numero } from '@/lib/formato';
import { ICONE_EVENTO, TOM_EVENTO } from './icones';
import { Botao } from './ui/botao';
import { useConfirmar } from './ui/dialogo';
import { Selo } from './ui/diversos';

export type ItemHistorico = { tipo: 'evento'; item: Evento } | { tipo: 'colheita'; item: Colheita };

export function juntarHistorico(eventos: Evento[], colheitas: Colheita[]): ItemHistorico[] {
  return [
    ...eventos.map((item) => ({ tipo: 'evento' as const, item })),
    ...colheitas.map((item) => ({ tipo: 'colheita' as const, item })),
  ].sort((a, b) => b.item.data.localeCompare(a.item.data) || b.item.criadoEm.localeCompare(a.item.criadoEm));
}

function useNomes() {
  const { culturaPorId, plantios, unidadesPorCodigo } = usePomar();
  const plantio = (id: string | null) => {
    if (!id) return null;
    const p = plantios.find((x) => x.id === id);
    if (!p) return null;
    const i = plantios.filter((x) => x.culturaId === p.culturaId).indexOf(p);
    return rotuloDoPlantio(p, i);
  };
  return { cultura: (id: string) => culturaPorId.get(id)?.nome ?? 'Cultura', plantio, unidade: (c: string) => unidadesPorCodigo.get(c)?.nome ?? c };
}

/** `mostrarCultura`: na página da própria cultura o nome é redundante. `acoes`: editar/excluir. */
export function LinhaDoTempo({ itens, mostrarCultura = true, acoes = true, compacto = false }: {
  itens: ItemHistorico[]; mostrarCultura?: boolean; acoes?: boolean; compacto?: boolean;
}) {
  const { apagarEvento, apagarColheita } = usePomar();
  const { editarEvento, editarColheita } = useRegistro();
  const confirmar = useConfirmar();
  const nomes = useNomes();

  async function excluir(x: ItemHistorico) {
    const qual = x.tipo === 'evento' ? `“${TIPO_EVENTO[x.item.tipo].rotulo}” de ${dataCurta(x.item.data)}` : `a colheita de ${dataCurta(x.item.data)}`;
    if (!(await confirmar({ titulo: 'Excluir registro?', texto: `Excluir ${qual} (${nomes.cultura(x.item.culturaId)})? Não dá para desfazer.` }))) return;
    const r = x.tipo === 'evento' ? await apagarEvento(x.item.id) : await apagarColheita(x.item.id);
    if (r.ok) toast.success('Registro excluído.'); else toast.error(r.mensagem);
  }

  return (
    <ol className="grid">
      {itens.map((x, i) => {
        const ultimo = i === itens.length - 1;
        const Icone = x.tipo === 'evento' ? ICONE_EVENTO[x.item.tipo] : ShoppingBasket;
        const tom = x.tipo === 'evento' ? TOM_EVENTO[x.item.tipo] : 'bg-colheita/15 text-[#8B4A1C]';
        const plantio = nomes.plantio(x.item.plantioId);
        return (
          <li key={`${x.tipo}-${x.item.id}`} className="relative grid grid-cols-[2.5rem_1fr] gap-3">
            {!ultimo && <span aria-hidden className="absolute top-11 bottom-0 left-5 w-px bg-linha" />}
            <span aria-hidden className={cn('relative grid size-10 place-items-center rounded-full [&_svg]:size-5', tom)}><Icone /></span>
            <div className={cn('min-w-0', ultimo ? 'pb-1' : compacto ? 'pb-4' : 'pb-6')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">
                    {x.tipo === 'evento' ? TIPO_EVENTO[x.item.tipo].rotulo : <>Colheita: {numero(x.item.quantidade, 3)} {nomes.unidade(x.item.unidade)}</>}
                    {mostrarCultura && <> · <Link to={`/pomar/${x.item.culturaId}`} className="text-primaria hover:underline">{nomes.cultura(x.item.culturaId)}</Link></>}
                  </p>
                  <p className="text-sm text-texto-suave">
                    <time dateTime={x.item.data} title={dataCurta(x.item.data)}>{quandoFoi(x.item.data)}</time>
                    {plantio && <> · {plantio}</>}
                  </p>
                </div>
                {acoes && (
                  <div className="-mt-1 -mr-2 flex shrink-0">
                    <Botao variante="discreta" tamanho="icone" aria-label="Editar registro" className="text-texto-suave"
                      onClick={() => (x.tipo === 'evento' ? editarEvento(x.item) : editarColheita(x.item))}><Pencil /></Botao>
                    <Botao variante="discreta" tamanho="icone" aria-label="Excluir registro" className="text-texto-suave hover:bg-erro-suave hover:text-erro"
                      onClick={() => void excluir(x)}><Trash2 /></Botao>
                  </div>
                )}
              </div>
              {!compacto && <Detalhes x={x} />}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Detalhes({ x }: { x: ItemHistorico }) {
  const selos: string[] = [];
  let textos: (string | null)[] = [];
  if (x.tipo === 'evento') {
    const e = x.item;
    if (e.intensidade) selos.push(INTENSIDADE[e.intensidade]);
    if (e.plantasAfetadas) selos.push(`${e.plantasAfetadas} ${e.plantasAfetadas === 1 ? 'planta' : 'plantas'}`);
    if (e.clima) selos.push(e.clima);
    textos = [e.observacoes, e.acaoRealizada ? `Ação: ${e.acaoRealizada}` : null];
  } else {
    const c = x.item;
    selos.push(DESTINO[c.destino]);
    if (c.qualidade) selos.push(`Qualidade ${QUALIDADE[c.qualidade].toLowerCase()}`);
    if (c.plantasColhidas) selos.push(`${c.plantasColhidas} ${c.plantasColhidas === 1 ? 'planta' : 'plantas'}`);
    textos = [c.observacoes];
  }
  const t = textos.filter(Boolean);
  if (!selos.length && !t.length) return null;
  return (
    <div className="mt-1.5 grid gap-1.5">
      {selos.length > 0 && <div className="flex flex-wrap gap-1.5">{selos.map((s) => <Selo key={s}>{s}</Selo>)}</div>}
      {t.map((s) => <p key={s} className="text-sm whitespace-pre-line text-texto">{s}</p>)}
    </div>
  );
}
