# LKM SEP v2

## Quick Start (Docker)

### Prerequisites

- Docker & Docker Compose v2+
- Copy `.env.example` to `.env` and fill in required values

```sh
cp .env.example .env
```

### Development (with live-reload)

```sh
# Build and start all services (MongoDB, Redis, GraphQL, App)
make dev-build

# Or without Make:
docker compose -f docker-compose.dev.yml up --build
```

- **App (Next.js):** http://localhost:9100/lkm
- **GraphQL API:** http://localhost:9101/graphql (Playground enabled)
- **MongoDB:** localhost:27017
- **Redis:** localhost:6379

Source code is mounted as volumes — changes to files auto-restart via nodemon.

### Production

```sh
# Build and start in detached mode
make prod-build

# Or without Make:
docker compose up -d --build
```

### Other Commands

```sh
make dev-down       # Stop dev environment
make dev-logs       # Tail dev logs
make prod-down      # Stop production environment
make prod-logs      # Tail production logs
make status         # Show running containers
make clean          # Remove all containers, volumes, and images
make help           # Show all available commands
```

## Local Development (without Docker)

```sh
NodeJS Version: 22x
```

### Environment Variables

```sh
VERSION_PREFIX=

APP_PORT=9100

GRAPHQL_API_HOST=localhost
GRAPHQL_API_PORT=9101
GRAPHQL_API_BIND_IP=0.0.0.0

MONGOD_HOST=localhost
MONGOD_PORT=27017
MONGOD_DB=lkm-sep-v2
MONGOD_USERNAME=
MONGOD_PASSWORD=
MONGOD_AUTH_SOURCE=

S3_ACCESS_CREDENTIAL=
S3_BUCKET_NAME=
S3_REGION_NAME=
```

### Run Services Locally

```sh
yarn install          # Install dependencies
yarn graphql:dev      # Start GraphQL API (dev mode)
yarn app:dev          # Start Next.js app (dev mode)
```
# st_lkm_sep
