FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
COPY model ./model
ENV NODE_ENV=production
EXPOSE 4006
CMD ["npm", "start"]
