FROM node:26-alpine

LABEL io.modelcontextprotocol.server.name="io.github.DasRed/backrest-mcp"

ENV NODE_ENV=production
ENV BACKREST_MCP_SERVER_HOST=0.0.0.0
ENV BACKREST_MCP_SERVER_PORT=3000

WORKDIR /var/www

COPY ./package.json /var/www/package.json
COPY ./package-lock.json /var/www/package-lock.json

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY ./dist /var/www/dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:' + process.env.BACKREST_MCP_SERVER_PORT + '/healthz').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
