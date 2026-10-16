# nestjs-playground

A small [NestJS](https://nestjs.com) backend web service for experimenting with Nest. It exposes health-style status endpoints and a player CRUD API backed by PostgreSQL, with filtering, sorting, pagination, request validation and Swagger docs. The database is seeded with the same base set of World Cup player data used by the `springbootplay` project.

## Tech stack

- NestJS 12 (TypeScript, ES modules) on the Express platform
- PostgreSQL 17, run locally via Docker Compose
- TypeORM for database access
- class-validator / class-transformer for request validation
- `@nestjs/swagger` for OpenAPI docs and Swagger UI
- Vitest + Supertest for tests, oxlint for linting, Prettier for formatting

## Prerequisites

- Node.js 22 (22.22.3 or later recommended; older 22.x versions work but print engine warnings during install)
- Docker Desktop (or another Docker engine with Compose v2)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your local config (gitignored)
cp .env.example .env

# 3. Start the database (first run creates the schema and seeds 50 players)
docker compose up -d

# 4. Start the service in watch mode
npm run start:dev
```

The service listens on **http://localhost:8082**. Check it is up:

```bash
curl http://localhost:8082/status
# {"status":"up"}
```

Then open **http://localhost:8082/api** to browse and try out the API in Swagger UI.

The service connects to the database on startup, so start Postgres before the app.

## API

### Swagger / OpenAPI

| URL                                                              | What it is                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| [http://localhost:8082/api](http://localhost:8082/api)           | Swagger UI: interactive docs with "Try it out" for every endpoint |
| [http://localhost:8082/api-json](http://localhost:8082/api-json) | Raw OpenAPI 3 document: import into Postman, or generate a client |

The document is built from decorators on the controllers and DTOs (`@ApiProperty`, `@ApiOkResponse`, etc.), so it lists each field's validation rules and each endpoint's possible responses. Setup lives in `src/swagger.ts`. Swagger is currently served in every environment, including Kubernetes.

### Endpoints

| Method | Path            | Description                             | Response              |
| ------ | --------------- | --------------------------------------- | --------------------- |
| GET    | `/status`       | Liveness check                          | `{"status":"up"}`     |
| GET    | `/health/ready` | Readiness: pings the database           | JSON, 200 or 503      |
| GET    | `/players`      | Players, filtered, sorted and paginated | Paginated JSON        |
| GET    | `/players/:id`  | One player by player number             | JSON, 200 or 404      |
| POST   | `/players`      | Create a player                         | JSON, 201 or 400      |
| PATCH  | `/players/:id`  | Update some of a player's fields        | JSON, 200, 400 or 404 |
| DELETE | `/players/:id`  | Delete a player                         | Empty, 204 or 404     |

### `GET /players`

```bash
curl "http://localhost:8082/players?nationality=england&sort=-rating&limit=2"
```

```json
{
  "data": [
    {
      "playerNo": 1,
      "name": "Harry Kane",
      "age": 32,
      "rating": 9.1,
      "position": "FW",
      "club": "Bayern Munich",
      "nationality": "England"
    },
    {
      "playerNo": 2,
      "name": "Jude Bellingham",
      "age": 22,
      "rating": 9,
      "position": "MF",
      "club": "Real Madrid",
      "nationality": "England"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 2
}
```

All query parameters are optional:

| Parameter                | Meaning                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `name`                   | Case-insensitive partial match, e.g. `name=kane`                                          |
| `position`               | Exact position: `GK`, `DF`, `MF` or `FW`                                                  |
| `club`, `nationality`    | Case-insensitive exact match, e.g. `club=arsenal`                                         |
| `minAge`, `maxAge`       | Inclusive age range                                                                       |
| `minRating`, `maxRating` | Inclusive rating range                                                                    |
| `sort`                   | `playerNo`, `name`, `age` or `rating`; prefix with `-` for descending. Default `playerNo` |
| `page`, `limit`          | Page number (from 1, default 1) and page size (1–100, default 20)                         |

`total` is the number of matching players across all pages, so the last page is `ceil(total / limit)`. Unknown parameters or invalid values return `400 Bad Request`.

More examples:

```bash
# Goalkeepers rated 8.5 or above, best first
curl "http://localhost:8082/players?position=GK&minRating=8.5&sort=-rating"

# Second page of under-25s, 10 per page, youngest first
curl "http://localhost:8082/players?maxAge=24&sort=age&page=2&limit=10"

# Name search
curl "http://localhost:8082/players?name=kane"
```

### `GET /players/:id`

```bash
curl http://localhost:8082/players/1
```

Returns a single player object (same shape as the items in `data` above), `404` if no player has that number, or `400` if the id isn't a whole number.

### `POST /players`

```bash
curl -X POST http://localhost:8082/players \
  -H "Content-Type: application/json" \
  -d '{"name":"Cole Palmer","age":24,"rating":8.7,"position":"MF","club":"Chelsea","nationality":"England"}'
```

Returns `201 Created` with the saved player, including the `playerNo` the database assigned (51 on a freshly seeded database).

### `PATCH /players/:id`

```bash
curl -X PATCH http://localhost:8082/players/51 \
  -H "Content-Type: application/json" \
  -d '{"rating":8.9,"club":"Chelsea FC"}'
```

Send only the fields you want to change. Returns `200` with the full updated player, or `404`.

### `DELETE /players/:id`

```bash
curl -X DELETE http://localhost:8082/players/51
```

Returns `204 No Content`, or `404` if the player doesn't exist.

### Validation rules

Request bodies for `POST` and `PATCH` are checked against these rules. `POST` needs every field. `PATCH` accepts any subset, and checks whatever fields you send.

| Field         | Rule                                                                            |
| ------------- | ------------------------------------------------------------------------------- |
| `name`        | Non-empty string, up to 255 characters                                          |
| `age`         | Whole number from 15 to 50                                                      |
| `rating`      | Number from 0 to 10, at most one decimal place                                  |
| `position`    | One of `GK`, `DF`, `MF`, `FW`                                                   |
| `club`        | Non-empty string, up to 255 characters                                          |
| `nationality` | Non-empty string, up to 255 characters: the national team the player represents |

`playerNo` is assigned by the database. Sending it, or any other field not listed above, is rejected.

### Error responses

Errors use Nest's standard shape. Validation failures list every problem found:

```bash
curl -X POST http://localhost:8082/players -H "Content-Type: application/json" \
  -d '{"name":"Test","age":24,"rating":11,"position":"ST","club":"X","nationality":"Y"}'
```

```json
{
  "message": [
    "rating must not be greater than 10",
    "position must be one of the following values: GK, DF, MF, FW"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

A missing player:

```json
{ "message": "Player 999 not found", "error": "Not Found", "statusCode": 404 }
```

## Running the service

| Command              | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `npm run start:dev`  | Run with auto-restart on file changes          |
| `npm run start`      | Run once, no watch                             |
| `npm run build`      | Compile to `dist/`                             |
| `npm run start:prod` | Run the compiled build (`npm run build` first) |

Stop the service with `Ctrl+C`.

## Configuration

All settings are environment variables, loaded with [`@nestjs/config`](https://docs.nestjs.com/techniques/configuration) and validated at startup (`src/config/env.validation.ts`). If a required variable is missing or invalid, the app refuses to start and names the variable.

| Variable      | Required | Default | Purpose           |
| ------------- | -------- | ------- | ----------------- |
| `PORT`        | no       | `8082`  | HTTP port         |
| `DB_HOST`     | yes      |         | Postgres host     |
| `DB_PORT`     | no       | `5432`  | Postgres port     |
| `DB_NAME`     | yes      |         | Database name     |
| `DB_USER`     | yes      |         | Database user     |
| `DB_PASSWORD` | yes      |         | Database password |

**Local development:** copy `.env.example` to `.env`. Its values match `docker-compose.yml`. `.env` is gitignored, and anything set in the real environment overrides it.

**Deployed environments:** don't ship a `.env` file. Have the platform inject the variables (for example a Kubernetes ConfigMap/Secret, or App Service settings), with `DB_PASSWORD` coming from a secret store. Every environment runs the same build; only the variables change.

Database settings are grouped into a typed `database` namespace (`src/config/database.config.ts`), which `app.module.ts` injects into TypeORM.

## Database

`docker-compose.yml` runs Postgres 17 in a container named `nestjs-playground-postgres`, exposed on host port **5433** (5432 is left free for other local Postgres instances). Data is kept in the `postgres-data` volume between restarts.

On first start, Postgres runs the scripts in `db/init/` in order:

- `01-schema.sql` creates the `player` table (a Postgres port of `springbootplay`'s `V1__initial_schema.sql`)
- `02-seed-players.sql` inserts the 50 base players (copied from `springbootplay`'s `V2__seed_world_cup_players.sql`)

These scripts only run when the data volume is empty. To re-run them after editing, or to get back to a clean dataset:

```bash
docker compose down -v   # deletes the volume and all data
docker compose up -d
```

Other useful commands:

```bash
docker compose ps        # check status / health
docker compose down      # stop (keeps data)
docker compose logs -f   # follow database logs

# open a psql shell
docker exec -it nestjs-playground-postgres psql -U appuser -d players
```

TypeORM's `synchronize` is off: the SQL scripts in `db/init/` own the schema.

## Container image and Kubernetes

The `Dockerfile` is a multi-stage build that produces a small `node:22-alpine` image. It contains only `dist/` and production dependencies, runs as the non-root `node` user and listens on 8082.

```bash
docker build -t nestjs-playground:latest .

# Run it against the local compose database
docker run --rm -p 8082:8082 \
  -e DB_HOST=host.docker.internal -e DB_PORT=5433 -e DB_NAME=players \
  -e DB_USER=appuser -e DB_PASSWORD=mypassword \
  nestjs-playground:latest
```

`k8s/` holds a Deployment (2 replicas, hardened security context), a Service (port 80 → 8082) and a ConfigMap for the non-secret settings. The Secret isn't part of the kustomization, so create it separately:

```bash
kubectl create secret generic nestjs-playground-db \
  --from-literal=DB_USER=appuser --from-literal=DB_PASSWORD='<password>'

kubectl apply -k k8s
kubectl port-forward svc/nestjs-playground 8082:80
```

The readiness probe uses `/health/ready`, which returns 503 if the database doesn't answer a ping within 1.5 s. When that happens, Kubernetes stops sending traffic to the pod. The liveness probe uses `/status`, which doesn't touch the database, so a database outage doesn't restart the pods.

Before you deploy, set the `image:` in `k8s/deployment.yaml` to an image you've pushed to a registry, and set `DB_HOST` in `k8s/configmap.yaml` to your Postgres host. The `db/init` scripts aren't in the image, so run them against the target database separately.

## Tests

```bash
npm test             # unit tests (no database needed)
npm run test:e2e     # end-to-end tests against the real database
npm run test:cov     # unit tests with coverage
npm run lint         # oxlint
npm run format       # prettier
```

The unit tests mock the database. They cover the controllers, the players service (filter, sort and pagination logic, 404 handling), the DTO validation rules, and the generated Swagger document (`src/swagger.spec.ts`, which fails if an endpoint or field is missing from the docs).

The e2e tests boot the whole application against the seeded Postgres, so run `docker compose up -d` first. They cover filtering, validation errors, the full create → update → delete cycle, and the `/api` and `/api-json` docs. The write tests delete the player they create, so the seed data stays intact.

## Project structure

```
db/init/              SQL run by Postgres on first start (schema + seed data)
src/
  main.ts             Bootstrap; listens on PORT (default 8082)
  swagger.ts          OpenAPI document and Swagger UI setup (/api)
  app.module.ts       Root module: config loading and TypeORM connection
  config/             Env var validation schema and typed config namespaces
  app.controller.ts   GET /status
  app.service.ts
  health/             GET /health/ready: Terminus DB readiness check
  players/            /players CRUD: entity, DTOs (validation), service, controller
test/                 End-to-end tests
k8s/                  Kubernetes manifests (kustomize)
Dockerfile            Production container image
docker-compose.yml    Local Postgres
.env.example          Template for local .env
```

## Troubleshooting

- **`npm install` fails with `Cannot read properties of null (reading 'edgesOut')`**: a bug in npm 10.9.x when resolving Vitest's peer dependencies. Install with a newer npm instead (`npx npm@11 install`), or upgrade npm globally. The Dockerfile also uses npm 11, because npm 10's `npm ci` rejects lockfiles that npm 11 writes.
- **`Bind for 0.0.0.0:5433 failed: port is already allocated`**: something else is using port 5433. Change the host port in `docker-compose.yml` (e.g. `"5434:5432"`) and set `DB_PORT` in `.env` to match.
- **App fails to start with `Config validation error: ... is required`**: there's no `.env` file, or a variable is missing from it. Run `cp .env.example .env`.
- **App fails to start with `ECONNREFUSED`**: the database isn't running. Run `docker compose up -d` and wait until `docker compose ps` shows it as healthy.
- **`/players` returns no players or old data**: the init scripts only run on an empty volume. Reset with `docker compose down -v && docker compose up -d`.
- **e2e tests fail on `total: 50` or the first player**: players you added, edited or deleted by hand (for example through Swagger's "Try it out") are still in the database. Reset it as above.
- **`400` with `property X should not exist`**: the request included a field or query parameter the API doesn't accept. Check the spelling against the tables above or Swagger UI.
