import { SlidersHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Botao } from './ui/botao';
import { Cartao } from './ui/cartao';

/**
 * Barra de filtros no topo da lista. No celular fica recolhida atrás de "Filtrar" (a lista aparece primeiro); do tablet
 * para cima fica sempre aberta. É um container (@container): os filhos se arrumam pela largura do cartão, não da tela.
 */
export function PainelDeFiltros({ ligado, aoLimpar, children }: { ligado: boolean; aoLimpar: () => void; children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Cartao className="@container p-4 sm:p-5">
      <button type="button" className="flex min-h-11 w-full items-center justify-between gap-2 font-semibold md:hidden" aria-expanded={aberto} onClick={() => setAberto((a) => !a)}>
        <span className="flex items-center gap-2"><SlidersHorizontal aria-hidden className="size-5" />Filtrar{ligado && <span className="font-normal text-texto-suave">(ligado)</span>}</span>
        <span className="text-sm text-primaria">{aberto ? 'Fechar' : 'Abrir'}</span>
      </button>
      <div className={cn(aberto ? 'grid' : 'hidden', 'mt-3 gap-4 md:mt-0 md:grid')}>
        {children}
        {ligado && <Botao variante="secundaria" tamanho="compacto" className="justify-self-start" onClick={aoLimpar}>Tirar filtros</Botao>}
      </div>
    </Cartao>
  );
}
