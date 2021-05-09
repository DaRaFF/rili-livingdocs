FROM livingdocs/node:16

COPY package*.json /app/
RUN npm ci && npm cache clean -f
COPY ./ /app

EXPOSE 8080
CMD ["node", "index.js"]