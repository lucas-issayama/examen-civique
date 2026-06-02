# Plano de conexão ao Supabase (estatísticas globais)

> Status: **código pronto, ainda não conectado.** A funcionalidade fica
> desligada enquanto as variáveis de ambiente não existirem — o app continua
> 100 % estático. Este documento é o runbook para ativar no futuro.

O que já existe no projeto:

- `supabase/schema.sql` — tabela `question_stats` + função RPC `record_answers`
  (`SECURITY DEFINER`) + RLS.
- `src/lib/stats.ts` — cliente Supabase preguiçoso, guardado por env vars
  (`STATS_ENABLED`), com `recordAnswers()` e `fetchQuestionStats()`.
- O quiz grava resultados ao terminar; a página **Réviser** mostra o tri
  "🔥 Les plus difficiles" + selo de taxa de erro por questão.
- `.env.example` — modelo das variáveis.

---

## Pré-requisitos

- Uma conta em [supabase.com](https://supabase.com) (free tier basta).
- Acesso ao projeto na Vercel (para as variáveis em produção).

---

## Passo 1 — Criar o projeto

1. Dashboard Supabase → **New project**.
2. Escolha org, nome (ex.: `examen-civique`), região (ex.: `Europe (Paris)` /
   `eu-west-3` para latência baixa na França) e uma **senha de banco** (guarde).
3. Aguarde o provisionamento (~2 min).

---

## Passo 2 — Criar o schema

### Opção A — SQL Editor (recomendado, sem expor segredo)

1. Dashboard → **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`schema.sql`](schema.sql) e clique **Run**.
3. Confira em **Table Editor** que a tabela `question_stats` existe e que em
   **Database → Functions** há `record_answers`.

### Opção B — via `psql` (já instalado na máquina)

```bash
# Connection string: Dashboard → Project Settings → Database →
# Connection string → URI (use a porta 5432 "session" ou o pooler 6543)
psql "postgresql://postgres:[SENHA]@db.[REF].supabase.co:5432/postgres" \
  -f supabase/schema.sql
```

> ⚠️ A connection string é um **segredo de banco**. Não comitar; se for colada
> em algum lugar compartilhado, **rotacione a senha** depois
> (Settings → Database → Reset database password).

---

## Passo 3 — Pegar as chaves do client

Dashboard → **Project Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> A `anon key` é pública por design (protegida pelas RLS). **Nunca** use a
> `service_role` no front-end.

---

## Passo 4 — Configurar as variáveis

### Local (desenvolvimento)

```bash
cp .env.example .env.local
# edite .env.local e preencha as duas variáveis
npm run dev
```

`.env.local` está no `.gitignore` — não será comitado.

### Produção (Vercel)

Vercel → projeto → **Settings → Environment Variables** → adicione as duas
variáveis (Production + Preview) → **Redeploy**.

---

## Passo 5 — Validar de ponta a ponta

1. Abra o app, vá em **Quiz**, faça um quiz curto e termine.
2. No Supabase (**Table Editor → question_stats** ou SQL Editor), rode:

   ```sql
   select question_id, attempts, wrong, updated_at
   from public.question_stats
   order by updated_at desc
   limit 20;
   ```

   Devem aparecer linhas com `attempts`/`wrong` incrementando.
3. Em **Réviser**, o toggle "🔥 Les plus difficiles" aparece e os selos de
   `❌ X% d'échec` surgem nas questões com ≥ 5 tentativas
   (`MIN_ATTEMPTS` em `src/components/ReviserClient.tsx`).

---

## Segurança e operação

- **Modelo anônimo**: nenhuma informação pessoal é gravada — só contadores por
  questão. A escrita passa só pela função `SECURITY DEFINER`; clientes anônimos
  não conseguem inserir/atualizar linhas arbitrárias (sem policy de write).
- **Anti-spam** (opcional, futuro): como é anônimo, alguém poderia inflar os
  contadores chamando a RPC em massa. Mitigações possíveis: rate-limit por IP
  via Edge Function, hCaptcha/Turnstile no quiz, ou exigir auth anônima do
  Supabase com limite. Não implementado (risco baixo para um app de estudo).
- **Custo**: free tier do Supabase é suficiente (a tabela tem no máximo ~366
  linhas; escritas são pequenas e esporádicas).

---

## Desativar / rollback

- **Desativar** sem mexer no banco: remova as duas env vars e faça redeploy →
  `STATS_ENABLED` vira `false`, o recurso some, o app volta a ser estático.
- **Remover do banco**:

  ```sql
  drop function if exists public.record_answers(jsonb);
  drop table if exists public.question_stats;
  ```

---

## Evolução prevista (não incluída)

- **Contas de usuário** (Supabase Auth) para sincronizar progresso e erros
  pessoais entre dispositivos. Hoje o progresso pessoal fica em `localStorage`.
