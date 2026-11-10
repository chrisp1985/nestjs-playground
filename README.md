# nestjs-playground

This is a small [NestJS](https://nestjs.com) backend web service for me to experiment with Nest. It exposes health-style status endpoints and a player CRUD API backed by PostgreSQL, with filtering, sorting, pagination, request validation and Swagger docs. The database is seeded with the same base set of World Cup player data used by the `springbootplay` project.

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

| Variable      | Required | Default                 | Purpose                                       |
| ------------- | -------- | ----------------------- | --------------------------------------------- |
| `PORT`        | no       | `8082`                  | HTTP port                                     |
| `DB_HOST`     | yes      |                         | Postgres host                                 |
| `DB_PORT`     | no       | `5432`                  | Postgres port                                 |
| `DB_NAME`     | yes      |                         | Database name                                 |
| `DB_USER`     | yes      |                         | Database user                                 |
| `DB_PASSWORD` | yes      |                         | Database password                             |
| `CORS_ORIGIN` | no       | `http://localhost:5173` | Origin allowed to call the API from a browser |

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

## Deploying to AWS Lightsail

The service runs on a single Lightsail instance in eu-west-2. Docker Compose runs three containers on it: Caddy, the API and Postgres. Terraform in `infra/lightsail/` creates the instance, and `scripts/deploy.sh` is used to put a new version on it.

```
internet :80/:443 -> caddy -> api (127.0.0.1:8082) -> postgres
```

### Why Lightsail

I wanted somewhere cheap and simple to run this. Lightsail gives me one Ubuntu VM with a static IP and a firewall for a fixed monthly price, which is all this project needs. ECS or EKS with RDS would have meant load balancers, clusters and a managed database, all costing extra, for what is a playground app.

It also means the server runs the same Docker Compose setup I use locally, and because it's all in Terraform plus `bootstrap.sh`, I can tear it down and rebuild it whenever I like.

The `k8s/` manifests are still in the repo in case I move it to Kubernetes later.

### Why Caddy

Caddy is the reverse proxy in front of the API. The config in `infra/lightsail/Caddyfile` is just:

```
{$PUBLIC_HOSTNAME} {
    reverse_proxy api:8082
}
```

The main reason for using it is HTTPS. Give Caddy a hostname and it gets a Let's Encrypt certificate, renews it and redirects HTTP to HTTPS on its own. With Nginx I'd have to set up certbot and a renewal job myself.

I don't own a domain for this, so the hostname is the static IP with dashes on the end of `.sslip.io`, e.g. `35-178-124-114.sslip.io`. [sslip.io](https://sslip.io) resolves that back to the IP, which is enough for Let's Encrypt to issue a certificate.

`bootstrap.sh` works out `PUBLIC_HOSTNAME` from the static IP, so the Caddyfile doesn't need changing if the IP changes.

A few other bits:

- The API is only bound to `127.0.0.1:8082`, so everything goes through Caddy. The Lightsail firewall only opens 80, 443 and 22 (SSH from my IP only).
- Certificates are stored in the `caddy-data` volume so a restart doesn't request new ones and run into Let's Encrypt's rate limits.

### How a release works

1. On every push to `main`, CI (`.github/workflows/ci.yml`) lints, tests and builds, then pushes the image to GHCR tagged `latest` and `sha-<commit>`.
2. On the server, `compose.prod.yaml` uses `ghcr.io/chrisp1985/nestjs-playground:sha-${DEPLOY_COMMIT}`. `DEPLOY_COMMIT` is set in `/opt/nestjs-playground/.env.runtime`, so I always know exactly which commit is running rather than relying on `latest`.
3. `deploy.sh` pulls the new image first, switches over, and rolls back if the new version doesn't come up healthy.

Recent changes to the deployment:

- The hostname used to be hard-coded in the root `Caddyfile`. It's now passed in as `PUBLIC_HOSTNAME`, set from the static IP.
- The server pulls the image CI built for that commit instead of building it on the instance, so what runs is what passed CI.
- `deploy.sh` now checks the Compose config and pulls the image before switching, then rolls back to the previous commit if the readiness check fails.

### What you need

- Terraform 1.5 or later
- AWS credentials Terraform can use (`aws configure` or `AWS_PROFILE`) with access to Lightsail
- The GHCR package `ghcr.io/chrisp1985/nestjs-playground` set to public, as the instance doesn't log in to GHCR
- The Lightsail default SSH key for eu-west-2, from the Lightsail console under Account > SSH keys

### Setting up the instance

1. Push to `main` and wait for the CI workflow to pass, including the `publish-image` job. This is the version the instance will start with.

2. Create `infra/lightsail/terraform.tfvars` (it's gitignored):

   ```hcl
   ssh_cidr      = "203.0.113.10/32"                          # your public IP
   deploy_commit = "bfd6872bc47f036c805f7f04418559b9cc6c625f"  # full commit SHA
   ```

   `git rev-parse HEAD` gives you the SHA and `curl https://checkip.amazonaws.com` gives you your IP.

3. Run Terraform:

   ```bash
   cd infra/lightsail
   terraform init
   terraform plan
   terraform apply
   terraform output public_ip
   ```

4. Give it a few minutes. On first boot `bootstrap.sh` installs Docker, downloads the repo at `deploy_commit` into `/opt/nestjs-playground`, generates a random DB password, writes it to `.env.runtime` along with `DEPLOY_COMMIT` and `PUBLIC_HOSTNAME`, then starts the containers. Postgres runs the `db/init/` scripts on its first start, so the players are seeded.

5. Check it's up, using the IP with dashes instead of dots:

   ```bash
   curl https://35-178-124-114.sslip.io/health/ready
   ```

   Swagger is at `https://<hostname>/api`.

The Terraform state is local (and gitignored), so run Terraform from the same machine each time.

### Deploying a new version

This only replaces the API container. Postgres and its data aren't touched.

1. Push to `main` and wait for `publish-image` to pass.
2. Get the full SHA with `git rev-parse origin/main`.
3. SSH on and run the deploy script:

   ```bash
   ssh -i LightsailDefaultKey-eu-west-2.pem ubuntu@<public_ip>
   sudo /opt/nestjs-playground/scripts/deploy.sh <commit-sha>
   ```

What the script does:

1. Checks it's been given a full 40 character SHA and is running as root.
2. Reads the current `DEPLOY_COMMIT` and `PUBLIC_HOSTNAME` from `.env.runtime`.
3. Checks the Compose config and pulls the new image. If the image isn't there yet (e.g. CI is still running) it stops, and the current version carries on running.
4. Updates `DEPLOY_COMMIT` in `.env.runtime` and recreates the `api` container.
5. Hits `https://<PUBLIC_HOSTNAME>/health/ready` for up to about 30 seconds.
6. If that fails, it puts the old `DEPLOY_COMMIT` back, restarts the old image and checks again. It exits with an error either way, and prints `CRITICAL: Rollback failed` if the old version doesn't come back.

To roll back manually, run `deploy.sh` with the last good SHA.

### Gotchas

- `deploy.sh` only changes the image. `compose.prod.yaml`, the Caddyfile, `db/init/` and `deploy.sh` itself stay as they were in the commit the instance was first built from. If those change, copy them onto the server or rebuild the instance.
- Don't change `deploy_commit` in Terraform for normal releases. Lightsail can't update user data in place, so Terraform will destroy and recreate the instance, which wipes the database. The static IP stays the same.
- The Lightsail Caddyfile lets every method through, so `POST`, `PATCH` and `DELETE` work on the public instance. The old root `Caddyfile` blocked these with a 405.
- The root `Caddyfile` and `docker-compose.prod.yml` are from my first manual setup, which built the image on the server. The Terraform setup uses the files in `infra/lightsail/` instead.

Handy commands on the instance:

```bash
cd /opt/nestjs-playground
sudo docker compose --env-file .env.runtime -f compose.prod.yaml ps
sudo docker compose --env-file .env.runtime -f compose.prod.yaml logs -f api
sudo grep DEPLOY_COMMIT .env.runtime        # which commit is live
sudo cat /var/log/nestjs-bootstrap.log      # first boot output
```

`terraform destroy` in `infra/lightsail/` removes the lot.

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
infra/lightsail/      Terraform, bootstrap script, Compose file and Caddyfile for Lightsail
scripts/deploy.sh     Deploys a CI-built image to Lightsail, with rollback
.github/workflows/    CI: lint, test, build, publish image to GHCR
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
