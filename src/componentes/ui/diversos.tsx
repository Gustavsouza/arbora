import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MESES_CURTOS } from '@/dominio/opcoes';

/** Cabeçalho de página: título em serifa, descrição curta e ações à direita (abaixo, no celular). */
export function CabecalhoPagina({ titulo, descricao, acoes, sobretitulo }: { titulo: string; descricao?: ReactNode; acoes?: ReactNode; sobretitulo?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {sobretitulo && <div className="mb-1 text-sm font-medium text-texto-suave">{sobretitulo}</div>}
        <h1 className="text-[1.75rem] sm:text-[2rem]">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-2xl text-texto-suave">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2 sm:shrink-0 sm:flex-nowrap">{acoes}</div>}
    </header>
  );
}

/** Estado vazio: explica o que é a área e como começar. */
export function EstadoVazio({ icone, titulo, texto, acao, className }: { icone: ReactNode; titulo: string; texto: ReactNode; acao?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-cartao border border-dashed border-borda/50 bg-superficie-suave px-6 py-10 text-center', className)}>
      <span aria-hidden className="grid size-14 place-items-center rounded-full bg-primaria-suave text-primaria [&_svg]:size-7">{icone}</span>
      <h3 className="text-lg">{titulo}</h3>
      <p className="max-w-sm text-sm text-texto-suave">{texto}</p>
      {acao && <div className="mt-1">{acao}</div>}
    </div>
  );
}

export function Selo({ children, tom = 'neutro', className }: { children: ReactNode; tom?: 'neutro' | 'verde' | 'sol' | 'terra' | 'erro'; className?: string }) {
  const cores = {
    neutro: 'bg-fundo-forte text-texto-suave', verde: 'bg-primaria-suave text-primaria-forte', sol: 'bg-sol-suave text-sol-forte',
    terra: 'bg-terra-suave text-terra', erro: 'bg-erro-suave text-erro',
  }[tom];
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5', cores, className)}>{children}</span>;
}

/**
 * Escolha única com botões grandes (radio group): mais rápido que um select quando há poucas opções.
 * `colunas` controla a grade no celular.
 */
export function Chips<T extends string>({ rotulo, opcoes, valor, aoMudar, erro, colunas = 2, permitirVazio = false, ocultarRotulo = false }: {
  rotulo: string; opcoes: { valor: T; rotulo: string; icone?: ReactNode }[]; valor: T | ''; aoMudar: (v: T | '') => void;
  erro?: string; colunas?: 2 | 3 | 4; permitirVazio?: boolean; ocultarRotulo?: boolean;
}) {
  const grade = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[colunas];
  return (
    <fieldset className="grid gap-1.5">
      <legend className={cn('mb-1.5 text-sm font-semibold', ocultarRotulo && 'sr-only')}>{rotulo}</legend>
      <div role="radiogroup" aria-label={rotulo} className={cn('grid gap-2', grade)}>
        {opcoes.map((o) => {
          const ativo = valor === o.valor;
          return (
            <button key={o.valor} type="button" role="radio" aria-checked={ativo}
              onClick={() => aoMudar(ativo && permitirVazio ? '' : o.valor)}
              className={cn(
                'flex min-h-12 items-center gap-2 rounded-controle border px-3 py-2 text-left text-sm font-medium leading-tight transition-colors [&_svg]:size-5 [&_svg]:shrink-0',
                ativo ? 'border-primaria bg-primaria-suave text-primaria-forte ring-1 ring-primaria' : 'border-linha bg-superficie hover:border-borda',
              )}>
              {o.icone}<span>{o.rotulo}</span>
            </button>
          );
        })}
      </div>
      {erro && <span role="alert" className="text-[0.8125rem] font-semibold text-erro">{erro}</span>}
    </fieldset>
  );
}

/** 12 meses marcáveis (calendário da cultura). */
export function SeletorDeMeses({ rotulo, valor, aoMudar, cor }: { rotulo: string; valor: number[]; aoMudar: (m: number[]) => void; cor: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden className="size-3 rounded-full" style={{ background: cor }} />{rotulo}
      </legend>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
        {MESES_CURTOS.map((nome, i) => {
          const m = i + 1;
          const ativo = valor.includes(m);
          return (
            <button key={nome} type="button" aria-pressed={ativo} aria-label={`${rotulo}: ${nome}`}
              onClick={() => aoMudar(ativo ? valor.filter((x) => x !== m) : [...valor, m].sort((a, b) => a - b))}
              className={cn('flex min-h-11 items-center justify-center gap-1 rounded-lg border text-sm font-semibold transition-colors',
                ativo ? 'border-transparent text-mata' : 'border-linha bg-superficie text-texto-suave hover:border-borda')}
              style={ativo ? { background: cor } : undefined}>
              {ativo && <Check aria-hidden className="size-3.5" />}{nome}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Mensagem de erro de carregamento com botão para tentar de novo. */
export function ErroDeCarga({ mensagem, tentar }: { mensagem: string; tentar: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-cartao border border-erro/30 bg-erro-suave p-5 text-erro">
      <p className="font-semibold">{mensagem}</p>
      <button type="button" onClick={tentar} className="min-h-11 rounded-controle border border-erro/40 bg-superficie px-4 font-semibold hover:bg-erro-suave">Tentar de novo</button>
    </div>
  );
}
