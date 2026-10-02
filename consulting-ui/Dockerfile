FROM node:22-slim

WORKDIR /app


# package-lock.json is intentionally not copied here: it was generated on
# Windows, and npm's optional-dependency resolution (npm/cli#4828) can carry
# over the wrong platform binary for native deps like rollup/esbuild when a
# cross-platform lockfile is used with `npm ci`. A lockfile-free install lets
# npm resolve the correct binary for the container's platform.
COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
