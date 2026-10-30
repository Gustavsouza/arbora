import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Só a chave PÚBLICA (publishable/anon) entra no navegador. A service_role nunca deve estar em variável VITE_*.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const chave = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const configurado = Boolean(url && chave);

let cliente: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!url || !chave) throw new Error('SUPABASE_NAO_CONFIGURADO');
  // Sem login no MVP: nada de sessão guardada no aparelho.
  cliente ??= createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}
