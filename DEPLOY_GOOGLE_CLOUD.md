# Deploying Blackshadow Library on Google Cloud Platform (GCP)

This guide walks you through deploying this full-stack application on **Google Cloud Run** and configuring dynamic cloud file uploads using **Google Cloud Storage (GCS)**.

---

## Part 1: Setting up Private Google Cloud Storage (Bucket)

Follow these steps to create a storage bucket where your uploads (Videos & PDFs) are stored:

1. **Open Google Cloud Shell** or install the Local [Google Cloud SDK](https://cloud.google.com/sdk).
2. **Create a global Storage Bucket**:
   ```bash
   gcloud storage buckets create gs://YOUR_UNIQUE_BUCKET_NAME --location=us-central1
   ```
3. **Make Bucket Objects Publicly Searchable** (needed so subscribers can view/read uploaded contents):
   ```bash
   # Add secure IAM permission granting Read Access to All Users
   gcloud storage buckets add-iam-policy-binding gs://YOUR_UNIQUE_BUCKET_NAME \
     --member=allUsers \
     --role=roles/storage.objectViewer
   ```

---

## Part 2: Containerizing and Deploying on Google Cloud Run

We have included a production-ready multi-stage `Dockerfile`. Run the following commands in the root of your project directory to deploy:

1. **Build and push the container to Google Artifact Registry**:
   ```bash
   # Enable Cloud Build services
   gcloud services enable build.googleapis.com artifactregistry.googleapis.com run.googleapis.com

   # Submit container build
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/blackshadow-library
   ```

2. **Deploy the container to Cloud Run**:
   ```bash
   gcloud run deploy blackshadow-library \
     --image gcr.io/YOUR_PROJECT_ID/blackshadow-library \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3000 \
     --set-env-vars GCS_BUCKET_NAME=YOUR_UNIQUE_BUCKET_NAME
   ```

*Note: Inside Google Cloud Run containers, IAM Service Accounts are authorized automatically to read/write storage on your Cloud Storage buckets in the same project! No complex API json credential keys are required inside your code.*

---

## Part 3: Local Development with Cloud Storage

If you want to test Cloud Storage locally on your personal machine during development rather than fallback:

1. **Generate a Service Account JSON Security Key**:
   - Go to Cloud Console -> **IAM & Admin** -> **Service Accounts**.
   - Create a service account with the role **Storage Object Admin**.
   - Generate and download credit card-sized JSON key (e.g., `key.json`).
2. **Configure your environment**:
   Create a `.env` file in the project root containing:
   ```env
   # Link the sandbox server to GCS bucket
   GCS_BUCKET_NAME="YOUR_UNIQUE_BUCKET_NAME"
   GOOGLE_APPLICATION_CREDENTIALS="./key.json"
   ```
3. Boot the environment locally (`npm run dev`) and test uploads! They will automatically streamline directly into your GCP dashboard without needing local fallbacks.
