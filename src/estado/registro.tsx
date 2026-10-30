// Registro rápido: "+ Registrar acontecimento" e "Registrar colheita" abrem de qualquer tela (botão flutuante, painel,
// página da cultura), já com a cultura escolhida quando faz sentido.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Colheita, Evento, TipoEvento } from '@/dominio/tipos';
import { Dialogo } from '@/componentes/ui/dialogo';
import { BotoesDoForm, FormEvento, ID_FORM_EVENTO } from '@/componentes/formularios/FormEvento';
import { FormColheita, ID_FORM_COLHEITA } from '@/componentes/formularios/FormColheita';

type Pedido =
  | { tipo: 'evento'; evento?: Evento; inicial?: { culturaId?: string; plantioId?: string; tipo?: TipoEvento } }
  | { tipo: 'colheita'; colheita?: Colheita; inicial?: { culturaId?: string; plantioId?: string } };

interface Registro {
  registrarEvento: (inicial?: { culturaId?: string; plantioId?: string; tipo?: TipoEvento }) => void;
  editarEvento: (e: Evento) => void;
  registrarColheita: (inicial?: { culturaId?: string; plantioId?: string }) => void;
  editarColheita: (c: Colheita) => void;
}

const Contexto = createContext<Registro | null>(null);

export function RegistroProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  // Muda a cada abertura: o formulário começa sempre limpo.
  const [versao, setVersao] = useState(0);

  const abrir = useCallback((p: Pedido) => { setPedido(p); setVersao((v) => v + 1); setAberto(true); }, []);
  const fechar = useCallback(() => setAberto(false), []);

  const valor = useMemo<Registro>(() => ({
    registrarEvento: (inicial) => abrir({ tipo: 'evento', inicial }),
    editarEvento: (evento) => abrir({ tipo: 'evento', evento }),
    registrarColheita: (inicial) => abrir({ tipo: 'colheita', inicial }),
    editarColheita: (colheita) => abrir({ tipo: 'colheita', colheita }),
  }), [abrir]);

  const ehEvento = pedido?.tipo === 'evento';
  const editando = pedido ? (pedido.tipo === 'evento' ? Boolean(pedido.evento) : Boolean(pedido.colheita)) : false;
  const titulo = ehEvento ? (editando ? 'Editar acontecimento' : 'Registrar acontecimento') : (editando ? 'Editar colheita' : 'Registrar colheita');

  return (
    <Contexto.Provider value={valor}>
      {children}
      <Dialogo aberto={aberto} aoMudar={(v) => { if (!salvando) setAberto(v); }} titulo={titulo}
        descricao={ehEvento ? 'Escolha a cultura e o que aconteceu. O resto é opcional.' : 'Quantidade, unidade e destino. O resto é opcional.'}
        rodape={<BotoesDoForm form={ehEvento ? ID_FORM_EVENTO : ID_FORM_COLHEITA} salvando={salvando} aoCancelar={fechar} rotulo={editando ? 'Salvar alterações' : 'Salvar'} />}>
        {pedido?.tipo === 'evento' && <FormEvento key={versao} evento={pedido.evento} inicial={pedido.inicial} aoConcluir={fechar} aoSalvando={setSalvando} />}
        {pedido?.tipo === 'colheita' && <FormColheita key={versao} colheita={pedido.colheita} inicial={pedido.inicial} aoConcluir={fechar} aoSalvando={setSalvando} />}
      </Dialogo>
    </Contexto.Provider>
  );
}

export function useRegistro(): Registro {
  const c = useContext(Contexto);
  if (!c) throw new Error('useRegistro fora do RegistroProvider');
  return c;
}
