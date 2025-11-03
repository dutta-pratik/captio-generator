# Docker Deployment Guide 🐳

Deploy the Caption Generator using Docker Compose for a complete containerized setup.

## 📋 Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)
- At least 8GB RAM
- 10GB+ free disk space (for Ollama models)

---

## 🎯 Docker Compose Deployment

This runs Ollama and the frontend in separate containers.

### Quick Start

```bash
# Start everything (downloads model on first run)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

### First Run Details

**What happens:**
1. Pulls `ollama/ollama` image (~700MB)
2. Starts Ollama service on port 11434
3. Downloads `gemma3:4b` model (~2.5GB) - takes 5-10 minutes
4. Builds frontend (~50MB)
5. Starts frontend on port 8080

**Access the app:** http://localhost:8080

### Useful Commands

```bash
# Rebuild just the frontend after code changes
docker-compose up -d --build frontend

# View Ollama logs
docker-compose logs ollama

# Restart a specific service
docker-compose restart frontend

# Remove everything including volumes (model data)
docker-compose down -v

# Pull model updates
docker-compose exec ollama ollama pull gemma3:4b
```

### Resource Usage

- **Frontend**: ~50MB image, ~30MB RAM
- **Ollama**: ~700MB image, ~3GB+ model, 2-4GB RAM (more with GPU)
- **Total**: ~4-5GB disk space

---

## 🔧 How It Works: Ollama Serve

### Automatic Server Startup

You might notice we don't explicitly run `ollama serve` in the docker-compose.yml. **It runs automatically!**

### The Ollama Docker Image

The official `ollama/ollama` image has a built-in ENTRYPOINT and CMD:

```dockerfile
# Inside ollama/ollama image
ENTRYPOINT ["/bin/ollama"]
CMD ["serve"]
```

**What this means:**
```yaml
services:
  ollama:
    image: ollama/ollama:latest
    # Automatically runs: /bin/ollama serve
```

### Verification

Check what's actually running:

```bash
# Start Ollama
docker-compose up -d ollama

# Check the process
docker-compose exec ollama ps aux

# Output:
# USER  PID  COMMAND
# root    1  /bin/ollama serve
```

See? `ollama serve` is running as PID 1!

### How Docker Combines ENTRYPOINT + CMD

```
1. Docker Compose starts container
   ↓
2. Docker reads image metadata:
   - ENTRYPOINT: ["/bin/ollama"]
   - CMD: ["serve"]
   ↓
3. Final command: /bin/ollama serve
   ↓
4. Ollama server starts
   ↓
5. Listens on 0.0.0.0:11434
```

### Testing the Server

```bash
# Check if Ollama is serving
curl http://localhost:11434/api/tags

# Should return JSON with model list
```

### Overriding the Default (Advanced)

If you wanted to run a different command:

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    command: list  # Runs: ollama list (then exits)
```

### Why We Override in ollama-init

```yaml
ollama-init:
  image: ollama/ollama:latest
  entrypoint: /bin/sh  # Override ENTRYPOINT
  command: >
    -c "ollama pull gemma3:4b"
```

**Why?**
- Default would run `ollama serve` (wrong!)
- We want to run `ollama pull` instead
- So we override both ENTRYPOINT and CMD

**Process:**
```
Default:  /bin/ollama serve  (server keeps running)
Override: /bin/sh -c "ollama pull..." (downloads then exits)
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```env
# Ollama Configuration
VITE_OLLAMA_URL=http://ollama:11434

# Model Configuration  
OLLAMA_MODEL=gemma3:4b
```

### Change Model

Edit `docker-compose.yml`:

```yaml
ollama-init:
  command: >
    -c "
    ollama pull llama3.2-vision:latest;  # Different model
    "
```

Update `src/App.jsx`:
```javascript
model: 'llama3.2-vision:latest',
```

---

## 🚀 Production Deployment

### Build for Production

```bash
# Build optimized images
docker-compose build

# Tag for registry
docker tag caption-generator-frontend username/caption-generator:latest
docker tag ollama/ollama username/caption-ollama:latest

# Push to registry
docker push username/caption-generator:latest
```

### Deploy with persistent data

```yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    volumes:
      - /path/on/host/ollama-data:/root/.ollama  # Persist models
    restart: always

  frontend:
    image: username/caption-generator:latest
    restart: always
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Ollama"

**Check Ollama is running:**
```bash
docker-compose ps
# ollama-service should be "Up"

docker-compose logs ollama
# Should see "Listening on 0.0.0.0:11434"
```

**Test Ollama directly:**
```bash
curl http://localhost:11434/api/tags
# Should return list of models
```

### Issue: "Model not found"

**Check if model downloaded:**
```bash
docker-compose exec ollama ollama list
# Should show gemma3:4b
```

**Manually pull model:**
```bash
docker-compose exec ollama ollama pull gemma3:4b
```

### Issue: "Out of memory"

**Ollama needs RAM:**
- Minimum: 4GB RAM available
- Recommended: 8GB+ RAM

**Adjust Docker resources:**
- Docker Desktop → Settings → Resources
- Increase Memory to 8GB+

### Issue: "Frontend can't reach Ollama"

**Check network:**
```bash
docker-compose exec frontend ping ollama
# Should respond
```

**Check environment variable:**
```bash
docker-compose exec frontend env | grep OLLAMA
# Should show: VITE_OLLAMA_URL=http://ollama:11434
```

### Issue: Build fails or is very slow

**Use buildkit for faster builds:**
```bash
DOCKER_BUILDKIT=1 docker-compose build
```

**Clear cache and rebuild:**
```bash
docker-compose build --no-cache
```

---

## 📊 Architecture

### Docker Compose Setup

```
┌─────────────────┐
│  User Browser   │
│ localhost:8080  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Frontend       │
│  (Nginx)        │
│  Port: 80       │
└────────┬────────┘
         │
         ↓ HTTP
┌─────────────────┐
│  Ollama         │
│  Port: 11434    │
│  gemma3:4b      │
└─────────────────┘
         ↓
┌─────────────────┐
│  Volume         │
│  ollama-data    │
│  (Models)       │
└─────────────────┘
```

---

## 🎯 Best Practices

### 1. Use volumes for model data
```yaml
volumes:
  - ollama-data:/root/.ollama  # Persists between restarts
```

### 2. Set resource limits
```yaml
services:
  ollama:
    deploy:
      resources:
        limits:
          memory: 8G
```

### 3. Health checks
```yaml
services:
  ollama:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 4. Use .dockerignore
Already included - keeps build context small.

### 5. Multi-stage builds
Already implemented - keeps images small.

---

## 🔒 Security Notes

- Ollama doesn't require authentication by default
- Don't expose port 11434 to the internet
- Use reverse proxy (nginx) for HTTPS in production
- Consider network isolation

---

## 📈 Scaling

### Multiple Frontend Instances

```yaml
services:
  frontend:
    deploy:
      replicas: 3  # Run 3 frontend containers

  nginx-lb:
    image: nginx:alpine
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
```

### GPU Support

```yaml
services:
  ollama:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

---

## 🧪 Development Workflow

```bash
# Start backend only
docker-compose up -d ollama

# Run frontend locally for hot-reload
npm run dev

# Frontend connects to containerized Ollama
# Edit code → See changes immediately
```

---

## 📚 Learn More

- [Ollama Docker Documentation](https://github.com/ollama/ollama/blob/main/docs/docker.md)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Need help? Check logs:** `docker-compose logs -f`

