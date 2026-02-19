FROM node:20-slim

# Install build tools for native modules
RUN apt-get update -y && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json yarn.lock ./
COPY services/graphql/package.json ./services/graphql/
COPY services/app/package.json ./services/app/

# Install all workspace dependencies
RUN yarn install --frozen-lockfile --production=false --ignore-engines --network-timeout 600000

# Copy App service source
COPY services/app/ ./services/app/

# Copy GraphQL public/static files needed by the app (cross-service static file references)
COPY services/graphql/public/ ./services/graphql/public/
COPY services/graphql/static/ ./services/graphql/static/
# Copy GraphQL config files referenced by app components
COPY services/graphql/role-privileges.json ./services/graphql/role-privileges.json

# Ensure required public dirs exist (may be empty initially)
RUN mkdir -p /app/services/graphql/public/cache \
             /app/services/graphql/public/template \
             /app/services/graphql/public/trade_data_file \
             /app/services/graphql/public/unstructured_document

# Create a minimal .env for the Next.js build step (overridden at runtime by docker-compose)
RUN echo "APP_PORT=9100\nGRAPHQL_API_HOST=graphql\nGRAPHQL_API_PORT=9101\nAPP_SECRET=build_placeholder" > .env

# Build Next.js app (needs --openssl-legacy-provider for webpack compatibility)
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN cd services/app && npx next build

WORKDIR /app/services/app

EXPOSE 9100

ENV NODE_OPTIONS=--openssl-legacy-provider
ENV NODE_ENV=production

CMD ["node", "server/index.js"]
