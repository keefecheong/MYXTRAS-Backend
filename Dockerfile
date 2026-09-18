FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install only runtime dependencies first so this layer can be reused when
# application source files change.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

EXPOSE 3124

# Keep the Node process in the foreground so Docker can supervise it directly.
CMD ["node", "server.js"]
