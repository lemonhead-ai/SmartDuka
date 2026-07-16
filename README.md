# Smart Duka - Hackathon Build

An offline-first, agentic AI educational game for children in East Africa.

## Prerequisites

Before running the project, make sure you have the following installed:
- **Node.js** (v18+) and **npm**
- **Python** (v3.11+)
- **Docker** and **Docker Compose** (optional, if you want to run the database via Docker)

## How to Run the Project

### 1. Frontend (Next.js App)

The frontend is a responsive web application built with Next.js, Tailwind CSS, and Zustand.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your desktop browser.

*(Alternatively, you can run `npm run dev` from the project root if you have installed dependencies in the frontend first).*

### 2. Backend (Python FastAPI)

The backend powers the GPT-5.6 Sol agents.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn src.main:app --reload
   ```
5. The API will be available at [http://localhost:8000](http://localhost:8000).

### 3. Docker (Optional)

If you prefer to run the entire stack (including PostgreSQL and Redis) via Docker Compose:

```bash
docker-compose up --build
```
