FROM node:20-alpine

WORKDIR /app

# Enable corepack so the pinned pnpm version is available
RUN corepack enable

# Install dependencies first to leverage Docker layer caching.
# express was added to package.json, leaving pnpm-lock.yaml out of date,
# so we install with --no-frozen-lockfile (tolerant). --ignore-workspace
# avoids pnpm-workspace.yaml referencing non-existent workspace packages.
# Fall back to npm if pnpm fails.
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --no-frozen-lockfile --ignore-workspace \
  || npm install --no-package-lock

# Copy the rest of the source
COPY tsconfig.json ./
COPY src ./src

ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "run", "serve"]
