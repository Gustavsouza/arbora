# Segurança e limites do MVP

## O que é este MVP

O Arbora não tem login nesta fase. O navegador fala com o Supabase usando a **chave pública** (publishable/anon), que fica dentro do código do site. Na prática:

> **Qualquer pessoa que tenha o endereço do app (ou que extraia a chave pública dele) pode ler, incluir, editar e excluir os dados que as políticas liberam, inclusive fora do app, chamando a API do Supabase diretamente.**

Por isso:

- Use o MVP só para **demonstração**, com dados do pomar que não sejam sensíveis.
- **Não** registre dados pessoais, financeiros ou estratégicos (preços, clientes, endereço exato, telefones).
- Compartilhe o endereço apenas com quem precisa avaliar.
- Antes de uso real com dados privados, implemente autenticação e autorização (ver [EVOLUCAO_FUTURA.md](EVOLUCAO_FUTURA.md)).

## O que está protegido mesmo assim

| Proteção | Como |
|---|---|
| Chave secreta fora do frontend | Só `VITE_SUPABASE_PUBLISHABLE_KEY` (pública). A `service_role` não é usada em lugar nenhum. |
| Credenciais fora do Git | `.env.local` no `.gitignore`; `.env.example` só com marcadores |
| RLS ligada | Em todas as 5 tabelas (testado) |
| Privilégios mínimos | A migration **revoga** o `ALL` que o Supabase dá por padrão a `anon`/`authenticated` e libera só o necessário |
| Culturas não se apagam | Sem `DELETE` em `culturas` (só inativar). Histórico preservado. |
| Colunas de controle imutáveis | `UPDATE` liberado por coluna: `id`, `created_at` e `updated_at` não são alteráveis pela API |
| Unidades do sistema | Gatilho impede alterar ou apagar kg, g etc. (o total em kg depende delas). A política impede criar unidade marcada como “do sistema”. |
| Integridade | Datas não futuras, plantio da mesma cultura, limites de texto e números etc. (ver [BANCO_DE_DADOS.md](BANCO_DE_DADOS.md)) valem também para quem chama a API diretamente |
| Funções internas | `EXECUTE` revogado das funções de gatilho (não podem ser chamadas via API). `hoje_sp()` fica liberada (é o valor padrão das datas e não expõe nada). |
| Sem sessão no aparelho | O cliente roda com `persistSession: false` |
| Cabeçalhos HTTP | `vercel.json`: CSP restrita (só o próprio site e `*.supabase.co`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: no-referrer`, HSTS, `noindex` |

## Matriz de acesso do visitante (anon)

| Tabela | Ler | Incluir | Editar | Excluir |
|---|---|---|---|---|
| culturas | ✔ | ✔ | ✔ (sem id/datas de controle) | ✘ |
| plantios | ✔ | ✔ | ✔ | ✔ |
| eventos | ✔ | ✔ | ✔ | ✔ |
| colheitas | ✔ | ✔ | ✔ | ✔ |
| unidades_medida | ✔ | ✔ (só não padrão) | ✘ | ✔ (só não padrão e sem uso) |

As políticas usam `using (true)` porque, sem login, **não existe dono** para comparar. Essa é a limitação do MVP, não um descuido. O que pode ser restringido sem login foi restringido acima.

## Riscos conhecidos (aceitos para a demonstração)

1. **Alteração ou exclusão por terceiros** que descubram o endereço. Mitigação: compartilhar pouco e fazer backup (Supabase → Database → Backups, ou `pg_dump`).
2. **Volume abusivo** (alguém incluindo milhares de registros). Os limites de tamanho reduzem o impacto, mas não há limite de quantidade sem login. O Supabase tem limites de requisição por projeto.
3. **Sem trilha de autoria**: não se sabe quem registrou o quê.
4. **Sem backup automático** no plano gratuito do Supabase.

## Como trocar para acesso autenticado

1. Ligar o Supabase Auth e criar a tela de login.
2. Adicionar `propriedade_id` (ou `dono_id`) às tabelas, com padrão para os dados existentes.
3. Apagar as políticas `mvp_anon_*` (`drop policy mvp_anon_ler on public.culturas;` …) e revogar os privilégios de `anon`.
4. Criar políticas para `authenticated` baseadas em `auth.uid()` (ex.: `using (propriedade_id in (select propriedade_id from membros where usuario_id = (select auth.uid())))`).
5. Atualizar os testes de `supabase/tests` para cobrir “usuário A não vê dados do B”.

O frontend só muda em `src/servicos/cliente.ts` (sessão) e na tela de login: as consultas continuam as mesmas, e as políticas filtram.
