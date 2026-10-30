import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Girando } from './esqueleto';

// Botão no estilo shadcn/ui com a identidade do Arbora. Alvo de toque mínimo de 48 px (uso no campo, com o polegar).
export const variantesDoBotao = cva(
  'inline-flex items-center justify-center gap-2 rounded-controle font-semibold cursor-pointer select-none whitespace-nowrap ' +
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] ' +
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        primaria: 'bg-primaria text-sobre-primaria shadow-[0_1px_2px_rgb(24_61_43/0.15)] hover:bg-primaria-forte',
        secundaria: 'border border-linha bg-superficie text-texto hover:border-borda hover:bg-superficie-suave',
        discreta: 'text-primaria hover:bg-primaria-suave',
        perigo: 'border border-erro/30 bg-superficie text-erro hover:bg-erro-suave',
        sol: 'bg-sol text-mata hover:brightness-95',
      },
      tamanho: { normal: 'min-h-12 px-5 text-[0.9375rem]', compacto: 'min-h-10 px-3.5 text-sm [&_svg]:size-4', icone: 'size-11 p-0' },
    },
    defaultVariants: { variante: 'primaria', tamanho: 'normal' },
  },
);

export type PropsBotao = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variantesDoBotao> & { carregando?: boolean };

export function Botao({ className, variante, tamanho, type = 'button', carregando, disabled, children, ...props }: PropsBotao) {
  return (
    <button type={type} className={cn(variantesDoBotao({ variante, tamanho }), className)} disabled={disabled || carregando}
      aria-busy={carregando || undefined} {...props}>
      {carregando && <Girando />}
      {children}
    </button>
  );
}
