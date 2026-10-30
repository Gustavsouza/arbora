import { CalendarDays, ChartColumn, House, NotebookPen, Plus, ShoppingBasket, TreeDeciduous } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { useRegistro } from '@/estado/registro';
import { Marca } from './Marca';
import { Botao } from './ui/botao';

// Seis áreas, sem submenus. No celular os rótulos são curtos para caber na barra inferior.
const ITENS = [
  { para: '/', rotulo: 'Início', curto: 'Início', Icone: House },
  { para: '/pomar', rotulo: 'Meu pomar', curto: 'Pomar', Icone: TreeDeciduous },
  { para: '/calendario', rotulo: 'Calendário', curto: 'Calendário', Icone: CalendarDays },
  { para: '/anotacoes', rotulo: 'Anotações', curto: 'Anotações', Icone: NotebookPen },
  { para: '/colheitas', rotulo: 'Colheitas', curto: 'Colheitas', Icone: ShoppingBasket },
  { para: '/relatorios', rotulo: 'Relatórios', curto: 'Relatórios', Icone: ChartColumn },
] as const;

export function Layout() {
  const { registrarEvento, registrarColheita } = useRegistro();
  const { pathname } = useLocation();
  // Página nova começa do topo.
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-controle focus:bg-superficie focus:p-3">Ir para o conteúdo</a>

      {/* Computador: menu lateral verde-escuro */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 bg-mata px-4 py-6 text-white lg:flex">
        <Marca claro className="px-2" />
        <nav aria-label="Principal" className="grid gap-1">
          {ITENS.map(({ para, rotulo, Icone }) => (
            <NavLink key={para} to={para} end={para === '/'}
              className={({ isActive }) => cn('flex min-h-11 items-center gap-3 rounded-controle px-3 text-[0.9375rem] font-medium transition-colors',
                isActive ? 'bg-white/12 text-white' : 'text-white/75 hover:bg-white/6 hover:text-white')}>
              {({ isActive }) => <><Icone aria-hidden className={cn('size-5', isActive && 'text-sol')} />{rotulo}</>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto grid gap-2">
          <Botao variante="sol" onClick={() => registrarEvento()}><Plus aria-hidden />Anotar o que aconteceu</Botao>
          <Botao onClick={() => registrarColheita()} className="bg-white/10 hover:bg-white/15"><ShoppingBasket aria-hidden />Anotar colheita</Botao>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Celular: barra superior simples */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-linha/70 bg-fundo/90 px-4 py-2.5 backdrop-blur lg:hidden"
          style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
          <NavLink to="/" aria-label="Início"><Marca /></NavLink>
          <Botao variante="secundaria" tamanho="compacto" onClick={() => registrarColheita()}><ShoppingBasket aria-hidden />Colheita</Botao>
        </header>

        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-36 sm:px-6 lg:px-10 lg:pt-9 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Celular: ação de destaque, acima da barra inferior */}
      <button type="button" onClick={() => registrarEvento()}
        className="fixed right-4 z-30 flex min-h-14 items-center gap-2 rounded-full bg-primaria pr-5 pl-4 font-semibold text-white shadow-flutuante transition-transform active:scale-95 lg:hidden"
        style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom))' }}>
        <Plus aria-hidden className="size-6" />Anotar o que aconteceu
      </button>

      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-linha bg-superficie/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {ITENS.map(({ para, curto, rotulo, Icone }) => (
          <NavLink key={para} to={para} end={para === '/'} aria-label={rotulo}
            className={({ isActive }) => cn('flex min-h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors',
              isActive ? 'text-primaria' : 'text-texto-suave')}>
            {({ isActive }) => <>
              <span className={cn('grid h-7 w-12 place-items-center rounded-full transition-colors', isActive && 'bg-primaria-suave')}><Icone aria-hidden className="size-5" /></span>
              {curto}
            </>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
