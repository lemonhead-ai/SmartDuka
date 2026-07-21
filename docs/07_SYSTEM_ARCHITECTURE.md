# System Architecture

Smart Duka is a connected Next.js web application with a FastAPI backend.

1. The browser starts a live gameplay session through `/api/v1/gameplay`.
2. FastAPI runs the configured Customer and Tutor workflow when agent guidance is needed.
3. The gameplay engine validates transactions, records progress, and returns typed API responses.
4. The frontend renders the updated game state and learner feedback.

The backend uses persistent PostgreSQL for the deployed demo. The service boundary is deliberately small: gameplay routes provide the live experience, while AI services provide contextual guidance. If an agent batch fails, the server logs the precise failure and the gameplay engine continues safely with the available live state.
