import { NotebookPen, Plus, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { dentroDoPeriodo, type Periodo } from '@/dominio/datas';
import { TIPO_EVENTO, TIPOS_EVENTO } from '@/dominio/opcoes';
import type { TipoEvento } from '@/dominio/tipos';
import { usePomar } from '@/estado/pomar';
import { useRegistro } from '@/estado/registro';
import { plural } from '@/lib/formato';
import { FiltroPeriodo } from '@/componentes/FiltroPeriodo';
import { juntarHistorico, LinhaDoTempo } from '@/componentes/Historico';
import { OpcoesDeCultura } from '@/componentes/formularios/comuns';
import { Botao } from '@/componentes/ui/botao';
import { Seletor } from '@/componentes/ui/campos';
import { Cartao } from '@/componentes/ui/cartao';
import { CabecalhoPagina, EstadoVazio } from '@/componentes/ui/diversos';

const PAGINA = 40;

export function Acontecimentos() {
  const { eventos } = usePomar();
  const { registrarEvento } = useRegistro();
  const [culturaId, setCulturaId] = useState('');
  const [tipo, setTipo] = useState<TipoEvento | ''>('');
  const [periodo, setPeriodo] = useState<Periodo>({});
  const [limite, setLimite] = useState(PAGINA);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const filtrados = eventos.filter((e) => (!culturaId || e.culturaId === culturaId) && (!tipo || e.tipo === tipo) && dentroDoPeriodo(e.data, periodo));
  const temFiltro = Boolean(culturaId || tipo || periodo.de || periodo.ate);

  return (
    <>
      <CabecalhoPagina titulo="Acontecimentos" descricao="O diário do pomar: floradas, frutos, podas, adubações, problemas — tudo o que você observou."
        acoes={<Botao onClick={() => registrarEvento(culturaId ? { culturaId } : undefined)}><Plus aria-hidden />Registrar acontecimento</Botao>} />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr] lg:items-start">
        <Cartao className="p-4 lg:sticky lg:top-6">
          <button type="button" className="flex min-h-10 w-full items-center justify-between font-semibold lg:hidden" aria-expanded={filtrosAbertos} onClick={() => setFiltrosAbertos((a) => !a)}>
            <span className="flex items-center gap-2"><SlidersHorizontal aria-hidden className="size-5" />Filtros{temFiltro && ' (ativos)'}</span>
            <span className="text-sm text-primaria">{filtrosAbertos ? 'Fechar' : 'Abrir'}</span>
          </button>
          <div className={`${filtrosAbertos ? 'grid' : 'hidden'} mt-3 gap-4 lg:mt-0 lg:grid`}>
            <Seletor rotulo="Cultura" value={culturaId} onChange={(e) => { setCulturaId(e.target.value); setLimite(PAGINA); }}><OpcoesDeCultura vazio="Todas as culturas" /></Seletor>
            <Seletor rotulo="Tipo" value={tipo} onChange={(e) => { setTipo(e.target.value as TipoEvento | ''); setLimite(PAGINA); }}>
              <option value="">Todos os tipos</option>
              {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{TIPO_EVENTO[t].rotulo}</option>)}
            </Seletor>
            <FiltroPeriodo periodo={periodo} aoMudar={(p) => { setPeriodo(p); setLimite(PAGINA); }} />
            {temFiltro && <Botao variante="secundaria" tamanho="compacto" onClick={() => { setCulturaId(''); setTipo(''); setPeriodo({}); }}>Limpar filtros</Botao>}
          </div>
        </Cartao>

        <Cartao className="p-5">
          <p className="mb-4 text-sm text-texto-suave" aria-live="polite">{plural(filtrados.length, 'acontecimento', 'acontecimentos')}{temFiltro && ' com os filtros escolhidos'}</p>
          {filtrados.length === 0 ? (
            eventos.length === 0
              ? <EstadoVazio icone={<NotebookPen />} titulo="O diário ainda está em branco" texto="Viu as primeiras flores, fez uma poda ou notou uma praga? Registre em poucos toques — a data de hoje já vem marcada."
                  acao={<Botao onClick={() => registrarEvento()}><Plus aria-hidden />Registrar o primeiro</Botao>} />
              : <EstadoVazio icone={<NotebookPen />} titulo="Nada com esses filtros" texto="Tente outro período, cultura ou tipo." />
          ) : (
            <>
              <LinhaDoTempo itens={juntarHistorico(filtrados.slice(0, limite), [])} />
              {filtrados.length > limite && <Botao variante="secundaria" className="mt-4 w-full" onClick={() => setLimite((l) => l + PAGINA)}>Mostrar mais</Botao>}
            </>
          )}
        </Cartao>
      </div>
    </>
  );
}
