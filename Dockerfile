FROM node:20-slim

WORKDIR /app

# Install Python and required packages for summarization
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment
RUN python3 -m venv /app/venv

# Activate the virtual environment and install Python dependencies
RUN /app/venv/bin/pip install --upgrade pip
COPY pyproject.toml ./
RUN /app/venv/bin/pip install torch transformers sentencepiece

# Copy package files
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Add to your Dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Build the application
RUN npm run build

EXPOSE 5000

# Set the virtual environment as the default Python
ENV PATH="/app/venv/bin:$PATH"

CMD ["npm", "start"]