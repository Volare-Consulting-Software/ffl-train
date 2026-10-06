# syntax=docker/dockerfile:1

# Production image for AWS Lambda (container). Next.js runs as its standalone Node server under the
# AWS Lambda Web Adapter, which proxies Lambda invocations to the local HTTP server, so the app needs
# no Lambda-specific handler code. The same image runs anywhere with `docker run -p 3000:3000`.

# ---- dependencies ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall runs `prisma generate`, which needs the schema; generate in the build stage instead.
RUN npm ci --ignore-scripts

# ---- build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:22-bookworm-slim AS runtime
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    AWS_LWA_READINESS_CHECK_PATH=/api/health
WORKDIR /app
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
# Boot only. Schema migrations run in the release workflow (`prisma migrate deploy` against Neon),
# never on a Lambda cold start.
CMD ["node", "server.js"]
