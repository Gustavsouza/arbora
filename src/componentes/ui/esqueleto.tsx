import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Bloco do esqueleto: use as medidas do conteúdo real para a tela não pular quando os dados chegam. */
export function Esqueleto({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden className={cn('esqueleto block rounded-lg', className)} style={style} />;
}

/** Área carregando: anuncia o rótulo ao leitor de tela; o esqueleto é só visual. */
export function Carregando({ rotulo, children, className }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{rotulo}</span>
      <div aria-hidden className="contents">{children}</div>
    </div>
  );
}

export function Girando({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn('size-5 shrink-0 animate-spin', className)}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
