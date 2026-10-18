FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
ENV NODE_ENV=production
EXPOSE 3002
CMD ["npm", "start"]
