# ScribeAI — Handwriting OCR for Disabilities

AI-powered handwriting recognition designed for accessibility, with advanced preprocessing for impaired handwriting.

## Tech Stack

- **Backend**: Python FastAPI + PyTorch + TrOCR (HuggingFace)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: MongoDB
- **ML Model**: microsoft/trocr-base-handwritten

## GPU Requirements

- NVIDIA GPU with CUDA 11.8+ recommended for real-time inference
- Minimum 4GB VRAM for TrOCR base model
- CPU fallback supported but significantly slower
- For production: NVIDIA T4 or better recommended

## Quick Start

```bash
# Clone and navigate
cd apps/handwriting-ocr

# Copy environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Run with Docker
docker-compose up --build

# Access at http://localhost:3000
```

## Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Features

- Upload handwriting images (drag/drop, file picker, camera)
- Advanced preprocessing: grayscale, denoise, binarize, deskew
- Enhanced mode for impaired handwriting
- Line-by-line OCR with confidence scores
- Text-to-speech output
- Editable extracted text with copy
- Scan history and accuracy trends
- Customizable enhancement settings

## API Endpoints

- `POST /api/ocr/read` — Standard OCR
- `POST /api/ocr/read-enhanced` — Enhanced preprocessing for impaired writing
- `GET /api/ocr/history` — Scan history
- `GET /api/ocr/stats` — Usage statistics
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Sign in
- `GET /api/auth/me` — Current user profile
- `PUT /api/auth/settings` — Update enhancement settings

---

Built by [Humanoid Maker](https://www.humanoidmaker.com)


## Deployment

### Docker Compose (Easiest)

```bash
# Clone the repository
git clone https://github.com/humanoidmaker/handwriting-ocr.git
cd handwriting-ocr

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### PM2 (Production Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Install dependencies
cd backend && pip install -r requirements.txt && cd ..
cd frontend && npm install && cd ..

# Start all services
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs

# Stop all
pm2 stop all

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n handwriting-ocr

# View logs
kubectl logs -f deployment/backend -n handwriting-ocr

# Scale
kubectl scale deployment/backend --replicas=3 -n handwriting-ocr
```

### Manual Setup

**1. Database:**
```bash
# Start MongoDB
mongod --dbpath /data/db
```

**2. Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv/Scripts/activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database URL and secrets


uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**3. Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**4. Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## License

MIT License — Copyright (c) 2026 Humanoid Maker (www.humanoidmaker.com)
