# =============================================================================
# StudyAI - Terraform Infrastructure (Google Cloud)
# =============================================================================

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ─── Variables ────────────────────────────────────────────────────────────────

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "bucket_name" {
  description = "GCS bucket name for study sets"
  type        = string
}

# ─── Artifact Registry ────────────────────────────────────────────────────────

resource "google_artifact_registry_repository" "studyai_repo" {
  location      = var.region
  repository_id = "studyai-repo"
  description   = "StudyAI Docker images"
  format        = "DOCKER"
}

# ─── GCS Bucket ───────────────────────────────────────────────────────────────

resource "google_storage_bucket" "studyai_bucket" {
  name          = var.bucket_name
  location      = "US"
  force_destroy = false

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  uniform_bucket_level_access = true
}

# ─── Secret Manager ───────────────────────────────────────────────────────────

resource "google_secret_manager_secret" "api_key" {
  secret_id = "studyai-api-key"

  replication {
    auto {}
  }
}

# ─── Cloud Run - Backend ──────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "backend" {
  name     = "studyai-backend"
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/studyai-repo/studyai-backend:latest"

      env {
        name  = "GOOGLE_CLOUD_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "STUDYAI_BUCKET"
        value = var.bucket_name
      }

      env {
        name = "GOOGLE_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.api_key.secret_id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# ─── Cloud Run - Frontend ─────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "frontend" {
  name     = "studyai-frontend"
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/studyai-repo/studyai-frontend:latest"

      env {
        name  = "NEXT_PUBLIC_WS_URL"
        value = "wss://${google_cloud_run_v2_service.backend.uri}"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_cloud_run_v2_service.backend]
}

# ─── Public Access ────────────────────────────────────────────────────────────

resource "google_cloud_run_service_iam_member" "backend_public" {
  location = var.region
  service  = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public" {
  location = var.region
  service  = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "backend_url" {
  description = "Backend Cloud Run URL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  description = "Frontend Cloud Run URL"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "bucket_name" {
  description = "GCS bucket for study sets"
  value       = google_storage_bucket.studyai_bucket.name
}
