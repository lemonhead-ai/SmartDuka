# Smart Duka

An offline-first, GLM 5.2-powered learning game where Kenyan children practise maths through running a virtual duka.

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

The backend powers three concise GLM 5.2 agents through the configurable Featherless provider.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   python -m pip install -e ".[dev]"
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn src.main:app --reload
   ```
5. The API will be available at [http://localhost:8000](http://localhost:8000). OpenAPI docs are at `/docs`.

## Demo flow

Open the frontend while online once to cache five generated scenarios. Turn off the network, complete an offline scenario, then reconnect: the event uploads and the cache refills. If an AI call fails, the API returns a clear error and logs the failing agent response for diagnosis.

## GLM 5.2 and Codex

Codex was used to build and refine the offline sync architecture, API contracts, tests, and PWA shell. GLM 5.2 powers the three concurrent sync agents: Customer creates five local shop scenarios, Tutor contributes contextual guidance, and Mission creates the session narrative. Agent output is schema-validated; invalid output is logged and rejected so the agent issue can be corrected rather than hidden.

### 3. Docker (Optional)

To run the frontend and SQLite-backed FastAPI demo via Docker Compose:

```bash
docker-compose up --build
```
