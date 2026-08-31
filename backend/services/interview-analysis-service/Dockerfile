FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev \
	--no-audit \
	--no-fund \
	--fetch-retries=10 \
	--fetch-retry-factor=2 \
	--fetch-retry-mintimeout=20000 \
	--fetch-retry-maxtimeout=120000 \
	--fetch-timeout=300000
COPY src ./src
COPY model ./model
ENV NODE_ENV=production
EXPOSE 4006
CMD ["npm", "start"]
