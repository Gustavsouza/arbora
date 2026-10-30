# Arbora — gestão do pomar

MVP web (celular primeiro) que substitui a planilha **“Calendario Pomar Marechal Floriano.xlsx”** usada pelo proprietário de um sítio em Marechal Floriano (ES). Ele registra acontecimentos e colheitas, acompanha os plantios e consulta o calendário das 42 culturas, com um painel que cruza o calendário com os registros.

> **Sem login nesta fase.** Quem tiver o endereço do app lê e grava os dados liberados. Use apenas para demonstração, com dados não sensíveis. Detalhes em [SEGURANCA.md](SEGURANCA.md).

## Documentos

| Arquivo | Conteúdo |
|---|---|
| [ARQUITETURA.md](ARQUITETURA.md) | Estrutura técnica, pastas, decisões |
| [BANCO_DE_DADOS.md](BANCO_DE_DADOS.md) | Tabelas, relacionamentos, regras e a importação da planilha |
| [SEGURANCA.md](SEGURANCA.md) | RLS, acesso anônimo e limites do MVP |
| [FUNCIONALIDADES.md](FUNCIONALIDADES.md) | O que está implementado, tela a tela |
| [EVOLUCAO_FUTURA.md](EVOLUCAO_FUTURA.md) | Próximas versões |

## Requisitos

- Node.js 24 (`.nvmrc`) e npm.
- Um projeto Supabase (o plano gratuito basta).

## 1. Criar o banco no Supabase

1. Em [supabase.com](https://supabase.com), crie um projeto (região mais próxima: `sa-east-1`, São Paulo).
2. Abra **SQL Editor → New query**, cole **todo** o conteúdo de `supabase/migrations/0001_estrutura_e_culturas.sql` e clique em **Run**.
   Esse arquivo cria as tabelas, as regras, o acesso do MVP e já insere as 42 culturas, os 42 plantios a completar e as unidades de medida da planilha.
3. Para conferir, rode `select count(*) from culturas;`. O resultado deve ser **42**.

Rode a migration uma vez só. Rodar de novo dá erro de “já existe”, sem estragar nada.

## 2. Variáveis de ambiente

Em **Project Settings → API** (ou **API Keys**), copie a **Project URL** e a chave **publishable** (ou a antiga **anon public**).

```bash
cp .env.example .env.local
```

```ini
VITE_SUPABASE_URL=https://<ref-do-projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<chave publishable ou anon>
```

**Nunca** use a chave `service_role` / `secret`: tudo que começa com `VITE_` vai para o navegador. O `.env.local` está no `.gitignore`.

## 3. Rodar localmente

```bash
npm install
npm run dev        # http://localhost:5173
```

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm test` | Todos os testes (regras de negócio + banco com a migration real em PGlite) |
| `npm run test:db` | Só os testes do banco (migration, integridade, RLS) |
| `npm run test:regras` | Só as regras de negócio e validações |
| `npm run typecheck` | TypeScript |
| `npm run build` | TypeScript + build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |

## 4. Publicar na Vercel

1. Envie o repositório para o GitHub (sem `.env.local`).
2. Na Vercel: **Add New → Project**, importe o repositório. O `vercel.json` já define o framework Vite, `npm ci`, os testes antes do build, a reescrita de rotas para o SPA e os cabeçalhos de segurança.
3. Em **Settings → Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (Production e Preview).
4. Faça o deploy. Se mudar as variáveis depois, faça **Redeploy**: elas são embutidas no build.

O app vai ao ar com `noindex` (fora dos buscadores), mas quem tiver o link entra. Leia [SEGURANCA.md](SEGURANCA.md) antes de compartilhar o endereço.

## O que veio da planilha e o que o proprietário completa

| Origem na planilha | No Arbora |
|---|---|
| Calendário anual (42 culturas: nome, grupo, floração/colheita esperada, cuidados) | Importado **sem alteração de texto**. Meses só onde o texto cita estação (marcados como “estimado”). |
| Cadastro de plantas (só “Idade/estágio = Jovem” preenchido) | Um plantio por cultura, estágio Jovem, **quantidade, data e local em branco**. |
| Registro de eventos | Estava vazio: nada importado. |
| Colheitas | Só valores padrão das listas (“kg”, “Consumo familiar”), sem data nem quantidade: nada importado. |
| Resumo mensal | Fórmulas: viraram os Relatórios, calculados dos registros. |
| Listas (unidades, destinos, estágios, tipos de evento) | Viraram as opções do app, com os nomes da planilha. |

**O proprietário precisa completar:** quantidade, local, data de plantio e horas de sol de cada plantio; confirmar ou ajustar os meses estimados; e marcar os meses de frutificação, que a planilha não tinha.
