import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Cartao({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-cartao border border-linha/70 bg-superficie shadow-cartao', className)} {...props} />;
}

/** Título de seção dentro de cartão, com ícone e ação opcionais. */
export function TituloSecao({ icone, titulo, descricao, acao, id }: { icone?: ReactNode; titulo: string; descricao?: ReactNode; acao?: ReactNode; id?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {icone && <span aria-hidden className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primaria-suave text-primaria [&_svg]:size-5">{icone}</span>}
        <div className="min-w-0">
          <h2 id={id} className="text-lg">{titulo}</h2>
          {descricao && <p className="text-sm text-texto-suave">{descricao}</p>}
        </div>
      </div>
      {acao}
    </div>
  );
}

/** Indicador numérico do painel. */
export function Indicador({ icone, rotulo, valor, detalhe, tom = 'verde' }: {
  icone: ReactNode; rotulo: string; valor: ReactNode; detalhe?: ReactNode; tom?: 'verde' | 'sol' | 'terra';
}) {
  const cores = { verde: 'bg-primaria-suave text-primaria', sol: 'bg-sol-suave text-sol-forte', terra: 'bg-terra-suave text-terra' }[tom];
  return (
    <Cartao className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className={cn('grid size-8 place-items-center rounded-lg [&_svg]:size-4.5', cores)}>{icone}</span>
        <span className="text-[0.8125rem] leading-tight font-medium text-texto-suave">{rotulo}</span>
      </div>
      <strong className="font-titulo text-[1.75rem] leading-none font-semibold tabular-nums">{valor}</strong>
      {detalhe && <span className="text-xs text-texto-suave">{detalhe}</span>}
    </Cartao>
  );
}
