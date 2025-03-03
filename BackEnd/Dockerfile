# BackEnd/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create uploads directory
RUN mkdir -p uploads

# The actual application code will be mounted as a volume
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]