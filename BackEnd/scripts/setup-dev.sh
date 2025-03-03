#!/bin/bash

# Create required directories
mkdir -p uploads

# Start the development stack
docker-compose -f docker-compose.dev.yml up -d

# Wait for MongoDB to be ready
echo "Waiting for MongoDB replica set to initialize..."
sleep 10

# Check MongoDB connection
docker-compose -f docker-compose.dev.yml exec mongo1 mongosh --eval "rs.status()"

echo "Development environment is ready!"
echo "API is available at http://localhost:8000"
echo "MongoDB is available at mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0"
echo "Redis is available at localhost:6379"