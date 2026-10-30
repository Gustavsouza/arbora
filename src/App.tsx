import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { Layout } from '@/componentes/Layout';
import { usePomar } from '@/estado/pomar';
import { Carregando, Esqueleto } from '@/componentes/ui/esqueleto';
import { ErroDeCarga } from '@/componentes/ui/diversos';

// Cada área é baixada quando aberta (Relatórios traz a biblioteca de gráficos só para ela).
const Inicio = lazy(() => import('@/paginas/Inicio').then((m) => ({ default: m.Inicio })));
const MeuPomar = lazy(() => import('@/paginas/MeuPomar').then((m) => ({ default: m.MeuPomar })));
const CulturaPagina = lazy(() => import('@/paginas/CulturaPagina').then((m) => ({ default: m.CulturaPagina })));
const Calendario = lazy(() => import('@/paginas/Calendario').then((m) => ({ default: m.Calendario })));
const Acontecimentos = lazy(() => import('@/paginas/Acontecimentos').then((m) => ({ default: m.Acontecimentos })));
const Colheitas = lazy(() => import('@/paginas/Colheitas').then((m) => ({ default: m.Colheitas })));
const Relatorios = lazy(() => import('@/paginas/Relatorios').then((m) => ({ default: m.Relatorios })));

/** Esqueleto genérico de página (título + cartões) enquanto o código ou os dados chegam. */
export function EsqueletoDePagina() {
  return (
    <Carregando rotulo="Carregando…" className="grid gap-5">
      <Esqueleto className="h-9 w-56" />
      <Esqueleto className="h-5 w-80 max-w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-28 rounded-cartao" />)}</div>
      <Esqueleto className="h-64 rounded-cartao" />
    </Carregando>
  );
}

/** Só mostra a tela quando os dados do pomar chegaram (todas as telas dependem deles). */
function ComDados({ children }: { children: ReactNode }) {
  const { carregando, erro, recarregar, culturas } = usePomar();
  if (erro) return <ErroDeCarga mensagem={erro} tentar={() => void recarregar()} />;
  if (carregando && culturas.length === 0) return <EsqueletoDePagina />;
  return <Suspense fallback={<EsqueletoDePagina />}>{children}</Suspense>;
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ComDados><Inicio /></ComDados>} />
        <Route path="pomar" element={<ComDados><MeuPomar /></ComDados>} />
        <Route path="pomar/:id" element={<ComDados><CulturaPagina /></ComDados>} />
        <Route path="calendario" element={<ComDados><Calendario /></ComDados>} />
        <Route path="acontecimentos" element={<ComDados><Acontecimentos /></ComDados>} />
        <Route path="colheitas" element={<ComDados><Colheitas /></ComDados>} />
        <Route path="relatorios" element={<ComDados><Relatorios /></ComDados>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
