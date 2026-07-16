# Smart Duka Backend

This project uses modern Python packaging via `pyproject.toml` instead of a traditional `requirements.txt`. All dependencies are defined there.

## Getting Started

1. **Create and activate a virtual environment:**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. **Install the project in editable mode (with development dependencies):**
   ```powershell
   python -m pip install -e ".[dev]"
   ```

3. **Run the development server:**
   ```powershell
   uvicorn src.main:app --reload
   ```

The health endpoint is available at `http://127.0.0.1:8000/api/v1/health`.
