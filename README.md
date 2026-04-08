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
