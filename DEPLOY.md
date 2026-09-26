# Deploying to AWS (frontend + backend, one server)

Both the React frontend and the FastAPI backend ship in **one Docker image**
and run as **one AWS App Runner service**. The `Dockerfile` at the repo root
builds `frontend/` (`npm run build`) in one stage, then copies the result
into the Python backend image, which serves it — see the block at the bottom
of [backend/main.py](backend/main.py). Same origin for both, so there's no
CORS to configure between them in production.

> **Windows + OneDrive note:** this repo lives under `OneDrive\Desktop\...`.
> Docker Desktop's file sharing can choke on OneDrive-synced folders and fail
> the build with `ERROR: invalid file request ...` even though nothing is
> wrong with the Dockerfile (verified while testing this setup). If `docker
> build` fails with that error, clone/copy the repo to a plain local path
> outside OneDrive (e.g. `C:\dev\Estroc-main`) and build from there — or build
> inside WSL2, or let App Runner/CodeBuild build from source instead of
> building locally.

## 0. Prereqs

- AWS CLI installed and configured (`aws configure`).
- Docker installed and running locally.
- Pick a region, e.g. `ap-south-1` (Mumbai) — used below, swap for yours.

## 1. Build and push the image to ECR

```bash
# one-time: create the repository
aws ecr create-repository --repository-name estroc-app --region ap-south-1

# authenticate Docker to ECR
aws ecr get-login-password --region ap-south-1 \
  | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

# build from the repo root (this is the build context — it needs both frontend/ and backend/)
docker build -t estroc-app .

# tag and push
docker tag estroc-app:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/estroc-app:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/estroc-app:latest
```

Replace `<ACCOUNT_ID>` with your AWS account ID (`aws sts get-caller-identity`).

## 2. Create the App Runner service

Console: **App Runner → Create service**

- Source: **Container registry** → Amazon ECR → pick `estroc-app:latest`.
  - Deployment trigger: "Automatic" to auto-redeploy whenever you push a new
    `:latest` tag.
- Port: `8000`
- Health check: path `/health`, protocol HTTP.
- Environment variables (Configuration → Environment variables) — these are
  backend-only now, the frontend has no separate config once same-origin:
  | Key | Value |
  | --- | --- |
  | `CORS_ORIGINS` | leave as default, or add any *other* origin that will call this API directly (not needed for the bundled frontend itself, since it's same-origin) |
  | `OPENAI_API_KEY` | mark as **secret** — reference an AWS Secrets Manager secret, don't paste plaintext |
  | `SMTP_USER` | e.g. `estroctech@gmail.com` |
  | `SMTP_APP_PASSWORD` | mark as **secret**, same as above |
  | `RECIPIENT_EMAIL` | e.g. `estroctech@gmail.com` |

  Create a secret: `aws secretsmanager create-secret --name estroc/openai-api-key --secret-string "<key>"`,
  then in App Runner's env var value pick "Secrets Manager" and select it.
  **The local `backend/.env` has a live OpenAI key and Gmail app password in it —
  rotate both if this repo or `.env` has ever been shared outside your
  machine.**

## 3. Verify

App Runner gives you a URL like `https://abcd1234.ap-south-1.awsapprunner.com`.

```bash
curl https://abcd1234.ap-south-1.awsapprunner.com/health   # {"status":"ok"}
```

Open the URL itself in a browser — it should load the actual site (served by
the same backend), and the chat widget / enquiry form should work without any
CORS errors in the console, since everything is same-origin.

## 4. Custom domain (optional)

App Runner → your service → **Custom domains** → add `estroc.co.in` (and `www.estroc.co.in`), then
add the CNAME records it gives you at your DNS provider.

## Redeploying after a code change

```bash
docker build -t estroc-app .
docker tag estroc-app:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/estroc-app:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/estroc-app:latest
```

If the service's deployment trigger is "Automatic", App Runner redeploys the
new `:latest` push within a minute or two. Otherwise, hit **Deploy** on the
service in the console.

## Local development (unchanged)

Frontend and backend still run separately for dev — this Docker setup is only
for the production build:

```bash
cd frontend && npm run dev                  # frontend on :3001
cd backend && uvicorn main:app --reload     # backend on :8000
```

`VITE_API_BASE_URL` in `frontend/.env` should point at
`http://localhost:8000` for this (already the default if unset).
