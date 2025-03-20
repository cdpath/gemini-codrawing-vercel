# Stage 1: Dependencies and Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Ensure next.config.js has output: 'standalone' setting 
RUN if [ -f next.config.js ]; then \
      # Check if next.config.js exists but doesn't have 'output: standalone'
      if ! grep -q "output: 'standalone'" next.config.js && ! grep -q 'output: "standalone"' next.config.js; then \
        # If it's a module
        if grep -q "export" next.config.js; then \
          echo "Updating module-type next.config.js with standalone output"; \
          sed -i 's/export default/const nextConfig = /g' next.config.js && \
          echo "nextConfig.output = 'standalone';\nexport default nextConfig;" >> next.config.js; \
        else \
          # If it's CommonJS
          echo "Updating CommonJS next.config.js with standalone output"; \
          sed -i 's/module.exports =/const nextConfig =/g' next.config.js && \
          echo "nextConfig.output = 'standalone';\nmodule.exports = nextConfig;" >> next.config.js; \
        fi; \
      fi; \
    else \
      # Create next.config.js if it doesn't exist
      echo "/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  output: 'standalone'\n};\n\nmodule.exports = nextConfig;" > next.config.js; \
    fi

# Set environment variables from app.yaml
# ENV GEMINI_API_KEY="AIzaSyBZqvjHhfLn_XzGYkNCWRA0PNQ6r2CUy_Y"
# ENV GCP_CLIENT_EMAIL="trudyp@google.com"
# API keys will be provided by users through the UI

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner
WORKDIR /app

# Set to production environment
ENV NODE_ENV production

# Create a non-root user to run the app and own app files
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set environment variables from app.yaml
# ENV GEMINI_API_KEY="AIzaSyBZqvjHhfLn_XzGYkNCWRA0PNQ6r2CUy_Y"
# ENV GCP_CLIENT_EMAIL="trudyp@google.com"

# Switch to non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Set the command to start the app
CMD ["node", "server.js"] 