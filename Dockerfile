# Use Node.js LTS Alpine image for smaller size
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the React application with optimizations
RUN npm run build

# Production stage - use nginx to serve static files
FROM nginx:alpine AS production

# Copy built React app to nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration (optional - nginx default config works for most SPAs)
# COPY nginx.conf /etc/nginx/nginx.conf

# Create a simple nginx config for React SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    \
    # Handle client-side routing \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_comp_level 6; \
    gzip_types \
        text/plain \
        text/css \
        text/xml \
        text/javascript \
        application/javascript \
        application/xml+rss \
        application/json \
        image/svg+xml \
        application/x-font-ttf \
        font/opentype; \
    \
    # Cache static assets \
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]