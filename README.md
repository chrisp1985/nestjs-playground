# nestjs-playground

A small [NestJS](https://nestjs.com) backend web service for experimenting with Nest. It exposes a health-style status endpoint and a read-only player API backed by PostgreSQL, seeded with the same base set of World Cup player data used by the `springbootplay` project.

## Tech stack

- NestJS 12 (TypeScript, ES modules) on the Express platform
- PostgreSQL 17, run locally via Docker Compose
- TypeORM for database access
- Vitest + Supertest for tests, oxlint for linting, Prettier for formatting

## Prerequisites

- Node.js 22 (22.22.3 or later recommended; older 22.x versions work but print engine warnings during install)
- Docker Desktop (or another Docker engine with Compose v2)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the database (first run creates the schema and seeds 50 players)
docker compose up -d

# 3. Start the service in watch mode
npm run start:dev
```

The service listens on **http://localhost:8082**. Check it is up:

```bash
curl http://localhost:8082/status
# UP
```

The service connects to the database on startup, so start Postgres before the app.

## API

| Method | Path       | Description                           | Response          |
| ------ | ---------- | ------------------------------------- | ----------------- |
| GET    | `/status`  | Liveness check                        | `UP` (plain text) |
| GET    | `/players` | All players, ordered by player number | JSON array        |

### `GET /players`

```bash
curl http://localhost:8082/players
```

```json
[
  {
    "playerNo": 1,
    "name": "Harry Kane",
    "age": 32,
    "rating": 9.1,
    "position": "FW"
  },
  {
    "playerNo": 2,
    "name": "Jude Bellingham",
    "age": 22,
    "rating": 9,
    "position": "MF"
  }
]
```

`position` is one of `GK`, `DF`, `MF`, `FW`.

## Running the service

| Command              | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `npm run start:dev`  | Run with auto-restart on file changes          |
| `npm run start`      | Run once, no watch                             |
| `npm run build`      | Compile to `dist/`                             |
| `npm run start:prod` | Run the compiled build (`npm run build` first) |

Stop the service with `Ctrl+C`.

## Configuration

All settings are environment variables. The defaults match the local Docker Compose setup, so nothing needs setting for local development.

| Variable      | Default      | Purpose           |
| ------------- | ------------ | ----------------- |
| `PORT`        | `8082`       | HTTP port         |
| `DB_HOST`     | `localhost`  | Postgres host     |
| `DB_PORT`     | `5433`       | Postgres port     |
| `DB_NAME`     | `players`    | Database name     |
| `DB_USER`     | `appuser`    | Database user     |
| `DB_PASSWORD` | `mypassword` | Database password |

The default credentials are for local development only. Set real values through the environment anywhere else.

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

## Tests

```bash
npm test             # unit tests (no database needed)
npm run test:e2e     # end-to-end tests against the real database
npm run test:cov     # unit tests with coverage
npm run lint         # oxlint
npm run format       # prettier
```

The e2e tests boot the whole application and query the seeded Postgres, so run `docker compose up -d` first.

## Project structure

```
db/init/              SQL run by Postgres on first start (schema + seed data)
src/
  main.ts             Bootstrap; listens on PORT (default 8082)
  app.module.ts       Root module and TypeORM connection config
  app.controller.ts   GET /status
  app.service.ts
  players/            GET /players: entity, service, controller, module
test/                 End-to-end tests
docker-compose.yml    Local Postgres
```

## Troubleshooting

- **`npm install` fails with `Cannot read properties of null (reading 'edgesOut')`**: a bug in npm 10.9.x when resolving Vitest's peer dependencies. Install with a newer npm instead (`npx npm@11 install`), or upgrade npm globally.
- **`Bind for 0.0.0.0:5433 failed: port is already allocated`**: something else is using port 5433. Change the host port in `docker-compose.yml` (e.g. `"5434:5432"`) and set `DB_PORT` to match.
- **App fails to start with `ECONNREFUSED`**: the database isn't running. Run `docker compose up -d` and wait until `docker compose ps` shows it as healthy.
- **`/players` returns an empty array or old data**: the init scripts only run on an empty volume. Reset with `docker compose down -v && docker compose up -d`.
