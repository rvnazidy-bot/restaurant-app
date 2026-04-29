FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM node:20-alpine AS backend-runtime

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

COPY backend ./backend
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 5000
ENV NODE_ENV=production

CMD ["node", "backend/src/server.js"]
