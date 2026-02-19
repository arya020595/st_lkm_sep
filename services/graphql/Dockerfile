FROM node:20-slim

# Install build tools for native modules (bcrypt, etc.)
RUN apt-get update -y && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json yarn.lock ./
COPY services/graphql/package.json ./services/graphql/
COPY services/app/package.json ./services/app/

# Install all workspace dependencies
RUN yarn install --frozen-lockfile --production=false --ignore-engines --network-timeout 600000

# Copy GraphQL service source
COPY services/graphql/ ./services/graphql/

# Create public directories if they don't exist (used at runtime for file uploads)
RUN mkdir -p /app/services/graphql/public/cache \
             /app/services/graphql/public/template \
             /app/services/graphql/public/trade_data_file \
             /app/services/graphql/public/unstructured_document

# Create a minimal .env for startup (overridden by docker-compose environment)
RUN echo "MONGOD_HOST=mongodb\nMONGOD_PORT=27017\nMONGOD_DB=lkm-sep-v2\nGRAPHQL_API_PORT=9101\nGRAPHQL_API_BIND_IP=0.0.0.0" > .env

WORKDIR /app/services/graphql

EXPOSE 9101

ENV NODE_ENV=production

CMD ["node", "index.js"]
