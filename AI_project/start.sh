#!/bin/bash
# =============================================================================
# StudyAI - Start Script (Stage 01b: First Agent Done)
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting StudyAI - Final Solution"
echo ""

# Load env
if [ -f "$ROOT_DIR/.env" ]; then
  source "$ROOT_DIR/.env"
  export GOOGLE_API_KEY
  export GOOGLE_CLOUD_PROJECT_ID
  export STUDYAI_BUCKET
else
  echo "WARNING: .env file not found. Make sure to run setup first."
fi

# Start backend
echo "📡 Starting backend on port 8000..."
cd "$SCRIPT_DIR/backend"
source "$ROOT_DIR/.venv/bin/activate"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

sleep 2

# Start frontend
echo "⚛️  Starting frontend on port 3000..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "=============================================="
echo "  ✅ StudyAI is running!"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "=============================================="

# Cleanup on exit
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
