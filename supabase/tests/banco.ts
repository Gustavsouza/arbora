// Banco de teste: PostgreSQL real (PGlite) com o mínimo do Supabase que a migration usa: papéis anon/authenticated
// e os privilégios padrão que o Supabase dá em tabelas novas do schema public (a migration precisa revogá-los).
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const MIGRATIONS = fileURLToPath(new URL('../migrations/', import.meta.url));

const SUPABASE_SIMULADO = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  -- Como no Supabase: tudo que for criado em public nasce liberado para os papéis da API.
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
`;

export async function novoBanco(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(SUPABASE_SIMULADO);
  for (const f of readdirSync(MIGRATIONS).filter((n) => n.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(MIGRATIONS + f, 'utf8'));
  }
  return db;
}

/** Passa a agir como o visitante do app (chave pública, sem login): RLS e privilégios valem. */
export async function comoVisitante(db: PGlite): Promise<void> {
  await db.exec('RESET ROLE; SET ROLE anon');
}

/** Volta ao dono do banco (preparação e conferência). */
export async function comoSistema(db: PGlite): Promise<void> {
  await db.exec('RESET ROLE');
}
