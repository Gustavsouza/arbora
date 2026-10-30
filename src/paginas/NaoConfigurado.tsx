import { Marca } from '@/componentes/Marca';

/** Sem as variáveis do Supabase não há sistema: explica como configurar, sem nenhum dado de mentira. */
export function NaoConfigurado() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="grid max-w-md gap-4 rounded-cartao bg-superficie p-6 shadow-cartao">
        <Marca />
        <h1 className="text-2xl">O aplicativo ainda não está pronto</h1>
        <p className="text-texto-suave">
          Crie o arquivo <code className="rounded bg-fundo px-1">.env.local</code> a partir do <code className="rounded bg-fundo px-1">.env.example</code> com a URL e a
          chave pública do projeto Supabase e reinicie o sistema. Na Vercel, cadastre as mesmas variáveis em Settings → Environment Variables.
        </p>
      </div>
    </main>
  );
}
