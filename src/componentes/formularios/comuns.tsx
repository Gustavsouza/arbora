// Peças repetidas nos formulários de registro.
import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { hojeISO, somarDias } from '@/dominio/datas';
import { cn } from '@/lib/cn';
import { comparaTexto } from '@/lib/formato';
import { rotuloDoPlantio, usePomar } from '@/estado/pomar';
import { Entrada, Seletor } from '@/componentes/ui/campos';

/** Culturas ativas agrupadas por grupo (optgroup). A cultura já escolhida aparece mesmo se estiver inativa. */
export function OpcoesDeCultura({ atual, vazio = 'Escolha a planta…' }: { atual?: string; vazio?: string }) {
  const { culturas } = usePomar();
  const visiveis = culturas.filter((c) => c.ativo || c.id === atual);
  const grupos = [...new Set(visiveis.map((c) => c.grupo))].sort(comparaTexto);
  return (
    <>
      <option value="">{vazio}</option>
      {grupos.map((g) => (
        <optgroup key={g} label={g}>
          {visiveis.filter((c) => c.grupo === g).map((c) => <option key={c.id} value={c.id}>{c.nome}{c.ativo ? '' : ' (arquivada)'}</option>)}
        </optgroup>
      ))}
    </>
  );
}

/** Local da planta escolhida (opcional). Não aparece se a planta não tem local anotado. */
export function SeletorDePlantio({ culturaId, valor, aoMudar, erro }: { culturaId: string; valor: string; aoMudar: (v: string) => void; erro?: string }) {
  const { plantios } = usePomar();
  const daCultura = plantios.filter((p) => p.culturaId === culturaId);
  if (!culturaId || daCultura.length === 0) return null;
  return (
    <Seletor rotulo="Em qual local?" opcional value={valor} onChange={(e) => aoMudar(e.target.value)} erro={erro}
      ajuda="Para quando a mesma planta está em lugares diferentes do sítio.">
      <option value="">Todos / não sei</option>
      {daCultura.map((p, i) => <option key={p.id} value={p.id}>{rotuloDoPlantio(p, i)}</option>)}
    </Seletor>
  );
}

/** Data com atalhos "Hoje" e "Ontem" (a maioria dos registros é do dia). */
export function CampoData({ rotulo, valor, aoMudar, erro }: { rotulo: string; valor: string; aoMudar: (v: string) => void; erro?: string }) {
  const hoje = hojeISO();
  const ontem = somarDias(hoje, -1);
  const atalho = (d: string, texto: string) => (
    <button type="button" aria-pressed={valor === d} onClick={() => aoMudar(d)}
      className={cn('min-h-12 rounded-controle border px-4 text-sm font-semibold transition-colors',
        valor === d ? 'border-primaria bg-primaria-suave text-primaria-forte' : 'border-linha bg-superficie hover:border-borda')}>
      {texto}
    </button>
  );
  return (
    <div className="grid grid-cols-[auto_auto_1fr] items-end gap-2">
      <div className="col-span-3 -mb-1 text-sm font-semibold sm:hidden">{rotulo}</div>
      {atalho(hoje, 'Hoje')}
      {atalho(ontem, 'Ontem')}
      <Entrada rotulo={rotulo} type="date" max={hoje} value={valor} onChange={(e) => aoMudar(e.target.value)} erro={erro}
        className="[&>label]:sr-only sm:[&>label]:not-sr-only" />
    </div>
  );
}

/** Bloco "Mais detalhes" que abre e fecha (mantém o formulário curto). */
export function MaisDetalhes({ children, abertoInicial = false, resumo }: { children: ReactNode; abertoInicial?: boolean; resumo?: string }) {
  const [aberto, setAberto] = useState(abertoInicial);
  return (
    <div className="rounded-controle border border-linha">
      <button type="button" aria-expanded={aberto} onClick={() => setAberto((a) => !a)}
        className="flex min-h-12 w-full items-center justify-between gap-2 px-4 text-left text-sm font-semibold">
        <span>Mais detalhes <span className="font-normal text-texto-suave">{resumo ?? '(só se quiser)'}</span></span>
        <ChevronDown aria-hidden className={cn('size-5 transition-transform', aberto && 'rotate-180')} />
      </button>
      {aberto && <div className="grid gap-4 border-t border-linha p-4">{children}</div>}
    </div>
  );
}
