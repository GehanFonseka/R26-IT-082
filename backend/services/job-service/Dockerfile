FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm pkg delete dependencies.lanka-talent-insights && rm -f package-lock.json && npm install --omit=dev
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4004
CMD ["npm", "start"]
