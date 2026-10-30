// Faixa de 12 meses de uma cultura: uma linha por fase. Meses estimados pela estação aparecem listrados.
import { FASES, mesesDaFase } from '@/dominio/calendario';
import { FASE, MESES_CURTOS, nomeDoMes } from '@/dominio/opcoes';
import type { Cultura, Fase } from '@/dominio/tipos';
import { cn } from '@/lib/cn';

export const COR_FASE: Record<Fase, string> = { floracao: 'bg-floracao', frutificacao: 'bg-frutificacao', colheita: 'bg-colheita' };

export function FaixaDeMeses({ cultura, mesAtual, rotulos = true }: { cultura: Cultura; mesAtual?: number; rotulos?: boolean }) {
  const fases = FASES.filter((f) => mesesDaFase(cultura, f).length > 0);
  return (
    <div className="grid gap-1.5">
      {rotulos && (
        <div aria-hidden className="grid grid-cols-[5.5rem_repeat(12,minmax(0,1fr))] gap-0.5 text-center text-[0.625rem] font-semibold text-texto-suave sm:text-[0.6875rem]">
          <span />
          {MESES_CURTOS.map((m, i) => <span key={m} className={cn(mesAtual === i + 1 && 'text-primaria')}>{m.slice(0, 1)}<span className="hidden sm:inline">{m.slice(1)}</span></span>)}
        </div>
      )}
      {fases.length === 0 && <p className="text-sm text-texto-suave">Nenhum mês marcado.</p>}
      {fases.map((f) => {
        const meses = mesesDaFase(cultura, f);
        return (
          <div key={f} className="grid grid-cols-[5.5rem_repeat(12,minmax(0,1fr))] items-center gap-0.5">
            <span className="text-xs font-medium text-texto-suave">{FASE[f]}</span>
            {MESES_CURTOS.map((m, i) => {
              const ativo = meses.includes(i + 1);
              return (
                <span key={m} title={ativo ? `${FASE[f]}: ${nomeDoMes(i + 1)}` : undefined}
                  className={cn('h-4 rounded-[4px]', ativo ? [COR_FASE[f], !cultura.mesesConfirmados && 'estimado'] : 'bg-fundo-forte/70',
                    mesAtual === i + 1 && 'ring-2 ring-mata/50 ring-offset-1')} />
              );
            })}
          </div>
        );
      })}
      <p className="sr-only">
        {fases.map((f) => `${FASE[f]}: ${mesesDaFase(cultura, f).map(nomeDoMes).join(', ')}.`).join(' ')}
      </p>
    </div>
  );
}

/** Legenda das cores e do listrado. */
export function LegendaFases({ comEstimado = true }: { comEstimado?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-texto-suave">
      {FASES.map((f) => <li key={f} className="flex items-center gap-1.5"><span aria-hidden className={cn('size-3.5 rounded-[4px]', COR_FASE[f])} />{FASE[f]}</li>)}
      {comEstimado && <li className="flex items-center gap-1.5"><span aria-hidden className="estimado size-3.5 rounded-[4px] bg-texto-suave/50" />Aproximado pela estação (da planilha)</li>}
    </ul>
  );
}
