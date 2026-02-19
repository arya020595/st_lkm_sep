# LKM-SEP v2

**Lembaga Koko Malaysia — Sistem Ekonomi & Perdagangan (SEP) v2**

A full-stack web application for the Malaysian Cocoa Board (LKM) to manage cocoa industry data including domestic/global statistics, trade data, estate/smallholder census, pricing, and more.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started with Docker](#getting-started-with-docker)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
  - [Step 3: Run in Development Mode](#step-3-run-in-development-mode)
  - [Step 4: Run in Production Mode](#step-4-run-in-production-mode)
- [Accessing the Application](#accessing-the-application)
- [Default Login Credentials](#default-login-credentials)
- [Docker Services Explained](#docker-services-explained)
- [Make Commands Reference](#make-commands-reference)
- [Environment Variables Reference](#environment-variables-reference)
- [Development Workflow](#development-workflow)
- [Local Development (Without Docker)](#local-development-without-docker)
- [Database Utilities](#database-utilities)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                           │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │              │    │                  │    │              │  │
│  │   Next.js    │───▶│  GraphQL API     │───▶│   MongoDB    │  │
│  │   Frontend   │    │  (Apollo Server) │    │   (Mongo 7)  │  │
│  │              │    │                  │    │              │  │
│  │  Port: 9100  │    │   Port: 9101     │    │  Port: 27017 │  │
│  │              │    │                  │    │              │  │
│  └──────────────┘    └────────┬─────────┘    └──────────────┘  │
│         │                     │                                 │
│         │                     │              ┌──────────────┐  │
│         │                     └─────────────▶│    Redis      │  │
│         │                                    │   (Cache)     │  │
│         │                                    │  Port: 6379   │  │
│  ┌──────┴───────┐                            └──────────────┘  │
│  │  Express.js  │                                              │
│  │  Server      │      Optional Services:                      │
│  │  (Proxy)     │      ┌────────────┐  ┌────────────────────┐  │
│  │              │      │ ClickHouse │  │  AWS S3 / SES      │  │
│  │  /api ──────▶│      │ (Analytics)│  │  (Storage / Email) │  │
│  │  GraphQL API │      └────────────┘  └────────────────────┘  │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Browser** → Sends requests to **Next.js App** (port `9100`) at `/lkm/*`
2. **Next.js App** → Custom Express server serves SSR pages and proxies `/api` requests to GraphQL
3. **GraphQL API** → Apollo Server (Express) handles all business logic, authentication, and data operations
4. **MongoDB** → Primary database for all collections (Users, Trade Data, Census, Pricing, etc.)
5. **Redis** → Session caching and performance optimization
6. **Authentication** → JWT-based with `APP_SECRET` for session tokens and `TOKENIZE` for login credential encryption

### Data Flow (Login Example)

```
Browser                    Next.js App               GraphQL API            MongoDB
  │                            │                         │                     │
  │  POST /login               │                         │                     │
  │  (employeeId, password)    │                         │                     │
  │───────────────────────────▶│                         │                     │
  │                            │  jwt.sign(credentials,  │                     │
  │                            │          TOKENIZE)      │                     │
  │                            │                         │                     │
  │                            │  mutation: checkEmployeeIdAndPassword         │
  │                            │────────────────────────▶│                     │
  │                            │                         │  jwt.verify(token,  │
  │                            │                         │          TOKENIZE)  │
  │                            │                         │                     │
  │                            │                         │  findOne(Users)     │
  │                            │                         │────────────────────▶│
  │                            │                         │◀────────────────────│
  │                            │                         │                     │
  │                            │  mutation: logInByEmployeeId                  │
  │                            │────────────────────────▶│                     │
  │                            │                         │  createSession()    │
  │                            │                         │  jwt.sign(payload,  │
  │                            │                         │       APP_SECRET)   │
  │                            │                         │                     │
  │                            │                         │  insert(UserSessions)
  │                            │                         │────────────────────▶│
  │                            │◀────────────────────────│                     │
  │                            │                         │                     │
  │  Set cookie: token=...     │                         │                     │
  │◀───────────────────────────│                         │                     │
  │                            │                         │                     │
  │  Redirect to /dashboard    │                         │                     │
  │───────────────────────────▶│                         │                     │
```

---

## Tech Stack

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| **Frontend** | Next.js 14, React 18, Tailwind CSS 2, Apollo Client                     |
| **Backend**  | Node.js 20, Express, Apollo Server, GraphQL                             |
| **Database** | MongoDB 7 (primary), Redis 7 (caching)                                  |
| **Auth**     | JWT (jsonwebtoken), bcryptjs                                            |
| **DevOps**   | Docker, Docker Compose, nodemon (dev)                                   |
| **Optional** | ClickHouse (analytics), AWS S3 (storage), AWS SES (email), Telegram Bot |

---

## Project Structure

```
lkm-sep/
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── .dockerignore                   # Docker build ignore rules
├── docker-compose.yml              # Production Docker setup
├── docker-compose.dev.yml          # Development Docker setup (with live-reload)
├── Makefile                        # Convenience commands
├── package.json                    # Root workspace (Yarn Workspaces + Lerna)
├── lerna.json                      # Lerna monorepo config
├── yarn.lock                       # Dependency lock file
│
└── services/
    ├── app/                        # === FRONTEND (Next.js) ===
    │   ├── Dockerfile              # Docker build for frontend
    │   ├── package.json            # Frontend dependencies
    │   ├── app.json                # App metadata (name, version, basePath)
    │   ├── next.config.js          # Next.js configuration
    │   ├── tailwind.config.js      # Tailwind CSS configuration
    │   ├── server/                 # Custom Express server (proxy + static files)
    │   │   └── index.js            # Entry point: proxies /api → GraphQL
    │   ├── pages/                  # Next.js pages (routes)
    │   │   ├── login.js            # Login page
    │   │   ├── login-by-employee-id.js
    │   │   ├── dashboard.js        # Main dashboard
    │   │   └── ...                 # Other pages
    │   ├── components/             # React components
    │   │   ├── AdminArea.js        # Authenticated layout wrapper
    │   │   ├── Header.js           # Navigation header
    │   │   ├── Sidebar.js          # Side navigation
    │   │   ├── Table.js            # Data table component
    │   │   └── ...                 # Domain-specific components
    │   ├── libs/                   # Utility libraries
    │   │   ├── apollo.js           # Apollo Client setup
    │   │   ├── checkLoggedIn.js    # Auth check helper
    │   │   └── ...
    │   ├── locales/                # i18n translations (en, id)
    │   ├── styles/                 # CSS / Tailwind styles
    │   └── public/                 # Static assets (images, icons)
    │
    └── graphql/                    # === BACKEND (GraphQL API) ===
        ├── Dockerfile              # Docker build for backend
        ├── package.json            # Backend dependencies
        ├── index.js                # Entry point: Express + Apollo Server setup
        ├── authentication.js       # JWT auth, session validation, default users
        ├── mongodb-connection.js   # MongoDB connection handler
        ├── data-loader.js          # DataLoader for N+1 query optimization
        ├── redis.js                # Redis connection
        ├── clickhouse.js           # ClickHouse connection (optional)
        ├── s3.js                   # AWS S3 integration (optional)
        ├── emailer.js              # AWS SES email integration (optional)
        ├── excel.js                # Excel export utilities
        ├── pdf.js                  # PDF generation (pdfmake)
        ├── queue.js                # Bull queue for background jobs
        ├── agenda.js               # Agenda.js scheduled jobs
        ├── role-privileges.json    # Role-based access control definitions
        ├── spectaql-config.yml     # API documentation config
        ├── schema/                 # GraphQL schema modules (~90 domains)
        │   ├── User/               # User management
        │   ├── TradeDataDomestic/  # Domestic trade data
        │   ├── TradeDataGlobal/    # Global trade data
        │   ├── EstateCensus*/      # Estate census modules
        │   ├── Smallholder*/       # Smallholder census modules
        │   ├── DomesticCocoaPrice/ # Domestic pricing
        │   ├── FutureMarket/       # Future market data
        │   └── ...                 # Each module has resolvers.js + types.js
        ├── libs/                   # Shared backend libraries
        ├── utilities/              # Scripts and data utilities
        ├── public/                 # Runtime-generated files (uploads, cache)
        └── static/                 # Static template files
```

### GraphQL Schema (Modular Architecture)

Each module in `services/graphql/schema/` is auto-discovered and contains:

- **`types.js`** — GraphQL type definitions (SDL)
- **`resolvers.js`** — Query, Mutation, and field resolvers

The system dynamically reads all subdirectories in `schema/`, merges types and resolvers, and creates a single unified Apollo Server schema.

---

## Prerequisites

Before starting, ensure you have the following installed:

| Requirement           | Minimum Version | Check Command            |
| --------------------- | --------------- | ------------------------ |
| **Docker**            | 20.10+          | `docker --version`       |
| **Docker Compose**    | v2.0+           | `docker compose version` |
| **Git**               | 2.x             | `git --version`          |
| **Make** _(optional)_ | any             | `make --version`         |

> **Note:** Docker Compose v2 uses `docker compose` (without hyphen). If you have v1, replace with `docker-compose`.

---

## Getting Started with Docker

### Step 1: Clone the Repository

```bash
git clone git@github.com:arya020595/st_lkm_sep.git
cd st_lkm_sep
```

### Step 2: Configure Environment Variables

Copy the example environment file and customize as needed:

```bash
cp .env.example .env
```

**Minimum required `.env` for local Docker setup:**

```env
# Database
MONGOD_DB=lkm-sep-v2

# Auth (REQUIRED — must have values)
APP_SECRET=lkm-sep-v2-secret-key
TOKENIZE=lkm-sep-v2-tokenize-key

# Ports (optional — defaults shown)
APP_PORT=9100
GRAPHQL_API_PORT=9101
MONGOD_PORT=27017
REDIS_PORT=6379
```

> **Important:** `APP_SECRET` and `TOKENIZE` must have non-empty values. Without them, JWT authentication will fail with `"secretOrPrivateKey must have a value"`.

### Step 3: Run in Development Mode

Development mode features:

- Source code mounted as Docker volumes (live-reload)
- `nodemon` watches for file changes and auto-restarts
- `NODE_ENV=development` (GraphQL Playground enabled)
- No image rebuild required for code changes

```bash
# Using Make (recommended)
make dev-build

# Or using Docker Compose directly
docker compose -f docker-compose.dev.yml up --build
```

**What happens behind the scenes:**

1. **MongoDB container** starts and waits until healthy (ping check)
2. **Redis container** starts and waits until healthy (ping check)
3. **GraphQL container** builds, connects to MongoDB/Redis, seeds default data, starts on port `9101`
4. **App container** builds Next.js, starts Express server on port `9100`

Wait for all health checks to pass (~30-60 seconds on first run). You should see:

```
lkm-sep-dev-mongodb  | {"ok":1}
lkm-sep-dev-redis    | * Ready to accept connections
lkm-sep-dev-graphql  | 🚀 Server ready at http://0.0.0.0:9101/graphql
lkm-sep-dev-app      | > Ready on http://localhost:9100/lkm
```

### Step 4: Run in Production Mode

Production mode features:

- Optimized Next.js build (pre-built during Docker image creation)
- `NODE_ENV=production` (Playground disabled, sessions validated)
- Runs in detached mode (`-d`)

```bash
# Using Make (recommended)
make prod-build

# Or using Docker Compose directly
docker compose up -d --build
```

**Verify all containers are running:**

```bash
make status

# Or:
docker compose ps
```

Expected output:

```
NAME              STATUS              PORTS
lkm-sep-mongodb   Up (healthy)        0.0.0.0:27017->27017/tcp
lkm-sep-redis     Up (healthy)        0.0.0.0:6379->6379/tcp
lkm-sep-graphql   Up                  0.0.0.0:9101->9101/tcp
lkm-sep-app       Up                  0.0.0.0:9100->9100/tcp
```

---

## Accessing the Application

| Service                | URL                             | Notes                       |
| ---------------------- | ------------------------------- | --------------------------- |
| **Web Application**    | http://localhost:9100/lkm       | Main application            |
| **Login Page**         | http://localhost:9100/lkm/login | Authentication              |
| **GraphQL Playground** | http://localhost:9101/graphql   | Dev mode only               |
| **MongoDB**            | `localhost:27017`               | Connect via MongoDB Compass |
| **Redis**              | `localhost:6379`                | Connect via redis-cli       |

---

## Default Login Credentials

On first startup, the system seeds a default admin user:

| Field           | Value      |
| --------------- | ---------- |
| **Employee ID** | `root`     |
| **Password**    | `toor`     |
| **Role**        | Super User |

> **Recommendation:** Change the default password after first login in a production environment.

---

## Docker Services Explained

### MongoDB (`lkm-sep-mongodb`)

- **Image:** `mongo:7`
- **Purpose:** Primary database for all application data
- **Data Persistence:** Docker volume `mongodb_data` (production) / `mongodb_dev_data` (development)
- **Health Check:** `mongosh --eval "db.adminCommand('ping')"` every 10s

### Redis (`lkm-sep-redis`)

- **Image:** `redis:7-alpine`
- **Purpose:** Session caching and performance optimization
- **Data Persistence:** Docker volume `redis_data` / `redis_dev_data`
- **Health Check:** `redis-cli ping` every 10s

### GraphQL API (`lkm-sep-graphql`)

- **Build:** `services/graphql/Dockerfile` (Node.js 20 slim)
- **Purpose:** Backend API server with ~90 GraphQL modules
- **Port:** `9101`
- **Dependencies:** MongoDB (healthy), Redis (healthy)
- **Dev Mode:** Source code mounted + nodemon for auto-restart

### App (`lkm-sep-app`)

- **Build:** `services/app/Dockerfile` (Node.js 20 slim + Next.js build)
- **Purpose:** Frontend web application with server-side rendering
- **Port:** `9100`
- **Dependencies:** GraphQL API
- **Dev Mode:** Source code mounted + nodemon watching `server/` directory

### Service Dependency Chain

```
MongoDB ──┐
           ├──▶ GraphQL API ──▶ App (Frontend)
Redis ────┘
```

---

## Make Commands Reference

### Development

| Command            | Description                             |
| ------------------ | --------------------------------------- |
| `make dev`         | Start dev environment (without rebuild) |
| `make dev-build`   | Build & start dev environment           |
| `make dev-down`    | Stop dev environment                    |
| `make dev-logs`    | Tail dev container logs                 |
| `make dev-restart` | Restart dev environment                 |

### Production

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `make prod`         | Start production environment (without rebuild) |
| `make prod-build`   | Build & start production environment           |
| `make prod-down`    | Stop production environment                    |
| `make prod-logs`    | Tail production container logs                 |
| `make prod-restart` | Restart production environment                 |

### Utilities

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `make build-graphql` | Build only the GraphQL Docker image        |
| `make build-app`     | Build only the App Docker image            |
| `make status`        | Show all running containers                |
| `make clean`         | Remove all containers, volumes, and images |
| `make help`          | Show all available commands                |

---

## Environment Variables Reference

### Required

| Variable     | Description                     | Default                   |
| ------------ | ------------------------------- | ------------------------- |
| `APP_SECRET` | JWT secret for session tokens   | `lkm-sep-v2-secret-key`   |
| `TOKENIZE`   | JWT secret for login encryption | `lkm-sep-v2-tokenize-key` |

### Application

| Variable           | Description                    | Default     |
| ------------------ | ------------------------------ | ----------- |
| `APP_PORT`         | Frontend web server port       | `9100`      |
| `GRAPHQL_API_HOST` | GraphQL API hostname           | `localhost` |
| `GRAPHQL_API_PORT` | GraphQL API port               | `9101`      |
| `VERSION_PREFIX`   | Version display prefix         | _(empty)_   |
| `CDN_PREFIX`       | CDN URL prefix for assets      | _(empty)_   |
| `STAGING_ENV`      | Staging environment identifier | _(empty)_   |

### Database

| Variable             | Description                  | Default      |
| -------------------- | ---------------------------- | ------------ |
| `MONGOD_HOST`        | MongoDB host                 | `localhost`  |
| `MONGOD_PORT`        | MongoDB port                 | `27017`      |
| `MONGOD_DB`          | MongoDB database name        | `lkm-sep-v2` |
| `MONGOD_USERNAME`    | MongoDB auth username        | _(empty)_    |
| `MONGOD_PASSWORD`    | MongoDB auth password        | _(empty)_    |
| `MONGOD_AUTH_SOURCE` | MongoDB auth source database | _(empty)_    |

### Redis

| Variable     | Description          | Default     |
| ------------ | -------------------- | ----------- |
| `REDIS_HOST` | Redis host           | `localhost` |
| `REDIS_PORT` | Redis port           | `6379`      |
| `REDIS_AUTH` | Redis password       | _(empty)_   |
| `REDIS_DB`   | Redis database index | `0`         |

### Optional Services

| Variable                  | Description                               |
| ------------------------- | ----------------------------------------- |
| `CLICKHOUSE_URL`          | ClickHouse server URL                     |
| `CLICKHOUSE_PORT`         | ClickHouse port                           |
| `CLICKHOUSE_AUTH`         | ClickHouse authentication                 |
| `CLICKHOUSE_DB`           | ClickHouse database name                  |
| `S3_ACCESS_CREDENTIAL`    | AWS S3 access credential                  |
| `S3_ACCESS_KEY`           | AWS S3 access key                         |
| `S3_SECRET_KEY`           | AWS S3 secret key                         |
| `S3_BUCKET_NAME`          | AWS S3 bucket name                        |
| `S3_REGION_NAME`          | AWS S3 region (default: `ap-southeast-1`) |
| `SES_AWS_DEFAULT_REGION`  | AWS SES region                            |
| `SES_ACCESS_CREDENTIAL`   | AWS SES access credential                 |
| `SES_DEFAULT_SOURCE_NAME` | SES sender display name                   |
| `SES_DEFAULT_SOURCE`      | SES sender email                          |
| `SES_DEFAULT_REPLY`       | SES reply-to email                        |
| `TELEGRAM_BOT_TOKEN`      | Telegram bot token for notifications      |
| `TELEGRAM_CHAT_ID`        | Telegram chat ID for notifications        |
| `DISCORD_WEBHOOK_URL`     | Discord webhook URL for notifications     |
| `SLACK_WEBHOOK_URL`       | Slack webhook URL for notifications       |

---

## Development Workflow

### Live Reload (Dev Mode)

In development mode, source code is mounted as Docker volumes:

**Frontend (App):**

- `pages/`, `components/`, `libs/`, `locales/`, `styles/`, `server/`, `public/`
- nodemon watches `server/` directory for Express server changes
- Next.js hot-reload handles React component changes automatically

**Backend (GraphQL):**

- `schema/`, `libs/`, `utilities/`, and all root `.js` files
- nodemon watches all `.js` and `.json` files for auto-restart

### Making Changes

1. Edit files in your IDE — changes reflect immediately (no rebuild needed)
2. For `package.json` dependency changes, rebuild the container:
   ```bash
   make dev-down
   make dev-build
   ```

### Rebuilding a Single Service

```bash
# Rebuild only GraphQL backend
docker compose -f docker-compose.dev.yml up --build graphql

# Rebuild only frontend
docker compose -f docker-compose.dev.yml up --build app
```

### Viewing Logs

```bash
# All services
make dev-logs

# Specific service
docker compose -f docker-compose.dev.yml logs -f graphql
docker compose -f docker-compose.dev.yml logs -f app
```

### Accessing Container Shell

```bash
# GraphQL container
docker exec -it lkm-sep-dev-graphql sh

# App container
docker exec -it lkm-sep-dev-app sh

# MongoDB shell
docker exec -it lkm-sep-dev-mongodb mongosh lkm-sep-v2
```

---

## Local Development (Without Docker)

### Requirements

- **Node.js:** v20.x
- **Yarn:** v1.x
- **MongoDB:** v7.x (running locally)
- **Redis:** v7.x (running locally)

### Setup

```bash
# 1. Install dependencies
yarn install

# 2. Configure environment
cp .env.example .env
# Edit .env with local MongoDB/Redis connection details

# 3. Start GraphQL API (dev mode with nodemon)
yarn graphql:dev

# 4. In a separate terminal, start Next.js App
yarn app:dev
```

---

## Database Utilities

### Backup

```bash
# Full backup
docker exec -it lkm-sep-graphql node utilities/db-backup.js

# Minimal backup
docker exec -it lkm-sep-graphql node utilities/db-backup.js --minimal
```

### Restore

```bash
docker exec -it lkm-sep-graphql node utilities/db-restore.js
```

### Direct MongoDB Access

```bash
# Connect to MongoDB shell
docker exec -it lkm-sep-mongodb mongosh lkm-sep-v2

# Example queries:
# db.Users.find({}).pretty()
# db.UserSessions.find({}).pretty()
# db.Users.updateOne({ _id: "__ROOT__" }, { $set: { status: "Active" } })
```

---

## API Documentation

Generate interactive API documentation using SpectaQL:

```bash
# Development (live-reload)
docker exec -it lkm-sep-graphql npx spectaql spectaql-config.yml -D

# Build static docs
docker exec -it lkm-sep-graphql npx spectaql spectaql-config.yml
```

Or access GraphQL Playground directly at http://localhost:9101/graphql (development mode only).

---

## Troubleshooting

### "secretOrPrivateKey must have a value"

**Cause:** `TOKENIZE` or `APP_SECRET` environment variable is empty or missing.

**Fix:**

1. Ensure `.env` file has non-empty values for both `APP_SECRET` and `TOKENIZE`
2. Ensure both variables are listed in `docker-compose.yml` environment section
3. Rebuild containers: `make prod-build` or `make dev-build`

### Auto-logout after successful login

**Cause:** JWT signing secret mismatch between token creation and verification.

**Fix:** Ensure `APP_SECRET` is the same value in both the `graphql` and `app` Docker services. Both are configured in `docker-compose.yml`.

### "Unknown employee id root"

**Cause:** Default user was seeded without `employeeId` field.

**Fix:** Update the user in MongoDB:

```bash
docker exec -it lkm-sep-mongodb mongosh lkm-sep-v2 --eval \
  'db.Users.updateOne({ _id: "__ROOT__" }, { $set: { employeeId: "root", status: "Active" } })'
```

### Container won't start / Port already in use

```bash
# Check what's using the port
lsof -i :9100
lsof -i :9101

# Stop all LKM-SEP containers
make clean

# Or force remove
docker compose down -v
docker compose -f docker-compose.dev.yml down -v
```

### MongoDB connection refused

**Cause:** MongoDB container hasn't finished starting or health check hasn't passed.

**Fix:** Wait for the health check to pass (~10-30 seconds). Check logs:

```bash
docker compose logs mongodb
```

### Changes not reflecting in development

**Frontend component changes:** Should auto-reload via Next.js HMR.

**Backend/Server changes:** nodemon should auto-restart. If not:

```bash
docker compose -f docker-compose.dev.yml restart graphql
# or
docker compose -f docker-compose.dev.yml restart app
```

**Dependency changes (`package.json`):** Requires full rebuild:

```bash
make dev-down && make dev-build
```

### Full Reset (Nuclear Option)

```bash
# Remove everything: containers, volumes, images
make clean

# Rebuild from scratch
make dev-build    # or make prod-build
```

---

## License

MIT — ST Advisory © 2021
