FROM node:20-slim

WORKDIR /app

# Install Python and required packages for summarization
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm ci

# Copy Python requirements
COPY pyproject.toml ./
RUN pip3 install torch transformers sentencepiece

# Copy the rest of the application
COPY . .

# Add to your Dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1
# Build the application
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]