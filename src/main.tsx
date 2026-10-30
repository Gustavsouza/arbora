import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Toaster } from 'sonner';
import { App } from './App';
import { configurado } from './servicos/cliente';
import { PomarProvider } from './estado/pomar';
import { RegistroProvider } from './estado/registro';
import { ConfirmacaoProvider } from './componentes/ui/dialogo';
import { NaoConfigurado } from './paginas/NaoConfigurado';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {configurado ? (
      <BrowserRouter>
        <ConfirmacaoProvider>
          <PomarProvider>
            <RegistroProvider>
              <App />
            </RegistroProvider>
          </PomarProvider>
        </ConfirmacaoProvider>
        <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }} />
      </BrowserRouter>
    ) : <NaoConfigurado />}
  </StrictMode>,
);
