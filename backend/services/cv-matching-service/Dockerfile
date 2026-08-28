FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
COPY model ./model
ENV NODE_ENV=production
EXPOSE 4002
CMD ["npm", "start"]
