import { AlertDialog, Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Botao } from './botao';

/**
 * Janela de formulário (Radix Dialog, padrão shadcn/ui). No celular é uma folha que sobe do rodapé, ao alcance do
 * polegar; no computador, uma janela centralizada. Foco preso dentro, Esc fecha, título lido pelo leitor de tela.
 */
export function Dialogo({ aberto, aoMudar, titulo, descricao, children, rodape, largura = 'max-w-lg' }: {
  aberto: boolean; aoMudar: (v: boolean) => void; titulo: string; descricao?: string; children: ReactNode; rodape?: ReactNode; largura?: string;
}) {
  return (
    <Dialog.Root open={aberto} onOpenChange={aoMudar}>
      <Dialog.Portal>
        <Dialog.Overlay className="anim-fundo fixed inset-0 z-40 bg-mata/40 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            'anim-folha fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl bg-superficie shadow-flutuante outline-none',
            'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[88dvh] sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-cartao',
            largura,
          )}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-linha sm:hidden" />
          <header className="flex items-start justify-between gap-3 px-5 pt-3 pb-2 sm:px-6 sm:pt-5">
            <div>
              <Dialog.Title className="font-titulo text-xl font-semibold">{titulo}</Dialog.Title>
              {descricao ? <Dialog.Description className="text-sm text-texto-suave">{descricao}</Dialog.Description> : <Dialog.Description className="sr-only">{titulo}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <Botao variante="discreta" tamanho="icone" aria-label="Fechar" className="-mr-2 text-texto-suave"><X /></Botao>
            </Dialog.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">{children}</div>
          {rodape && (
            <footer className="flex flex-col-reverse gap-2 border-t border-linha px-5 py-3 sm:flex-row sm:justify-end sm:px-6" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
              {rodape}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Confirmação antes de excluir: `const confirmar = useConfirmar(); if (await confirmar({...})) ...`
// ---------------------------------------------------------------------------------------------------------------------

interface PedidoConfirmacao { titulo: string; texto: string; acao?: string; perigo?: boolean }
type Confirmar = (p: PedidoConfirmacao) => Promise<boolean>;
const ContextoConfirmar = createContext<Confirmar | null>(null);

export function ConfirmacaoProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const confirmar = useCallback<Confirmar>((p) => new Promise((ok) => { resolver.current = ok; setPedido(p); }), []);
  const responder = (v: boolean) => { resolver.current?.(v); resolver.current = null; setPedido(null); };

  return (
    <ContextoConfirmar.Provider value={confirmar}>
      {children}
      <AlertDialog.Root open={pedido !== null} onOpenChange={(v) => { if (!v) responder(false); }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="anim-fundo fixed inset-0 z-50 bg-mata/40" />
          <AlertDialog.Content className="anim-folha fixed inset-x-3 bottom-3 z-50 rounded-cartao bg-superficie p-5 shadow-flutuante sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2">
            <AlertDialog.Title className="font-titulo text-xl font-semibold">{pedido?.titulo}</AlertDialog.Title>
            <AlertDialog.Description className="mt-1.5 text-texto-suave">{pedido?.texto}</AlertDialog.Description>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Cancel asChild><Botao variante="secundaria">Cancelar</Botao></AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Botao variante={pedido?.perigo === false ? 'primaria' : 'perigo'} onClick={() => responder(true)}>{pedido?.acao ?? 'Apagar'}</Botao>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ContextoConfirmar.Provider>
  );
}

export function useConfirmar(): Confirmar {
  const c = useContext(ContextoConfirmar);
  if (!c) throw new Error('useConfirmar fora do ConfirmacaoProvider');
  return c;
}
