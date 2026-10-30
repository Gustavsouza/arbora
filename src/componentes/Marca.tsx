import { cn } from '@/lib/cn';
import { NOME_DO_SISTEMA } from '@/dominio/opcoes';

/** Símbolo: copa de árvore em folha, com um fruto amarelo. */
export function Simbolo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
      <rect width="32" height="32" rx="9" fill="#397A4A" />
      <path d="M16 6c-5.5 0-9 4-9 8.6 0 3.9 2.9 6.9 6.8 7.3V26h4.4v-4.1c3.9-.4 6.8-3.4 6.8-7.3C25 10 21.5 6 16 6Z" fill="#E6F0E6" />
      <path d="M16 11v13M16 15.5l-3.2-2.6M16 18.5l3.4-2.8" stroke="#397A4A" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="21.6" cy="10.4" r="2.6" fill="#E9C46A" />
    </svg>
  );
}

export function Marca({ className, claro }: { className?: string; claro?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <Simbolo />
      <span className="leading-none">
        <span className={cn('block font-titulo text-[1.375rem] font-semibold tracking-tight', claro ? 'text-white' : 'text-mata')}>{NOME_DO_SISTEMA}</span>
        <span className={cn('block text-[0.6875rem] font-medium tracking-wide uppercase', claro ? 'text-white/60' : 'text-texto-suave')}>Gestão do pomar</span>
      </span>
    </span>
  );
}
