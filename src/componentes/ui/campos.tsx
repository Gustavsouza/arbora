import { useId, type InputHTMLAttributes, type ReactNode, type Ref, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const base =
  'w-full min-h-12 rounded-controle border border-borda/70 bg-superficie px-3.5 text-base text-texto placeholder:text-texto-suave/60 ' +
  'transition-[border-color,box-shadow] duration-150 hover:border-borda aria-[invalid=true]:border-erro disabled:opacity-60';

interface Rotulado { rotulo: string; ajuda?: ReactNode; erro?: string; opcional?: boolean; className?: string }

/** Rótulo sempre visível, ajuda e erro ligados ao campo (aria-describedby). */
function Moldura({ rotulo, ajuda, erro, opcional, className, id, children }: Rotulado & { id: string; children: ReactNode }) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {rotulo}{opcional && <span className="font-normal text-texto-suave"> (opcional)</span>}
      </label>
      {children}
      {(erro || ajuda) && (
        <span id={`${id}-ajuda`} className={cn('text-[0.8125rem]', erro ? 'font-semibold text-erro' : 'text-texto-suave')} role={erro ? 'alert' : undefined}>
          {erro ?? ajuda}
        </span>
      )}
    </div>
  );
}

function useIds(id: string | undefined, temAjuda: boolean) {
  const gerado = useId();
  const campo = id ?? gerado;
  return { campo, descrito: temAjuda ? `${campo}-ajuda` : undefined };
}

type PropsEntrada = InputHTMLAttributes<HTMLInputElement> & Rotulado & { ref?: Ref<HTMLInputElement> };
export function Entrada({ rotulo, ajuda, erro, opcional, className, id, ...props }: PropsEntrada) {
  const { campo, descrito } = useIds(id, Boolean(ajuda || erro));
  return (
    <Moldura rotulo={rotulo} ajuda={ajuda} erro={erro} opcional={opcional} className={className} id={campo}>
      <input id={campo} aria-invalid={erro ? true : undefined} aria-describedby={descrito} className={base} {...props} />
    </Moldura>
  );
}

type PropsSeletor = SelectHTMLAttributes<HTMLSelectElement> & Rotulado & { ref?: Ref<HTMLSelectElement>; children: ReactNode };
/** Select nativo: no celular abre o seletor do próprio aparelho (mais fácil com o polegar). */
export function Seletor({ rotulo, ajuda, erro, opcional, className, id, children, ...props }: PropsSeletor) {
  const { campo, descrito } = useIds(id, Boolean(ajuda || erro));
  return (
    <Moldura rotulo={rotulo} ajuda={ajuda} erro={erro} opcional={opcional} className={className} id={campo}>
      <div className="relative">
        <select id={campo} aria-invalid={erro ? true : undefined} aria-describedby={descrito} className={cn(base, 'appearance-none pr-10')} {...props}>
          {children}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-texto-suave" />
      </div>
    </Moldura>
  );
}

type PropsArea = TextareaHTMLAttributes<HTMLTextAreaElement> & Rotulado & { ref?: Ref<HTMLTextAreaElement> };
export function AreaTexto({ rotulo, ajuda, erro, opcional, className, id, rows = 3, ...props }: PropsArea) {
  const { campo, descrito } = useIds(id, Boolean(ajuda || erro));
  return (
    <Moldura rotulo={rotulo} ajuda={ajuda} erro={erro} opcional={opcional} className={className} id={campo}>
      <textarea id={campo} rows={rows} aria-invalid={erro ? true : undefined} aria-describedby={descrito} className={cn(base, 'py-3 leading-snug')} {...props} />
    </Moldura>
  );
}

/** Campo de busca compacto, sem rótulo visível (o rótulo vai para o leitor de tela). */
export function Busca({ rotulo, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { rotulo: string }) {
  return (
    <label className={cn('relative block', className)}>
      <span className="sr-only">{rotulo}</span>
      <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-texto-suave" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input type="search" className={cn(base, 'pl-11')} {...props} />
    </label>
  );
}
