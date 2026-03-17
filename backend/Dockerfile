# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy the rest of the source
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
