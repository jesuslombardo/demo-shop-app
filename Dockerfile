# Debian-slim (glibc) so better-sqlite3 can use its prebuilt binary — no compiler needed.
# Alpine (musl) would force a source build and bloat the image with toolchains.
FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

# Install production deps first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

# App source.
COPY . .

EXPOSE 3000
USER node
CMD ["node", "server.js"]
