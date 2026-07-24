FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy all workspace files
COPY . .

# Install dependencies
# (bypass Replit's minimumReleaseAge — that setting only applies inside Replit)
RUN pnpm install --frozen-lockfile --config.minimumReleaseAge=0

# Build the React frontend (BASE_PATH=/ since Railway serves at the root)
RUN BASE_PATH=/ PORT=3000 NODE_ENV=production pnpm --filter @workspace/heritage-credit run build

# Build the Express backend
RUN NODE_ENV=production pnpm --filter @workspace/api-server run build

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Push DB schema then start the server
CMD sh -c "pnpm --filter @workspace/db run push && node --enable-source-maps artifacts/api-server/dist/index.mjs"
