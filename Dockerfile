FROM node:22-slim

WORKDIR /app

# Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev --no-audit --no-fund

COPY backend/ ./backend/

# Seed do banco
RUN cd backend && node --experimental-sqlite src/db/seed.js

# Frontend (build estático)
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --no-audit --no-fund

COPY frontend/ ./frontend/
RUN cd frontend && npx vite build

# Servir frontend estático via Express
RUN cp -r frontend/dist backend/public

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "--experimental-sqlite", "backend/src/server.js"]
