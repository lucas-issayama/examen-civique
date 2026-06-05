# Upstash Redis — alternativa ao Supabase para as estatísticas globais

> Status: **análise, não implementado.** Este documento compara a opção
> Upstash Redis com o plano Supabase já documentado em
> [`supabase/SETUP.md`](../supabase/SETUP.md), para decidir qual backend usar
> nas estatísticas globais anônimas (questões mais difíceis).

---

## "Tenho que criar contas?" — dois sentidos

Vale separar, porque é a dúvida que costuma confundir:

- **Conta de usuário no app** (login dos visitantes): ❌ **não.** Continua
  igual ao plano Supabase — anônimo, sem login. O recurso só agrega contadores.
- **Conta de serviço** (você, dev): ✅ **sim, uma** — uma conta no Upstash
  (free). Mas isso é idêntico ao Supabase: lá você também precisa criar uma
  conta/projeto. Não é um custo novo em relação ao que já planejamos.

E há duas formas de criar essa conta de serviço:

1. **Pela Vercel Marketplace (recomendado):** no painel da Vercel →
   *Storage / Marketplace* → adiciona "Upstash Redis". Você se autentica via
   Vercel, e ela injeta as variáveis de ambiente automaticamente no projeto.
   É o caminho mais integrado.
2. **Direto em [upstash.com](https://upstash.com):** cria a conta, cria um
   banco Redis, copia a URL REST + token e cola nas env vars (local e Vercel).

---

## Como funciona por baixo

Redis é um banco **chave-valor em memória**. Para contadores ele é perfeito
porque tem incremento atômico nativo (`HINCRBY`) — sem SQL, sem função, sem
condição de corrida.

**Modelo de dados** (dois *hashes*, cada campo = id da questão):

```
stats:attempts → { "12": 340, "87": 290, ... }   # quantas vezes a questão foi respondida
stats:wrong    → { "12": 245, "87":  40, ... }   # quantas vezes foi errada
```

**O fluxo** (a diferença mecânica vs. Supabase está aqui):

```
Supabase:  navegador --(anon key, seguro)--> Supabase     [escreve direto]
Upstash:   navegador --> /api/record (Next, servidor) --(token secreto)--> Upstash
```

O token do Upstash **não pode ir pro navegador** (é segredo total, dá acesso de
escrita a tudo). Então as chamadas passam por **rotas de servidor do Next** —
que a app já suporta nativamente na Vercel. Isso, na prática, é até melhor: você
valida o `id`, limita abuso e esconde a credencial no servidor.

**No fim de um quiz:**

```
POST /api/record  body: [{id:12, wrong:true}, {id:87, wrong:false}, ...]
   → no servidor, para cada item:
       HINCRBY stats:attempts 12 1
       HINCRBY stats:wrong    12 1   (só se errou)
```

**Para mostrar as mais difíceis:**

```
GET /api/stats
   → HGETALL stats:attempts + HGETALL stats:wrong
   → devolve { 12: {attempts:340, wrong:245}, ... }  (mesmo formato que stats.ts já usa)
```

---

## O que mudaria no projeto

Pequeno, e **a UI não muda nada** (graças à abstração `src/lib/stats.ts`):

1. **Dependência** `@upstash/redis` (cliente REST, roda em serverless/edge).
2. **Duas rotas novas:** `src/app/api/record/route.ts` (POST) e
   `src/app/api/stats/route.ts` (GET).
3. **Reescrever só `src/lib/stats.ts`:** `recordAnswers()` vira um
   `fetch('/api/record', ...)` e `fetchQuestionStats()` um `fetch('/api/stats')`.
4. **Env vars server-only** (sem `NEXT_PUBLIC_`): `UPSTASH_REDIS_REST_URL` e
   `UPSTASH_REDIS_REST_TOKEN`.

---

## Custo e escala

- **Free tier folgado** (centenas de milhares de comandos/mês, pay-per-request).
  Sua app tem ~366 chaves e escritas pequenas e esporádicas → fica muito abaixo
  do gratuito, provavelmente custo zero.
- **Latência baixíssima** (in-memory), e funciona na edge.

---

## Resumo da comparação honesta

| | Upstash Redis | Supabase |
|---|---|---|
| Conta de serviço (dev) | 1 (free) | 1 (free) |
| Login no app | não | não |
| Escrita do navegador | via rota `/api` (token secreto) | direto (anon key + RLS) |
| Ideal para | contadores (agora) | contas/sync (futuro) |
| Código a mudar | `stats.ts` + 2 rotas `/api` | já pronto |

**Em uma frase:** se a meta é só a estatística global, o Upstash é mais simples
e barato; o "preço" é uma conta Upstash (free) + duas rotinhas de API no Next.
Se você quer um backend único que também resolva as contas no futuro, o
Supabase ganha.
