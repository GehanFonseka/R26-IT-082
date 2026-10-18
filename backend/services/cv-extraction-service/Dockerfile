FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev \
    --no-audit \
    --no-fund \
    --fetch-retries=5 \
    --fetch-timeout=120000
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install --with-deps --no-shell chromium
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4001
CMD ["npm", "start"]
