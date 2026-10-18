FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev \
    --no-audit \
    --no-fund \
    --fetch-retries=5 \
    --fetch-timeout=120000
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4012
CMD ["npm", "start"]
