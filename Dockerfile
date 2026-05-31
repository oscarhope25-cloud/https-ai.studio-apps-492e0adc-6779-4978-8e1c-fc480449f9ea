# Use standard Node.js light runtime
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifest and lock file
COPY package*.json ./

# Install all development and production packages
RUN npm ci

# Copy application code
COPY . .

# Compile Vite client assets and esbuild server Bundle
RUN npm run build

# --- PRODUCTION RUNTIME ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy manifests
COPY package*.json ./

# Install only production dependencies to keep container slim
RUN npm ci --only=production

# Copy compiled bundles from the builder target
COPY --from=builder /app/dist ./dist

# Create uploads storage folder explicitly
RUN mkdir -p uploads && chmod 777 uploads

# Inform runtime port
EXPOSE 3000

# Start compiled server entrypoint
CMD ["npm", "start"]
