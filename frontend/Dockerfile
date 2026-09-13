FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

ENV VITE_API_BASE_URL=/api

RUN npm run build

FROM nginx:alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Where nginx proxies /api requests to. Resolved via envsubst at container
# start, so the same image works against docker-compose's "backend" service
# or a Kubernetes Service DNS name — override with -e/env in each environment.
ENV BACKEND_UPSTREAM=backend:3000

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
