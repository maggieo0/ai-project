#!/bin/bash
# =============================================================================
# StudyAI - Deploy Script (using Cloud Build)
# Builds images on Google's servers and deploys to Cloud Run.
# Usage: cd ai-project && ./deploy.sh
# =============================================================================
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/AI_project"
REGION="us-central1"

# Load .env
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "ERROR: .env not found. Run setup.sh first."
  exit 1
fi
source "$ROOT_DIR/.env"

REGISTRY="$REGION-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT_ID/studyai-repo"

echo "=============================================="
echo "  StudyAI - Deploy to Cloud Run"
echo "  Project: $GOOGLE_CLOUD_PROJECT_ID"
echo "  Registry: $REGISTRY"
echo "=============================================="

# ── Step 1: Build & push backend via Cloud Build ─────────────────────────────
echo ""
echo "🔨 Building backend image via Cloud Build..."
gcloud builds submit $APP_DIR/backend/ \
  --tag=$REGISTRY/studyai-backend:latest \
  --project=$GOOGLE_CLOUD_PROJECT_ID
echo "✅ Backend image built and pushed"

# ── Step 2: Deploy backend to Cloud Run ──────────────────────────────────────
echo ""
echo "🚀 Deploying backend to Cloud Run..."
gcloud run deploy studyai-backend \
  --image=$REGISTRY/studyai-backend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=$GOOGLE_CLOUD_PROJECT_ID,STUDYAI_BUCKET=$STUDYAI_BUCKET" \
  --set-secrets="GOOGLE_API_KEY=studyai-api-key:latest" \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10

BACKEND_URL=$(gcloud run services describe studyai-backend \
  --region=$REGION \
  --format='value(status.url)')
BACKEND_WS="wss://${BACKEND_URL#https://}"
echo "✅ Backend live at: $BACKEND_URL"

# ── Step 3: Build & push frontend via Cloud Build ────────────────────────────
echo ""
echo "🔨 Building frontend image via Cloud Build..."
gcloud builds submit $APP_DIR/frontend/ \
  --tag=$REGISTRY/studyai-frontend:latest \
  --project=$GOOGLE_CLOUD_PROJECT_ID
echo "✅ Frontend image built and pushed"

# ── Step 4: Deploy frontend to Cloud Run ─────────────────────────────────────
echo ""
echo "🚀 Deploying frontend to Cloud Run..."
gcloud run deploy studyai-frontend \
  --image=$REGISTRY/studyai-frontend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_WS_URL=$BACKEND_WS" \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=5

FRONTEND_URL=$(gcloud run services describe studyai-frontend \
  --region=$REGION \
  --format='value(status.url)')

echo ""
echo "=============================================="
echo "  ✅ Deployment Complete!"
echo ""
echo "  🌐 Frontend:  $FRONTEND_URL"
echo "  ⚙️  Backend:   $BACKEND_URL"
echo "=============================================="
