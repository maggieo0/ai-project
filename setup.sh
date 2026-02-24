#!/bin/bash
# =============================================================================
# StudyAI - Setup Script
# Run this ONCE before deploying to provision all GCP resources.
# Usage: cd Project_DATS && ./setup.sh
# =============================================================================
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=============================================="
echo "  StudyAI - GCP Setup"
echo "=============================================="

# Load and validate .env
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "ERROR: .env not found. Run: cp env.template .env  then fill in your values."
  exit 1
fi
source "$ROOT_DIR/.env"

for var in GOOGLE_API_KEY GOOGLE_CLOUD_PROJECT_ID GITHUB_USERNAME STUDYAI_BUCKET; do
  if [ -z "${!var}" ] || [[ "${!var}" == *"REPLACE"* ]]; then
    echo "ERROR: $var is not set in .env"
    exit 1
  fi
done

echo "✅ Credentials loaded"
echo "   Project: $GOOGLE_CLOUD_PROJECT_ID"
echo ""

# Set GCP project
gcloud config set project $GOOGLE_CLOUD_PROJECT_ID

# Enable APIs
echo "🔌 Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com
echo "✅ APIs enabled"

# Create GCS bucket
echo "🪣 Creating storage bucket..."
if gsutil ls gs://$STUDYAI_BUCKET &>/dev/null; then
  echo "   Bucket already exists"
else
  gsutil mb -p $GOOGLE_CLOUD_PROJECT_ID gs://$STUDYAI_BUCKET
  echo "✅ Bucket created: gs://$STUDYAI_BUCKET"
fi

# Store API key in Secret Manager
echo "🔐 Storing API key in Secret Manager..."
if gcloud secrets describe studyai-api-key &>/dev/null; then
  echo -n "$GOOGLE_API_KEY" | gcloud secrets versions add studyai-api-key --data-file=-
else
  echo -n "$GOOGLE_API_KEY" | gcloud secrets create studyai-api-key --data-file=-
fi
echo "✅ API key stored"

# Create Artifact Registry repo
echo "📦 Creating Artifact Registry..."
if gcloud artifacts repositories describe studyai-repo --location=us-central1 &>/dev/null; then
  echo "   Repository already exists"
else
  gcloud artifacts repositories create studyai-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="StudyAI Docker images"
fi
echo "✅ Artifact Registry ready"

# Configure Docker
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet

echo ""
echo "=============================================="
echo "  ✅ Setup complete! Now run: ./deploy.sh"
echo "=============================================="
