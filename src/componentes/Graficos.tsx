// Gráficos (Recharts) com a identidade do Arbora: marcas finas, cantos de 4 px na ponta, grade discreta, uma escala
// só, dica (tooltip) com o valor exato e, para cada gráfico, uma tabela com os mesmos números.
import type { ReactNode } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { numero } from '@/lib/formato';

/** Cores dos gráficos. Comparação de anos validada para daltonismo (verde × azul); o ano anterior também é tracejado. */
export const COR = { producao: '#397A4A', cultura: '#80664B', eventos: '#8A6410', anoAtual: '#397A4A', anoAnterior: '#2F6DB0' } as const;

const EIXO = { fontSize: 12, fill: '#57655B' };
const GRADE = <CartesianGrid vertical={false} stroke="#E6DFD1" strokeDasharray="0" />;

interface PropsDica { active?: boolean; payload?: readonly { dataKey?: unknown; name?: unknown; value?: unknown; color?: string }[]; label?: unknown; unidade: string }
function Dica({ active, payload, label, unidade }: PropsDica) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-controle border border-linha bg-superficie px-3 py-2 text-sm shadow-flutuante">
      <p className="font-semibold">{String(label ?? '')}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 tabular-nums">
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: p.color }} />
          {payload.length > 1 && <span className="text-texto-suave">{String(p.name)}:</span>}
          <strong>{numero(Number(p.value ?? 0))} {unidade}</strong>
        </p>
      ))}
    </div>
  );
}

/** Colunas verticais de uma série (ex.: kg por mês). */
export function Colunas({ dados, chave, rotulo, cor, unidade, altura = 240 }: {
  dados: Record<string, string | number>[]; chave: string; rotulo: string; cor: string; unidade: string; altura?: number;
}) {
  return (
    <div aria-hidden style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
          {GRADE}
          <XAxis dataKey="rotulo" tick={EIXO} tickLine={false} axisLine={{ stroke: '#E6DFD1' }} interval={0} />
          <YAxis tick={EIXO} tickLine={false} axisLine={false} width={48} allowDecimals={false} tickFormatter={(v: number) => numero(v, 0)} />
          <Tooltip cursor={{ fill: 'rgb(57 122 74 / 0.08)' }} content={(p) => <Dica active={p.active} payload={p.payload} label={p.label} unidade={unidade} />} />
          <Bar dataKey={chave} name={rotulo} fill={cor} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras deitadas (ranking: cultura, destino). Altura cresce com o número de itens. */
export function Barras({ dados, chave, rotulo, cor, unidade }: { dados: Record<string, string | number>[]; chave: string; rotulo: string; cor: string; unidade: string }) {
  return (
    <div aria-hidden style={{ height: Math.max(120, dados.length * 40 + 24) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid horizontal={false} stroke="#E6DFD1" />
          <XAxis type="number" tick={EIXO} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={(v: number) => numero(v, 0)} />
          <YAxis type="category" dataKey="rotulo" tick={EIXO} tickLine={false} axisLine={false} width={112} />
          <Tooltip cursor={{ fill: 'rgb(57 122 74 / 0.08)' }} content={(p) => <Dica active={p.active} payload={p.payload} label={p.label} unidade={unidade} />} />
          <Bar dataKey={chave} name={rotulo} fill={cor} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Duas linhas no mesmo eixo (ano escolhido × ano anterior). */
export function LinhasComparadas({ dados, atual, anterior, unidade }: { dados: Record<string, string | number>[]; atual: string; anterior: string; unidade: string }) {
  return (
    <div aria-hidden style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 8, right: 20, bottom: 0, left: -12 }}>
          {GRADE}
          <XAxis dataKey="rotulo" tick={EIXO} tickLine={false} axisLine={{ stroke: '#E6DFD1' }} interval={0} />
          <YAxis tick={EIXO} tickLine={false} axisLine={false} width={48} allowDecimals={false} tickFormatter={(v: number) => numero(v, 0)} />
          <Tooltip cursor={{ stroke: '#8F8572', strokeDasharray: '3 3' }} content={(p) => <Dica active={p.active} payload={p.payload} label={p.label} unidade={unidade} />} />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 13, color: '#1E2B22' }} />
          <Line type="linear" dataKey={anterior} name={anterior} stroke={COR.anoAnterior} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} />
          <Line type="linear" dataKey={atual} name={atual} stroke={COR.anoAtual} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Os mesmos números em tabela: para leitor de tela e para quem prefere ler. */
export function TabelaDoGrafico({ titulo, colunas, linhas }: { titulo: string; colunas: string[]; linhas: ReactNode[][] }) {
  return (
    <details className="group text-sm">
      <summary className="inline-flex min-h-10 cursor-pointer items-center font-semibold text-primaria hover:underline">Ver em tabela</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">{titulo}</caption>
          <thead><tr>{colunas.map((c, i) => <th key={c} scope="col" className={`border-b border-linha py-1.5 pr-3 font-semibold ${i > 0 ? 'text-right' : ''}`}>{c}</th>)}</tr></thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-linha/60">
                {l.map((v, j) => j === 0 ? <th key={j} scope="row" className="py-1.5 pr-3 font-normal">{v}</th> : <td key={j} className="py-1.5 pr-3 text-right tabular-nums">{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
