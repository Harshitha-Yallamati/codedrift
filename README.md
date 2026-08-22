# CodeDrift

**ML-powered codebase health & technical debt monitor.** CodeDrift analyzes a GitHub repository's commit history and code metrics to predict which files are likely to cause future bugs — with a per-repo Codebase Health Score, a visual risk heatmap, plain-English risk explanations, technical debt trends, and pull-request risk analysis.

## Why

Most static analysis tools flag *style* issues. CodeDrift flags files that are statistically likely to cause a *production bug*, using the same signals engineering leads intuitively track — churn, bug-fix frequency, complexity, coupling, and who's touched the file — fed into an XGBoost classifier trained on the repository's own history.

## Architecture

```
frontend/   React + TypeScript + Tailwind CSS (Vite) — dark, dashboard-style SPA
backend/    FastAPI + SQLAlchemy + Celery — REST API, ML pipeline, GitHub integration
  app/models/      SQLAlchemy models (users, repositories, commits, analysis runs, file
                    metrics, risk predictions, pull requests, webhook events)
  app/schemas/      Pydantic request/response contracts
  app/analysis/    Git-history metrics: churn, coupling, bug-fix classification, AST-based
                    cyclomatic complexity (Python) with a documented heuristic fallback
                    for other languages
  app/ml/           Feature engineering, XGBoost training (leakage-free temporal split),
                    heuristic fallback for sparse repos, prediction, explanation generation,
                    versioned model storage
  app/services/     GitHub REST API client (rate-limit aware, no local cloning), analysis
                    orchestration, read-side aggregations, PR risk scoring, CSV/PDF export
  app/api/          FastAPI routes (auth, repos, dashboard, files, trends, analytics, PRs,
                    webhooks, export, settings)
  app/workers/      Celery tasks — analysis runs, PR analysis, and webhook processing all
                    happen asynchronously off the request path
  app/seed/         Synthetic demo data generator (3 repos, realistic history, scored with
                    the same ML/heuristic code the live pipeline uses)
```

**No local git cloning.** Commit history, diff stats, and file contents are all fetched over the GitHub REST API — the backend container never shells out to `git`.

**ML methodology.** A file's engineered features (churn, commit frequency, bug-fix frequency, age, LOC, cyclomatic complexity, developer count, coupling) are computed from a repo's commit history. Training uses a **temporal split** — features from the older ~70% of commits, labels from whether a file was touched by a bug-fix commit in the newer ~30% — to avoid the tautology of predicting "has this file ever had a bug" from itself. Repos with too little history (or only one label class) fall back to a transparent, documented weighted-heuristic score instead of a model; the UI always shows which one produced a given score.

## Running locally

```bash
cp backend/.env.example backend/.env   # fill in SECRET_KEY / FERNET_KEY (see below)
docker compose up --build
```

- Backend: http://localhost:8000 (docs at `/docs`)
- Frontend: http://localhost:5173
- The backend's startup command runs Alembic migrations and seeds demo data automatically.

Generate dev secrets:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### GitHub OAuth (optional)

The app is fully explorable via the **demo login** with zero GitHub setup. To connect real repositories:

1. Create a GitHub OAuth App at `https://github.com/settings/developers`.
2. Set its callback URL to `<backend-url>/api/v1/auth/github/callback`.
3. Set `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in `backend/.env` (or the deployed backend's env vars).

### Webhooks

`GET /api/v1/repos/{id}/webhook-info` returns a URL + secret to register as a GitHub webhook (`push`, `pull_request` events) on a connected repository. Incoming events are verified via HMAC-SHA256 and processed asynchronously by Celery, which re-analyzes the affected branch or scores the pull request.

### PR-bot extension point

`POST /api/v1/repos/{id}/prs/{pr_number}/analyze` computes a PR's risk score and `GET .../comment-preview` returns the exact markdown a bot would post. Actually posting to GitHub is left as a documented extension point in `app/services/pr_comment_service.py` — it needs a GitHub App/PAT with pull-request write scope, a separate credential from the read-only OAuth login this app requests.

## Tests

```bash
cd backend && pip install -r requirements.txt && pytest
```

## Deployment

Live on Render: Postgres + Key Value (Redis) + a Python-runtime backend web service + a static frontend site. `render.yaml` documents this topology for Render's Blueprint import. Two notes on how the live deploy differs from local `docker compose`:

- The backend runs as Render's native Python runtime rather than the Dockerfile (Render's Blueprint/MCP tooling for web services doesn't support Docker in this project's setup) — `backend/Dockerfile` remains the source of truth for local dev and any Docker-based deploy done via the Render dashboard directly.
- The Celery worker runs as a second process inside the backend service (`celery ... --detach`) rather than as its own service, since a standalone background-worker service wasn't available through the tooling used to provision this deploy. `docker-compose.yml` keeps them as separate `backend`/`worker` services for local dev and as the reference topology for a "real" production split.
