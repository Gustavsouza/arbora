import { ChevronRight, Plus, SearchX, Sprout } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { previstaNoMes } from '@/dominio/calendario';
import { hojeISO, mesDe, quandoFoi } from '@/dominio/datas';
import { ESTAGIO, ESTADO } from '@/dominio/opcoes';
import { ultimoRegistro } from '@/dominio/sugestoes';
import type { Cultura } from '@/dominio/tipos';
import { usePomar } from '@/estado/pomar';
import { cn } from '@/lib/cn';
import { comparaTexto, plural, semAcento } from '@/lib/formato';
import { FormCultura, ID_FORM_CULTURA } from '@/componentes/formularios/FormCultura';
import { BotoesDoForm } from '@/componentes/formularios/FormEvento';
import { Botao } from '@/componentes/ui/botao';
import { Busca } from '@/componentes/ui/campos';
import { Cartao } from '@/componentes/ui/cartao';
import { Dialogo } from '@/componentes/ui/dialogo';
import { CabecalhoPagina, EstadoVazio, Selo } from '@/componentes/ui/diversos';

type Situacao = 'ativas' | 'inativas' | 'todas';

export function MeuPomar() {
  const { culturas, plantios, eventos, colheitas } = usePomar();
  const [params, setParams] = useSearchParams();
  // A busca fica só na tela (passar cada tecla pelo endereço perde letras de quem digita rápido).
  const [busca, setBusca] = useState('');
  const grupo = params.get('grupo') ?? '';
  const situacao = (params.get('situacao') as Situacao | null) ?? 'ativas';
  const [novaAberta, setNovaAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const navegar = useNavigate();
  const mes = mesDe(hojeISO());

  /** Grupo e situação ficam no endereço: voltar da página da cultura mantém o filtro. */
  const definir = (chave: string, valor: string) => setParams((p) => { if (valor) p.set(chave, valor); else p.delete(chave); return p; }, { replace: true });

  const grupos = useMemo(() => [...new Set(culturas.map((c) => c.grupo))].sort(comparaTexto), [culturas]);
  const ultimo = useMemo(() => ultimoRegistro({ eventos, colheitas }), [eventos, colheitas]);
  const filtradas = culturas.filter((c) =>
    (situacao === 'todas' || (situacao === 'ativas') === c.ativo) && (!grupo || c.grupo === grupo) && (!busca || semAcento(c.nome).includes(semAcento(busca))));

  return (
    <>
      <CabecalhoPagina titulo="Meu pomar" descricao={`${plural(culturas.filter((c) => c.ativo).length, 'planta', 'plantas')}. Toque numa planta para ver onde está, a época e as anotações.`}
        acoes={<Botao onClick={() => setNovaAberta(true)}><Plus aria-hidden />Adicionar planta</Botao>} />

      <div className="mb-4 grid gap-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Busca rotulo="Procurar planta pelo nome" placeholder="Procurar pelo nome…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <div role="radiogroup" aria-label="Mostrar" className="grid grid-cols-3 rounded-controle border border-linha bg-superficie p-1">
            {(['ativas', 'inativas', 'todas'] as Situacao[]).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={situacao === s} onClick={() => definir('situacao', s === 'ativas' ? '' : s)}
                className={cn('min-h-10 rounded-lg px-3 text-sm font-semibold', situacao === s ? 'bg-primaria text-white' : 'text-texto-suave hover:bg-fundo')}>
                {{ ativas: 'No pomar', inativas: 'Arquivadas', todas: 'Todas' }[s]}
              </button>
            ))}
          </div>
        </div>
        {/* Grupos: rolagem lateral no celular */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="radiogroup" aria-label="Filtrar por tipo">
          <div className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap">
            {['', ...grupos].map((g) => (
              <button key={g || 'todos'} type="button" role="radio" aria-checked={grupo === g} onClick={() => definir('grupo', g)}
                className={cn('min-h-10 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
                  grupo === g ? 'border-mata bg-mata text-white' : 'border-linha bg-superficie hover:border-borda')}>
                {g || 'Todos os tipos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <EstadoVazio icone={<SearchX />} titulo="Nenhuma planta encontrada" texto="Tente outro nome ou outro tipo, ou veja também as arquivadas."
          acao={<Botao variante="secundaria" onClick={() => { setBusca(''); setParams({}, { replace: true }); }}>Limpar filtros</Botao>} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((c) => (
            <li key={c.id}><CartaoCultura cultura={c} mes={mes} plantios={plantios.filter((p) => p.culturaId === c.id)} ultimo={ultimo.get(c.id) ?? null} /></li>
          ))}
        </ul>
      )}

      <Dialogo aberto={novaAberta} aoMudar={(v) => { if (!salvando) setNovaAberta(v); }} titulo="Adicionar planta" largura="max-w-2xl"
        rodape={<BotoesDoForm form={ID_FORM_CULTURA} salvando={salvando} aoCancelar={() => setNovaAberta(false)} />}>
        <FormCultura aoSalvando={setSalvando} aoConcluir={(c) => { setNovaAberta(false); void navegar(`/pomar/${c.id}`); }} />
      </Dialogo>
    </>
  );
}

function CartaoCultura({ cultura: c, mes, plantios, ultimo }: { cultura: Cultura; mes: number; plantios: ReturnType<typeof usePomar>['plantios']; ultimo: string | null }) {
  const plantas = plantios.reduce((s, p) => s + (p.quantidade ?? 0), 0);
  const incompletos = plantios.filter((p) => p.quantidade === null).length;
  const estagios = [...new Set(plantios.map((p) => p.estagio).filter((e) => e !== null))];
  const atencao = plantios.some((p) => p.estadoAtual === 'precisa_atencao');
  return (
    <Link to={`/pomar/${c.id}`} className="group block h-full">
      <Cartao className={cn('flex h-full flex-col gap-3 p-4 transition-[border-color,box-shadow] group-hover:border-primaria/40 group-hover:shadow-flutuante', !c.ativo && 'opacity-70')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-lg">{c.nome}</h2>
            <p className="text-sm text-texto-suave">{c.grupo}</p>
          </div>
          <ChevronRight aria-hidden className="mt-1 size-5 shrink-0 text-texto-suave transition-transform group-hover:translate-x-0.5" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {!c.ativo && <Selo>Arquivada</Selo>}
          {previstaNoMes(c, 'floracao', mes) && <Selo tom="sol">Época de florada</Selo>}
          {previstaNoMes(c, 'colheita', mes) && <Selo tom="terra">Época de colheita</Selo>}
          {atencao && <Selo tom="erro">{ESTADO.precisa_atencao}</Selo>}
          {estagios.map((e) => <Selo key={e} tom="verde">{ESTAGIO[e]}</Selo>)}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-linha pt-3 text-sm">
          <span className="flex items-center gap-1.5 text-texto-suave">
            <Sprout aria-hidden className="size-4" />
            {plantas > 0 ? plural(plantas, 'pé', 'pés') : 'Falta contar os pés'}
            {incompletos > 0 && plantas > 0 && <span className="text-xs">(+{incompletos} sem contar)</span>}
          </span>
          <span className="text-xs text-texto-suave">{ultimo ? `Anotado ${quandoFoi(ultimo)}` : 'Sem anotações'}</span>
        </div>
      </Cartao>
    </Link>
  );
}
