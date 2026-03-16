# Deployment Guide - Resume Analyzer API

## 🚀 Deployment Options

This guide covers multiple deployment scenarios for different environments.

---

## 📋 Table of Contents

1. [Development (Local)](#development-local)
2. [Heroku (Free/Paid)](#heroku-freepaid)
3. [AWS EC2](#aws-ec2)
4. [Docker](#docker)
5. [Production Best Practices](#production-best-practices)

---

## Development (Local)

### Option 1: Direct Python Execution

Perfect for development with hot-reloading:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python main.py
```

Access: `http://localhost:8000/docs`

### Option 2: Using Uvicorn Directly

```bash
uvicorn main:app --reload --port 8000
```

### Option 3: Using Python Module

```bash
python -m uvicorn main:app --reload
```

---

## Heroku (Free/Paid)

### Prerequisites

- Heroku account (free tier available)
- Heroku CLI installed
- Git repository

### Step 1: Create Procfile

```bash
echo "web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app" > Procfile
echo "release: python -m spacy download en_core_web_sm" > Procfile
```

**Procfile content:**
```
release: python -m spacy download en_core_web_sm
web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Step 2: Add Gunicorn to requirements.txt

```bash
echo "gunicorn" >> requirements.txt
```

### Step 3: Create Runtime File

**runtime.txt:**
```
python-3.10.13
```

### Step 4: Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Set environment variables
heroku config:set LOG_LEVEL=INFO

# Deploy
git add Procfile runtime.txt
git commit -m "Add deployment files"
git push heroku main

# Check logs
heroku logs --tail
```

### Access Your App

```
https://your-app-name.herokuapp.com/docs
```

**Cost:** Free tier (limited), $7+/month for production

---

## AWS EC2

### Prerequisites

- AWS account with EC2 access
- SSH key pair created
- Security group allowing ports 80, 443, 22

### Step 1: Launch EC2 Instance

1. **AMI**: Ubuntu 22.04 LTS (free tier eligible)
2. **Instance Type**: t3.small (free tier: t3.micro)
3. **Storage**: 30GB (free tier: 30GB)
4. **Security Group**: Allow SSH (22), HTTP (80), HTTPS (443)

### Step 2: SSH into Instance

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

### Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and tools
sudo apt install -y python3.10 python3-pip python3-venv

# Install system dependencies
sudo apt install -y build-essential libssl-dev libffi-dev

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install Supervisor (for process management)
sudo apt install -y supervisor
```

### Step 4: Clone and Setup Application

```bash
# Clone repository
cd /opt
sudo git clone <your-repo-url> resume-analyzer
sudo chown -R $USER:$USER resume-analyzer
cd resume-analyzer/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Test the app
python main.py
# Press Ctrl+C after confirming it works
```

### Step 5: Configure Supervisor

**Create `/etc/supervisor/conf.d/resume-analyzer.conf`:**

```ini
[program:resume-analyzer]
directory=/opt/resume-analyzer/backend
command=/opt/resume-analyzer/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 127.0.0.1:8000
user=ubuntu
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/resume-analyzer.log
environment=PATH="/opt/resume-analyzer/backend/venv/bin"
```

### Step 6: Configure Nginx

**Edit `/etc/nginx/sites-available/resume-analyzer`:**

```nginx
upstream resume_analyzer {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://resume_analyzer;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 7: Enable and Start Services

```bash
# Enable Nginx site
sudo ln -s /etc/nginx/sites-available/resume-analyzer \
            /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl restart nginx

# Update Supervisor configuration
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start resume-analyzer

# Check status
sudo supervisorctl status
```

### Step 8: SSL Certificate (HTTPS)

Install Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Access Your App

```
https://your-domain.com/docs
```

---

## Docker

### Step 1: Create Dockerfile

```dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 2: Create Docker Compose

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - LOG_LEVEL=INFO
    restart: unless-stopped
    volumes:
      - ./:/app  # Development only
    # Remove volumes for production
```

### Step 3: Build and Run

```bash
# Build image
docker build -t resume-analyzer .

# Run container
docker run -p 8000:8000 resume-analyzer

# Or use Docker Compose
docker-compose up -d

# View logs
docker logs -f <container-id>
```

### Step 4: Push to Docker Registry (Optional)

```bash
# Tag image
docker tag resume-analyzer:latest your-registry/resume-analyzer:latest

# Push to Docker Hub
docker login
docker push your-registry/resume-analyzer:latest
```

---

## Production Best Practices

### 1. Environment Variables

Create `.env` file (don't commit to git):

```bash
LOG_LEVEL=WARNING
ALLOWED_ORIGINS=https://yourdomain.com
MAX_FILE_SIZE_MB=10
```

Load in app:

```python
from dotenv import load_dotenv
import os

load_dotenv()
log_level = os.getenv("LOG_LEVEL", "INFO")
```

### 2. Monitoring & Logging

Install monitoring tools:

```bash
pip install python-json-logger prometheus-client
```

### 3. Database (Optional)

Store analysis results:

```bash
pip install sqlalchemy psycopg2-binary
```

### 4. Caching (Optional)

Add Redis caching:

```bash
pip install redis
```

### 5. Security

```bash
pip install python-dotenv
pip install slowapi  # Rate limiting
```

In main.py:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/analyze")
@limiter.limit("10/minute")
async def analyze_resume(...):
    # Limited to 10 requests per minute per IP
```

### 6. Performance Optimization

```python
# Add response caching
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend

# Cache skill extraction results for 1 hour
@cache(expire=3600)
def extract_skills(text: str):
    ...
```

### 7. Load Balancing

With multiple instances:

```nginx
upstream resume_api {
    server instance1:8000;
    server instance2:8000;
    server instance3:8000;
}

server {
    listen 80;
    location / {
        proxy_pass http://resume_api;
    }
}
```

### 8. Container Orchestration (Kubernetes)

**deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resume-analyzer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: resume-analyzer
  template:
    metadata:
      labels:
        app: resume-analyzer
    spec:
      containers:
      - name: api
        image: your-registry/resume-analyzer:latest
        ports:
        - containerPort: 8000
        env:
        - name: LOG_LEVEL
          value: "INFO"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

Deploy:

```bash
kubectl apply -f deployment.yaml
```

---

## Performance Comparison

| Method | Cost | Ease | Scale | Speed |
|--------|------|------|-------|-------|
| Local | Free | ⭐⭐⭐⭐⭐ | 1 | Instant |
| Heroku | $7+ | ⭐⭐⭐⭐ | 10 | 5-10 min |
| AWS EC2 | $5+ | ⭐⭐⭐ | 100+ | 20-30 min |
| Docker | $10+ | ⭐⭐⭐ | 100+ | 15-20 min |
| Kubernetes | $20+ | ⭐⭐ | 1000+ | 30-60 min |

---

## Monitoring & Maintenance

### Health Check

```bash
curl https://yourdomain.com/health
```

### View Logs

```bash
# Heroku
heroku logs --tail

# AWS EC2
tail -f /var/log/resume-analyzer.log

# Docker
docker logs -f <container>
```

### Restart Service

```bash
# Heroku
heroku restart

# AWS/Supervisor
sudo supervisorctl restart resume-analyzer

# Docker
docker restart <container>
```

---

## Cost Estimate (Monthly)

| Platform | Compute | Storage | Total |
|----------|---------|---------|-------|
| Heroku (free) | Free | Free | $0 |
| Heroku (basic) | $7 | Free | $7 |
| AWS EC2 (t3.small) | $15 | $2 | $17 |
| AWS EC2 (t3.medium) | $30 | $2 | $32 |
| Docker on cloud | $10-20 | $5 | $15-25 |

---

## Quick Decision Tree

```
Production needed?
│
├─ Yes, small budget
│  └─ Use Heroku ($7/month)
│
├─ Yes, medium scale
│  └─ Use AWS EC2 + Nginx ($20/month)
│
├─ Yes, high scale
│  └─ Use Kubernetes ($20+/month)
│
└─ Just testing/learning
   └─ Use local or Docker
```

---

## Troubleshooting Deployment

**App crashes on startup:**
```bash
# Check logs for spaCy model download
heroku logs --tail
# Model needs time to download on first deploy
```

**Out of memory:**
```bash
# Reduce workers
gunicorn -w 2 -k uvicorn.workers.UvicornWorker main:app
```

**Slow requests:**
```bash
# Check if models are loading properly
# First request takes 3-5s (model loading)
# Subsequent requests: 300-500ms
```

---

## Next Steps

1. Choose deployment platform
2. Follow corresponding section above
3. Test with `curl` or Swagger UI
4. Set up monitoring
5. Configure auto-scaling
6. Add database for persistence
7. Set up CI/CD pipeline

---

For more help, check:
- [SETUP_GUIDE.md](SETUP_GUIDE.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [README.md](README.md)
