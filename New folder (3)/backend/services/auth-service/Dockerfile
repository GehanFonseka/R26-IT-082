FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev \
    --no-audit \
    --no-fund \
    --fetch-retries=5 \
    --fetch-timeout=120000
COPY src ./src
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
