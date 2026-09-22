FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/index.html ./index.html
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:3000/ || exit 1
CMD ["npm", "run", "preview"]
