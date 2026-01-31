# Build Stage
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies (cache optimized)
COPY package.json package-lock.json ./
# Use --legacy-peer-deps if needed, otherwise just ci or install
RUN npm ci

# Copy source code
COPY . .

# Build the app using VITE env vars passed at build time or runtime
# Note: Vite allows env vars to be baked in at build time OR replaced at runtime if using a special script.
# For simplicity with Coolify, we assume build-time env injection or we rely on standard Vite behavior.
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
