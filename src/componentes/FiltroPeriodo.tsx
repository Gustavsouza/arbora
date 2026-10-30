import { anoDe, hojeISO, somarDias, type Periodo } from '@/dominio/datas';
import { cn } from '@/lib/cn';
import { Entrada } from './ui/campos';

/** Atalhos de período calculados no calendário de Brasília. */
export function atalhosDePeriodo(hoje = hojeISO()): { chave: string; rotulo: string; periodo: Periodo }[] {
  const ano = anoDe(hoje);
  const inicioMes = `${hoje.slice(0, 7)}-01`;
  return [
    { chave: 'tudo', rotulo: 'Tudo', periodo: {} },
    { chave: 'mes', rotulo: 'Este mês', periodo: { de: inicioMes, ate: hoje } },
    { chave: '30d', rotulo: '30 dias', periodo: { de: somarDias(hoje, -29), ate: hoje } },
    { chave: 'ano', rotulo: `${ano}`, periodo: { de: `${ano}-01-01`, ate: `${ano}-12-31` } },
    { chave: 'anterior', rotulo: `${ano - 1}`, periodo: { de: `${ano - 1}-01-01`, ate: `${ano - 1}-12-31` } },
  ];
}

export function FiltroPeriodo({ periodo, aoMudar }: { periodo: Periodo; aoMudar: (p: Periodo) => void }) {
  const atalhos = atalhosDePeriodo();
  const ativo = atalhos.find((a) => (a.periodo.de ?? '') === (periodo.de ?? '') && (a.periodo.ate ?? '') === (periodo.ate ?? ''))?.chave;
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-sm font-semibold">Período</legend>
      <div className="flex flex-wrap gap-1.5">
        {atalhos.map((a) => (
          <button key={a.chave} type="button" aria-pressed={ativo === a.chave} onClick={() => aoMudar(a.periodo)}
            className={cn('min-h-10 rounded-full border px-3.5 text-sm font-medium', ativo === a.chave ? 'border-mata bg-mata text-white' : 'border-linha bg-superficie hover:border-borda')}>
            {a.rotulo}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Entrada rotulo="De" type="date" value={periodo.de ?? ''} onChange={(e) => aoMudar({ ...periodo, de: e.target.value || null })} />
        <Entrada rotulo="Até" type="date" value={periodo.ate ?? ''} onChange={(e) => aoMudar({ ...periodo, ate: e.target.value || null })} />
      </div>
    </fieldset>
  );
}
