FROM node:20-alpine

# Install FFmpeg, Chromaprint (fpcalc), and yt-dlp (requires python3)
RUN apk add --no-cache ffmpeg chromaprint python3 yt-dlp

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./

# Copy packages
COPY packages/ ./packages/

# Copy apps
# Copy all apps to ensure pnpm workspace consistency
COPY apps/ ./apps/

# Install dependencies (frozen-lockfile ensures reproducibility)
RUN pnpm install --frozen-lockfile

# Working directory for music-api
WORKDIR /app/apps/music-api

EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
