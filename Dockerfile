FROM node:18-alpine

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package.json first (layer caching — rebuilds only when deps change)
COPY package.json ./

# No npm dependencies, but run install for future-proofing
RUN npm install --omit=dev --ignore-scripts

# Copy app source (excluded: .env, .git — see .dockerignore)
COPY . .

# Switch to non-root user
USER appuser

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]