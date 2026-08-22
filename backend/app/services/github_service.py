"""Thin GitHub REST API client. No local git cloning: commit history, per-file
diff stats, and file contents are all fetched over the API, which keeps the
backend container free of git/exec concerns and works the same whether the
repo is public or private (given an OAuth token).

Rate limits: GitHub's REST API allows 5000 req/hr for authenticated
requests. Every response is inspected for `X-RateLimit-Remaining`; when it
drops below a small buffer we sleep until `X-RateLimit-Reset`. Conditional
requests (ETag) aren't persisted across runs in this simple version, but
the backoff alone is enough to stay within limits for typical repos.
"""

import base64
import time
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

from app.core.config import settings

GITHUB_API_BASE = settings.GITHUB_API_BASE
RATE_LIMIT_BUFFER = 5


class GitHubAPIError(Exception):
    pass


class GitHubClient:
    def __init__(self, access_token: Optional[str] = None):
        headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        self._client = httpx.Client(base_url=GITHUB_API_BASE, headers=headers, timeout=30.0)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "GitHubClient":
        return self

    def __exit__(self, *exc: Any) -> None:
        self.close()

    def _respect_rate_limit(self, response: httpx.Response) -> None:
        remaining = response.headers.get("X-RateLimit-Remaining")
        reset = response.headers.get("X-RateLimit-Reset")
        if remaining is not None and int(remaining) <= RATE_LIMIT_BUFFER and reset:
            wait = max(int(reset) - int(time.time()), 0)
            if wait > 0:
                time.sleep(min(wait, 60))

    def _get(self, path: str, params: Optional[dict] = None) -> httpx.Response:
        response = self._client.get(path, params=params)
        self._respect_rate_limit(response)
        if response.status_code == 403 and "rate limit" in response.text.lower():
            reset = response.headers.get("X-RateLimit-Reset")
            wait = max(int(reset) - int(time.time()), 1) if reset else 5
            time.sleep(min(wait, 60))
            response = self._client.get(path, params=params)
        if response.status_code >= 400:
            raise GitHubAPIError(f"GitHub API error {response.status_code} for {path}: {response.text[:200]}")
        return response

    def exchange_code_for_token(self, code: str) -> str:
        resp = httpx.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_OAUTH_REDIRECT_URI,
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        if "access_token" not in data:
            raise GitHubAPIError(f"OAuth exchange failed: {data}")
        return data["access_token"]

    def get_authenticated_user(self) -> dict:
        return self._get("/user").json()

    def list_user_repos(self, per_page: int = 100) -> list[dict]:
        repos: list[dict] = []
        page = 1
        while True:
            resp = self._get(
                "/user/repos", params={"per_page": per_page, "page": page, "sort": "updated", "affiliation": "owner,collaborator"}
            )
            batch = resp.json()
            repos.extend(batch)
            if len(batch) < per_page:
                break
            page += 1
            if page > 10:
                break
        return repos

    def list_commits(self, full_name: str, branch: str, since: Optional[datetime] = None, max_commits: int = 500) -> list[dict]:
        commits: list[dict] = []
        page = 1
        params: dict[str, Any] = {"sha": branch, "per_page": 100}
        if since:
            params["since"] = since.astimezone(timezone.utc).isoformat()
        while len(commits) < max_commits:
            params["page"] = page
            resp = self._get(f"/repos/{full_name}/commits", params=params)
            batch = resp.json()
            if not batch:
                break
            commits.extend(batch)
            if len(batch) < 100:
                break
            page += 1
        return commits[:max_commits]

    def get_commit_detail(self, full_name: str, sha: str) -> dict:
        return self._get(f"/repos/{full_name}/commits/{sha}").json()

    def get_file_content(self, full_name: str, path: str, ref: str) -> Optional[str]:
        try:
            resp = self._get(f"/repos/{full_name}/contents/{path}", params={"ref": ref})
        except GitHubAPIError:
            return None
        data = resp.json()
        if isinstance(data, list) or data.get("encoding") != "base64":
            return None
        try:
            return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
        except Exception:
            return None

    def get_repo(self, full_name: str) -> dict:
        return self._get(f"/repos/{full_name}").json()

    def list_pull_requests(self, full_name: str, state: str = "open") -> list[dict]:
        return self._get(f"/repos/{full_name}/pulls", params={"state": state, "per_page": 50}).json()

    def get_pull_request(self, full_name: str, pr_number: int) -> dict:
        return self._get(f"/repos/{full_name}/pulls/{pr_number}").json()

    def get_pull_request_files(self, full_name: str, pr_number: int) -> list[dict]:
        files: list[dict] = []
        page = 1
        while True:
            resp = self._get(f"/repos/{full_name}/pulls/{pr_number}/files", params={"per_page": 100, "page": page})
            batch = resp.json()
            files.extend(batch)
            if len(batch) < 100:
                break
            page += 1
        return files

    def create_webhook(self, full_name: str, webhook_url: str, secret: str) -> dict:
        resp = self._client.post(
            f"/repos/{full_name}/hooks",
            json={
                "name": "web",
                "active": True,
                "events": ["push", "pull_request"],
                "config": {"url": webhook_url, "content_type": "json", "secret": secret},
            },
        )
        self._respect_rate_limit(resp)
        if resp.status_code >= 400:
            raise GitHubAPIError(f"Failed to create webhook: {resp.status_code} {resp.text[:200]}")
        return resp.json()
