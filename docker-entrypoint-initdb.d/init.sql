CREATE DATABASE summarizer_db;
CREATE USER textsummarizer WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE summarizer_db TO textsummarizer;