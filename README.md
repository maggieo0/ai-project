# StudyAI - AI-Powered Study Assistant

A Quizlet-style study platform powered by Google Gemini. Create flashcards, practice questions, and full exams from any topic.

## Setup & Deployment

### Prerequisites
- Google Cloud account with billing enabled
- Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- Docker installed in Cloud Shell

### Steps

**1. Clone and configure**
```bash
gh repo clone YOUR_USERNAME/Project_DATS
cd Project_DATS
cp env.template .env
nano .env  # fill in your values
```

**2. Run setup (once)**
```bash
./setup.sh
```

**3. Deploy**
```bash
./deploy.sh
```

Your live URLs will be printed at the end.

## Project Structure

```
Project_DATS/
├── .env                          # your credentials (never commit this)
├── env.template                  # template to copy from
├── setup.sh                      # run once to provision GCP resources
├── deploy.sh                     # builds and deploys to Cloud Run
├── .github/workflows/deploy.yml  # auto-deploy on push to main
└── AI_project/
    ├── backend/
    │   ├── flashcard_agent/      # generates flip-card decks
    │   ├── practice_agent/       # generates practice questions
    │   ├── exam_agent/           # builds full exams
    │   ├── study_orchestrator/   # routes requests to correct agent
    │   ├── main.py               # FastAPI + WebSocket server
    │   ├── requirements.txt
    │   └── Dockerfile
    ├── frontend/
    │   ├── app/                  # Next.js pages
    │   ├── components/           # FlashcardDeck, PracticeQuiz, ExamViewer
    │   └── Dockerfile
    └── terraform/
        └── main.tf               # optional IaC alternative to deploy.sh
```

## GitHub Actions (Auto-Deploy)

On every push to `main`, the CI/CD pipeline automatically builds and redeploys both services. Set these secrets in your GitHub repo settings:

| Secret | Value |
|--------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_SA_KEY` | Service account key JSON (base64) |
| `STUDYAI_BUCKET` | Your GCS bucket name |
