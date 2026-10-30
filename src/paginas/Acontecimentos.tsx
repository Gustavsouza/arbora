import { NotebookPen, Plus } from 'lucide-react';
import { useState } from 'react';
import { dentroDoPeriodo, type Periodo } from '@/dominio/datas';
import { TIPO_EVENTO, TIPOS_EVENTO } from '@/dominio/opcoes';
import type { TipoEvento } from '@/dominio/tipos';
import { usePomar } from '@/estado/pomar';
import { useRegistro } from '@/estado/registro';
import { plural } from '@/lib/formato';
import { FiltroPeriodo } from '@/componentes/FiltroPeriodo';
import { PainelDeFiltros } from '@/componentes/PainelDeFiltros';
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

  const filtrados = eventos.filter((e) => (!culturaId || e.culturaId === culturaId) && (!tipo || e.tipo === tipo) && dentroDoPeriodo(e.data, periodo));
  const temFiltro = Boolean(culturaId || tipo || periodo.de || periodo.ate);

  return (
    <>
      <CabecalhoPagina titulo="Anotações" descricao="O caderno do pomar: floradas, frutos, podas, adubações, problemas. Tudo o que você viu."
        acoes={<Botao onClick={() => registrarEvento(culturaId ? { culturaId } : undefined)}><Plus aria-hidden />Anotar o que aconteceu</Botao>} />

      <div className="grid gap-4">
        <PainelDeFiltros ligado={temFiltro} aoLimpar={() => { setCulturaId(''); setTipo(''); setPeriodo({}); }}>
          <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
            <Seletor rotulo="Planta" value={culturaId} onChange={(e) => { setCulturaId(e.target.value); setLimite(PAGINA); }}><OpcoesDeCultura vazio="Todas as plantas" /></Seletor>
            <Seletor rotulo="O que aconteceu" value={tipo} onChange={(e) => { setTipo(e.target.value as TipoEvento | ''); setLimite(PAGINA); }}>
              <option value="">Tudo</option>
              {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{TIPO_EVENTO[t].rotulo}</option>)}
            </Seletor>
            <div className="@xl:col-span-2 @4xl:col-span-1"><FiltroPeriodo periodo={periodo} aoMudar={(p) => { setPeriodo(p); setLimite(PAGINA); }} /></div>
          </div>
        </PainelDeFiltros>

        <Cartao className="p-5">
          <p className="mb-4 text-sm text-texto-suave" aria-live="polite">{plural(filtrados.length, 'anotação', 'anotações')}{temFiltro && ' com o filtro escolhido'}</p>
          {filtrados.length === 0 ? (
            eventos.length === 0
              ? <EstadoVazio icone={<NotebookPen />} titulo="O caderno ainda está em branco" texto="Viu as primeiras flores, fez uma poda ou notou uma praga? Anote em poucos toques. A data de hoje já vem marcada."
                  acao={<Botao onClick={() => registrarEvento()}><Plus aria-hidden />Fazer a primeira anotação</Botao>} />
              : <EstadoVazio icone={<NotebookPen />} titulo="Nada encontrado" texto="Tente outras datas, outra planta ou outro tipo." />
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
