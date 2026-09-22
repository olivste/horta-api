# horta-api

API para a horta automatizada (InovaWeek / UVV). NestJS + Prisma + PostgreSQL.

## Ideia geral

- **Usuário único**: login simples com email/senha, JWT protege as rotas do dashboard.
- **Devices (ESP32)**: cada ESP é cadastrado no sistema e recebe uma **API key própria**
  (não usa o login do usuário). Essa key é o que você grava no firmware.
- **Telemetria**: leituras genéricas (`type` + `value`), hoje só `SOIL_HUMIDITY` está em
  uso, mas o enum `SensorType` já tem `TEMPERATURE`, `WATER_LEVEL` e `LUMINOSITY` prontos
  pra quando você definir os próximos sensores com seu amigo — não precisa de migration
  nova pra isso, só adicionar o valor no enum.

## Setup local (sem Docker na API, pra desenvolvimento)

```bash
cp .env.example .env
# edite o .env: senha do Postgres, JWT_SECRET
# (DATABASE_URL precisa bater com POSTGRES_USER/PASSWORD/DB)

docker compose up -d postgres   # sobe só o Postgres

npm install
npx prisma migrate dev --name init
npm run start:dev
```

O usuário único do sistema não vem mais de seed/`.env` — cria ele chamando
`POST /api/auth/register` uma vez (o app faz isso na primeira abertura). Esse endpoint
só funciona enquanto não existir ninguém cadastrado; depois disso ele sempre recusa
com 403, e o login normal (`POST /api/auth/login`) passa a ser o caminho.

## Deploy completo via Docker (API + Postgres) - pra rodar no servidor

O `docker-compose.yml` sobe **os dois**: Postgres e a API (buildada a partir do `Dockerfile`
local). No servidor (ZimaOS ou qualquer host com Docker):

```bash
cp .env.example .env
# edite o .env - IMPORTANTE: o DATABASE_URL do .env não importa pro container da API,
# o compose já sobrescreve automaticamente pra apontar pro service "postgres" da rede interna

docker compose up -d --build
```

O container da API roda `prisma migrate deploy` automaticamente antes de subir (idempotente,
seguro em todo restart). O usuário é criado via `POST /api/auth/register` (uma vez só, pelo
app), não tem mais seed manual pra rodar.

A API fica disponível em `http://<ip-do-servidor>:${API_PORT}/api` (porta 3000 por padrão).
Pra expor publicamente, aponta seu Cloudflare Tunnel (ou Traefik, se preferir) pra essa porta
do host - a API em si não sabe nem precisa saber como está sendo exposta.

Pra atualizar depois de mudar código: `docker compose up -d --build api`.

A API sobe em `http://localhost:3000/api`. Documentação Swagger em `http://localhost:3000/api/docs`.

No Swagger tem dois cadeados diferentes: **Bearer (jwt)** pras rotas do dashboard (clica em
"Authorize", cola o `accessToken` do login) e **device-key** pra testar o `POST /telemetry`
como se fosse o ESP (cola a `apiKey` do device ali).

## Fluxo de uso

1. Primeiro acesso: app chama `POST /api/auth/login` — se ainda não existe usuário, chama
   `POST /api/auth/register` (uma vez só) e guarda o `accessToken`.
2. Cadastre o ESP (`POST /api/devices`, com o JWT). Body: `{ name, hardwareId? }`. A resposta
   traz a `apiKey`,
   **copie nesse momento** (ela não é reexibida depois, só via rotate-key).
3. Grave essa `apiKey` no firmware do ESP para enviar em `x-device-key`.
4. O ESP envia leituras em `POST /api/telemetry` usando essa header.
5. O dashboard consulta `GET /api/telemetry` e `GET /api/telemetry/latest`, ambos com JWT.

## Endpoints

| Método | Rota                    | Auth              | Descrição                                  |
|--------|-------------------------|-------------------|---------------------------------------------|
| POST   | `/api/auth/register`    | -                 | Cria o usuário único (só funciona 1 vez, sem `.env`) |
| POST   | `/api/auth/login`       | -                 | Login, retorna JWT                          |
| POST   | `/api/devices`          | JWT               | Cadastra um ESP, retorna a apiKey. Com `hardwareId` repetido, re-pareia (key nova) em vez de duplicar |
| GET    | `/api/devices`          | JWT               | Lista devices                               |
| GET    | `/api/devices/:id`      | JWT               | Detalhe de um device                        |
| PATCH  | `/api/devices/:id/toggle` | JWT             | Ativa/desativa um device                    |
| PATCH  | `/api/devices/:id/rotate-key` | JWT         | Gera nova apiKey                            |
| DELETE | `/api/devices/:id`      | JWT               | Remove device (e suas leituras, em cascata) |
| POST   | `/api/telemetry`        | `x-device-key`    | ESP envia uma leitura (`type` + `value`)    |
| GET    | `/api/telemetry`        | JWT               | Lista leituras (filtros: deviceId, type, from, to) |
| GET    | `/api/telemetry/latest` | JWT               | Última leitura de cada device               |

## Exemplo de payload do ESP

```json
POST /api/telemetry
Headers: x-device-key: esp_xxxxxxxx...
{
  "type": "SOIL_HUMIDITY",
  "value": 42.5
}
```

## Deploy no Railway (produção)

1. Cria um novo projeto no Railway, conecta o repositório do Gitea/GitHub.
2. **Adiciona um plugin de PostgreSQL** (Railway → "+ New" → "Database" → "PostgreSQL"). Ele já cria uma `DATABASE_URL` própria.
3. No service da API, vai em **Variables** e referencia a URL do banco: `DATABASE_URL = ${{Postgres.DATABASE_URL}}` (usa a referência do próprio Railway, não copia o valor à mão - assim continua funcionando se o Railway rotacionar credenciais).
4. Ainda em Variables, define:
   - `JWT_SECRET` → gera um valor forte (`openssl rand -base64 32`)
   - `JWT_EXPIRES_IN` → `7d` (ou o que preferir)
   - **Não precisa setar `PORT`** - o Railway injeta essa variável automaticamente e a API já lê `process.env.PORT`.
5. O Railway detecta o `railway.toml` e builda usando o `Dockerfile` do projeto (mesma imagem usada no ZimaOS). O `CMD` do Dockerfile já roda `prisma migrate deploy` a cada deploy, então toda migration nova aplicada no `git push` sobe automaticamente.
6. Depois do primeiro deploy, pega a URL pública que o Railway gera (Settings → Networking → "Generate Domain") - é ela que o app mobile vai usar como `apiBaseUrl` em produção.

Health check: `GET /api/health` retorna `{ "status": "ok" }` sem autenticação - é o que o Railway usa pra saber se o deploy subiu certo (configurado em `railway.toml`).

**Diferença importante do ZimaOS**: lá vocês usam Docker Compose com um Postgres próprio no mesmo host; no Railway, o Postgres é um serviço gerenciado à parte, então o `docker-compose.yml` **não é usado no Railway** - ele continua servindo só pro ambiente local/ZimaOS. O `Dockerfile` é o único artefato compartilhado entre os dois ambientes.

## Próximos passos (quando quiser)

- Docker/Traefik para deploy no ZimaOS (fica pra depois, como combinado).
- Se decidirem por mais sensores, é só usar os outros valores do enum `SensorType`
  no payload — nenhuma mudança de schema necessária.
- Se um dia precisar de mais de um usuário, o schema já suporta (é só abrir um
  endpoint de criação de usuário — hoje só existe via seed, de propósito).
