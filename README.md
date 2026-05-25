# Bunpou Practice

Basic app scaffold for a Japanese grammar practice project.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite app runs at `http://localhost:5173`.
