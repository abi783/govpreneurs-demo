# ---- Build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=https://ai.govpreneurs.com
ARG VITE_GHL_APP_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GHL_APP_ID=$VITE_GHL_APP_ID
RUN npm run build --ignore-scripts

# ---- Serve ----
FROM node:22-alpine
RUN npm install -g serve
COPY --from=builder /app/dist /app/dist
EXPOSE 8080
CMD ["serve", "-s", "/app/dist", "-l", "8080"]
