# Beef Quality Assessment Backend

FastAPI backend service for the Beef Quality Assessment System. This service provides ML inference for beef quality evaluation using trained PyTorch models.

## Features

- **Freshness Classification**: ReXNet-150 model for Fresh/Spoiled classification
- **Marbling Classification**: ReXNet-150 model for 5-grade marbling assessment
- **Fat Ratio Estimation**: HSV-based computer vision for fat content analysis
- **Meat Quality Score**: Comprehensive 0-100 scoring system
- **Supabase Integration**: Authentication, database, and storage support

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   └── main.py              # FastAPI application entry point
├── config/
│   ├── __init__.py
│   └── settings.py          # Environment configuration
├── tests/
│   └── __init__.py          # Test suite (pytest + Hypothesis)
├── requirements.txt         # Python dependencies
├── pytest.ini              # Pytest configuration
├── .env.example            # Example environment variables
└── README.md               # This file
```

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
.\venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `FRESHNESS_MODEL_PATH`: Path to freshness model .pth file
- `MARBLING_MODEL_PATH`: Path to marbling model .pth file
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service key
- `FRONTEND_URL`: Production frontend URL

### 5. Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Interactive API docs**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc

## Testing

Run all tests:
```bash
pytest
```

Run specific test categories:
```bash
# Unit tests only
pytest -m unit

# Property-based tests only
pytest -m property

# Model tests only
pytest -m model
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

## Dependencies

### Core Framework
- **FastAPI**: Modern web framework for building APIs
- **uvicorn**: ASGI server for FastAPI
- **python-multipart**: For file upload support
- **python-dotenv**: Environment variable management

### Machine Learning
- **torch**: PyTorch deep learning framework
- **timm**: PyTorch Image Models (ReXNet-150)
- **opencv-python**: Computer vision operations
- **rembg**: Background removal for image segmentation
- **numpy**: Numerical computing
- **Pillow**: Image processing

### Database & Auth
- **supabase**: Supabase Python client for auth, database, and storage

### Testing
- **pytest**: Testing framework
- **pytest-asyncio**: Async test support
- **hypothesis**: Property-based testing
- **httpx**: HTTP client for API testing

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FRESHNESS_MODEL_PATH` | Path to freshness .pth model file | Yes |
| `MARBLING_MODEL_PATH` | Path to marbling .pth model file | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `FRONTEND_URL` | Production frontend URL for CORS | Yes |

## Development

### Code Structure

The application follows a modular architecture:
- `app/`: Main application code
- `config/`: Configuration and settings
- `tests/`: Test suite with pytest and Hypothesis

### Adding New Features

1. Create new modules in `app/` directory
2. Add corresponding tests in `tests/` directory
3. Update `app/main.py` to integrate new features
4. Document API endpoints in docstrings

### Running in Production

For production deployment:
1. Use production-grade ASGI server (uvicorn with workers)
2. Set up environment variables securely
3. Configure CORS to allow only production frontend domain
4. Enable HTTPS/SSL
5. Consider GPU availability for model inference

Example production command:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## License

This project is part of the Beef Quality Assessment System.
