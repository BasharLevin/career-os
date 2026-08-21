FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json turbo.json tsconfig.base.json eslint.config.mjs ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/observability/package.json packages/observability/package.json
RUN npm ci
COPY apps/api apps/api
COPY packages packages
RUN npx turbo run build --filter=@career-os/api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/packages ./packages
RUN mkdir -p /var/lib/career-os/cv && chown node:node /var/lib/career-os/cv
USER node
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
