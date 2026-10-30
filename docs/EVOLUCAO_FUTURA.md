# Evolução futura

A ordem sugerida vai do que destrava o uso real para o que acrescenta valor.

## 1. Antes de uso real (prioridade alta)
1. **Login (Supabase Auth)** por e-mail com link mágico ou senha. Google é opcional.
2. **Propriedade e membros:** tabela `propriedades`, tabela `membros (propriedade_id, usuario_id, papel)` com papéis proprietário, administrador e funcionário, e `propriedade_id` nas tabelas atuais (migration `0002` preenche com a propriedade única de hoje).
3. **Trocar as políticas** `mvp_anon_*` por políticas para `authenticated` com base em `membros`. Testes multiusuário em `supabase/tests` (o usuário de uma propriedade não vê a outra). Ver [SEGURANCA.md](SEGURANCA.md).
4. **Autoria:** coluna `criado_por` (padrão `auth.uid()`) em eventos e colheitas.
5. **Backup** periódico (plano pago do Supabase ou `pg_dump` agendado).

## 2. Uso no campo
- **PWA instalável completo:** ícones PNG de 192/512 px, service worker para abrir rápido. Depois, **fila offline** de registros (gravar no aparelho e enviar quando houver sinal), com cuidado com conflitos.
- **Fotos** dos acontecimentos (Supabase Storage com bucket privado e limite de tamanho) e histórico fotográfico por planta.
- **Exportar** para planilha (.xlsx/.csv), já que o proprietário vem do Excel.

## 3. Pomar mais detalhado
- **Identificação individual** de árvores (tabela `plantas` filha de `plantios`, com código/etiqueta).
- **Mapa do terreno** e geolocalização dos plantios.
- **Manejo:** adubação (produto, dose), irrigação (volume) e controle sanitário, com calendário de tarefas.

## 4. Gestão
- Despesas, vendas (preço, cliente) e estoque da produção, que hoje sai pelo destino “Venda” sem valor.
- Notificações (ex.: “começa o período esperado de colheita da laranja”), sempre como lembrete, nunca como certeza.

## 5. Inteligência
- **Calendário aprendido:** sugerir ajuste dos meses a partir das datas de floração e colheita registradas ao longo dos anos (“nos últimos 3 anos, a jabuticaba floresceu entre agosto e outubro”), com aprovação do proprietário.
- **Previsão de produção** com base no histórico, só quando houver dados suficientes e sempre com a incerteza visível.
- Assistente de IA para dúvidas de manejo, com fontes, sem substituir a orientação técnica local (Incaper).

## Dívidas técnicas conhecidas
- Todo o histórico é carregado ao abrir o app. Com muitos anos de registros, filtrar por ano no serviço ou criar visões agregadas no banco.
- Testes de interface automatizados (Testing Library/Playwright) ainda não fazem parte da suíte. A validação no navegador do MVP foi feita por roteiro manual automatizado, fora do repositório.
- O Vite 6 está numa versão corrigida (6.4.5). Avaliar a migração para Vite 7 junto com o ArgusEdu.
