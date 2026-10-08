# 🥩 MeatScan AI — Beef Quality Assessment System

> **Automated Cross-Sectional Beef Quality Evaluation Powered by Deep Learning & Computer Vision**  
> Evaluates meat **Freshness**, **Marbling Grain**, and **Visible Fat Ratio** to generate standardized **Meat Quality Scores (MQS)** in milliseconds.

---

## 📌 Table of Contents
- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide (First-Time Setup)](#-quick-start-guide-first-time-setup)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup (FastAPI + PyTorch)](#2-backend-setup-fastapi--pytorch)
  - [3. Frontend Setup (Next.js 14 + Tailwind)](#3-frontend-setup-nextjs-14--tailwind)
- [Scoring Methodologies](#-scoring-methodologies)
  - [Standard MQS (Unified 100-Point Scale)](#1-standard-mqs-unified-100-point-scale)
  - [Split Scoring Mode (Dual-Track Safety & Palatability)](#2-split-scoring-mode-dual-track-safety--palatability)
- [Project Structure](#-project-structure)
- [Running Automated Tests](#-running-automated-tests)
- [Troubleshooting & Windows Tips](#-troubleshooting--windows-tips)

---

## 🌟 Overview

MeatScan AI is a full-stack production application built for automated beef cut assessment:
- **Binary Freshness Classification:** Uses a fine-tuned **ReXNet-150** convolutional neural network to classify meat as **Fresh** or **Spoiled** with calibrated confidence percentages.
- **5-Grade Marbling Analysis:** Uses a fine-tuned **ReXNet-150** model to classify intramuscular lipid marbling into 5 USDA tiers (`small`, `slight`, `modest`, `moderate`, `slightly_abundant`).
- **Computer Vision Fat Ratio Estimation:** Uses `rembg` background segmentation + morphological kernel filtering + calibrated HSV thresholding (`[0,0,120]` to `[180,120,255]`) to calculate visible surface fat ratio.
- **Local Persistence Layer:** Automatically persists every assessment and uploaded image to a local SQLite database (`backend/data/assessments.db`) and static storage (`backend/static/uploads/`) with optional cloud sync.
- **Two Scoring View Modes:** Switch between traditional unified MQS or a split scoring view separating food safety from eating quality.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 14 Frontend                       │
│  (Camera Capture, File Upload, Results, History, Dashboard) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / Multipart Upload
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│  ┌───────────────────────────┬───────────────────────────┐  │
│  │   Freshness ReXNet-150    │    Marbling ReXNet-150    │  │
│  │   Binary Classification   │     5-Grade Grading       │  │
│  └───────────────────────────┴───────────────────────────┘  │
│  ┌───────────────────────────┬───────────────────────────┐  │
│  │   HSV + rembg Segmentation│  Meat Quality Score (MQS) │  │
│  │   Visible Fat Ratio %     │  Safety Capped Engine     │  │
│  └───────────────────────────┴───────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   Local SQLite Database & Static Image Storage        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Prerequisites

Ensure you have the following installed on your machine:
- **Python:** 3.10 or higher ([Download Python](https://www.python.org/downloads/)) — *Tested on Python 3.10–3.14*
- **Node.js:** v18.0 or higher ([Download Node.js](https://nodejs.org/)) — *Recommended Node.js 20 or 22 LTS*
- **Git:** ([Download Git](https://git-scm.com/))

---

## 🚀 Quick Start Guide (First-Time Setup)

### 1. Clone Repository
```bash
git clone https://github.com/<your-username>/BEEF.git
cd BEEF
```

---

### 2. Backend Setup (FastAPI + PyTorch)

1. Open a terminal and navigate to the `backend` folder:
   ```powershell
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     py -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt):**
     ```cmd
     python -m venv venv
     venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your local environment file:
   - Copy `.env.example` to `.env`:
     ```powershell
     # Windows PowerShell
     Copy-Item .env.example .env

     # Linux / macOS
     cp .env.example .env
     ```
   *(The default `.env` is already configured for local SQLite offline mode. No API keys are required.)*

5. Start the backend server:
   ```bash
   py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - Backend API will be live at: [http://localhost:8000](http://localhost:8000)
   - Interactive Swagger API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Health check: [http://localhost:8000/health](http://localhost:8000/health)

---

### 3. Frontend Setup (Next.js 14 + Tailwind)

1. Open a **new separate terminal** and navigate to the `frontend` folder:
   ```powershell
   cd frontend
   ```

2. Create your frontend environment file:
   - Copy `.env.local.example` to `.env.local`:
     ```powershell
     # Windows PowerShell
     Copy-Item .env.local.example .env.local

     # Linux / macOS
     cp .env.local.example .env.local
     ```

3. Install Node.js packages:
   ```powershell
   npm install
   # (If on Windows PowerShell hits script policy, use: npm.cmd install)
   ```

4. Launch the frontend development server:
   ```powershell
   npm run dev
   # (Or: npm.cmd run dev)
   ```

5. Open your browser and navigate to:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📊 Scoring Methodologies

The application features a built-in tab switcher allowing users to inspect cuts using two distinct methodologies:

### 1. Standard MQS (Unified 100-Point Scale)
Combines all three diagnostic metrics into a single unified score:
$$\text{MQS} = \text{Freshness Points (50)} + \text{Marbling Points (10--30)} + \min(\text{Fat Ratio \%}, 20)$$

| Metric | Max Weight | Criteria |
|---|---|---|
| **Freshness** | 50.0 pts | Fresh = 50.0 pts, Spoiled = 0.0 pts *(Spoiled meat is safety-capped at max 50 MQS)* |
| **Marbling** | 30.0 pts | small = 10, slight = 15, modest = 20, moderate = 25, slightly_abundant = 30 |
| **Visible Fat** | 20.0 pts | Direct % visible fat, capped at 20.0 points |

- **Prime / Premium:** MQS $\ge 76.0$
- **Commercial / Standard:** MQS $51.0 - 75.9$
- **Low / Spoiled:** MQS $\le 50.0$

---

### 2. Split Scoring Mode (Dual-Track Safety & Palatability)
Separates microbiological food safety from culinary lipid palatability:

1. **Freshness & Safety Index (Standalone Score — 50.0 pts max):**
   - **Fresh:** `50.0 / 50.0 pts` (Safe for consumption, displays model confidence).
   - **Spoiled:** `0.0 / 50.0 pts` (Unsafe, warning issued to discard cut).
2. **Marbling + Fat Palatability Score (Combined Score — 50.0 pts max):**
   - Combines **Marbling Grade** (up to 30 pts) and **Visible Fat Ratio** (up to 20 pts).
   - Evaluates eating quality, tenderness, and lipid distribution:
     - **Prime High-Marbled Cut:** $\ge 42.0$ pts
     - **Choice Well-Marbled Cut:** $32.0 - 41.9$ pts
     - **Select Moderate-Marbled Cut:** $22.0 - 31.9$ pts
     - **Standard Lean Balance:** $< 22.0$ pts

---

## 📁 Project Structure

```
BEEF/
├── rexnet150_freshness_best.pth   # Trained ReXNet-150 Freshness model weights (31.6MB)
├── rexnet150_marbling_best.pth    # Trained ReXNet-150 Marbling model weights (31.6MB)
├── README.md                      # Project setup & usage guide
├── .gitignore                     # Git ignore rules for node_modules, caches, and DBs
│
├── backend/                       # FastAPI Python Backend
│   ├── app/
│   │   ├── cv/                    # Computer vision & HSV fat estimation
│   │   │   └── fat_estimator.py   # rembg background removal + morphological filtering
│   │   ├── inference/             # Model inference pipelines
│   │   │   └── predictor.py       # Freshness & Marbling ReXNet-150 predictors
│   │   ├── models/                # PyTorch / timm model loader
│   │   │   └── loader.py          # ModelManager singleton & CUDA/CPU selector
│   │   ├── preprocessing/         # ImageNet tensor transforms & PIL processing
│   │   ├── routes/                # FastAPI endpoint handlers
│   │   │   └── predict.py         # POST /predict, GET /assessments, GET /health
│   │   ├── scoring/               # MQS calculation & mapping functions
│   │   │   └── mappers.py         # MQS scoring logic & spoiled capping constraint
│   │   ├── services/              # Persistence & database integrations
│   │   │   ├── local_db.py        # Local SQLite database & image storage service
│   │   │   └── supabase_service.py# Supabase cloud adapter with offline fallbacks
│   │   └── main.py                # FastAPI entry point, CORS, static mounts
│   ├── data/                      # Local SQLite database storage (assessments.db)
│   ├── static/uploads/            # Saved beef evaluation images
│   ├── tests/                     # 53 pytest unit, integration & property tests
│   ├── requirements.txt           # Python dependency specifications
│   └── .env.example               # Backend environment template
│
├── frontend/                      # Next.js 14 TypeScript Frontend
│   ├── app/                       # App Router pages
│   │   ├── page.tsx               # Landing page & feature showcase
│   │   ├── assess/page.tsx        # Live beef quality assessment page
│   │   ├── dashboard/page.tsx     # Quality analytics & distribution charts
│   │   ├── history/page.tsx       # Evaluation history table
│   │   └── history/[id]/page.tsx  # Individual evaluation breakdown & tabs
│   ├── components/                # UI and Feature Components
│   │   ├── ResultsDisplay.tsx     # Dual-mode scoring tabs & metric visualization
│   │   ├── ImageUploadWidget.tsx  # Drag-and-drop file uploader
│   │   ├── CameraCaptureWidget.tsx# Device camera preview & snapshot tool
│   │   ├── HistoryTable.tsx       # Searchable & sortable records table
│   │   ├── AnalyticsCards.tsx     # KPI summary cards
│   │   ├── DistributionCharts.tsx # Visual breakdown charts
│   │   └── Navbar.tsx             # Responsive global navigation
│   ├── lib/                       # Utility & API clients
│   │   ├── api.ts                 # FastAPI client with exponential backoff retry
│   │   └── queries.ts             # Local database & Supabase data fetching
│   ├── types/index.ts             # TypeScript interface schemas
│   ├── package.json               # Frontend package dependencies
│   └── .env.local.example         # Frontend environment template
│
└── supabase/
    └── migrations/                # Optional PostgreSQL schema & storage migration
```

---

## 🧪 Running Automated Tests

Both frontend and backend include automated test suites.

### Backend Tests (pytest + Hypothesis Property-Based Testing)
```powershell
cd backend
py -m pytest -v
```
- **53 passed tests** covering:
  - Model loading and CPU/GPU device selection
  - ReXNet-150 freshness and marbling classification
  - HSV computer vision background removal and fat estimation
  - Hypothesis property testing (100–200 iterations for MQS boundaries and spoiled safety caps)
  - `POST /predict`, `GET /health`, `GET /assessments` API endpoints

### Frontend Tests (Vitest)
```powershell
cd frontend
npm.cmd run test
```
- **14 passed tests** verifying components, state management, and API clients.

---

## 💡 Troubleshooting & Windows Tips

### 1. `npm : File ... cannot be loaded because running scripts is disabled`
In Windows PowerShell, `.ps1` script execution may be blocked by default. You can either:
- Run commands with `.cmd`: `npm.cmd install` and `npm.cmd run dev`
- Or allow scripts in your terminal:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### 2. `npm : The term 'npm' is not recognized`
If you recently installed Node.js while your terminal was open, reload your `PATH`:
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### 3. Port already in use (Port 8000 or 3000)
- **Change backend port:**
  ```bash
  py -m uvicorn app.main:app --port 8001
  # (Remember to update NEXT_PUBLIC_API_URL=http://localhost:8001 in frontend/.env.local)
  ```
- **Change frontend port:**
  ```bash
  npm.cmd run dev -- -p 3001
  ```

### 4. GPU Acceleration
If you have an NVIDIA GPU with CUDA installed, PyTorch will automatically detect and run ReXNet-150 inference on CUDA. If not, it will seamlessly fall back to CPU inference with identical numerical accuracy.

---

## 👥 Contributors & Group Work
This repository is configured for pair-programming and collaborative development. All weights, local database drivers, and static file handlers work out-of-the-box on clean clones!
