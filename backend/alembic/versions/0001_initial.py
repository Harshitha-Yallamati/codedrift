"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("github_id", sa.BigInteger(), nullable=True),
        sa.Column("username", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("avatar_url", sa.String(1024), nullable=True),
        sa.Column("access_token_encrypted", sa.String(2048), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_github_id", "users", ["github_id"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "repositories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("github_repo_id", sa.BigInteger(), nullable=True),
        sa.Column("full_name", sa.String(512), nullable=False),
        sa.Column("description", sa.String(1024), nullable=True),
        sa.Column("default_branch", sa.String(255), nullable=False, server_default="main"),
        sa.Column("private", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("language", sa.String(64), nullable=True),
        sa.Column("stars", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("webhook_secret", sa.String(255), nullable=True),
        sa.Column("last_analyzed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("health_score", sa.Float(), nullable=True),
        sa.Column("risk_category_counts", postgresql.JSONB(), nullable=True),
        sa.Column("latest_run_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_repositories_user_id", "repositories", ["user_id"])
    op.create_index("ix_repositories_github_repo_id", "repositories", ["github_repo_id"])
    op.create_index("ix_repositories_full_name", "repositories", ["full_name"])

    op.create_table(
        "commits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sha", sa.String(64), nullable=False),
        sa.Column("author_name", sa.String(255), nullable=False),
        sa.Column("author_email", sa.String(255), nullable=True),
        sa.Column("message", sa.String(4096), nullable=False),
        sa.Column("is_bug_fix", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("additions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("deletions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("files_changed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("branch", sa.String(255), nullable=False, server_default="main"),
        sa.Column("committed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("repository_id", "sha", name="uq_commit_repo_sha"),
    )
    op.create_index("ix_commits_repository_id", "commits", ["repository_id"])
    op.create_index("ix_commits_sha", "commits", ["sha"])
    op.create_index("ix_commits_is_bug_fix", "commits", ["is_bug_fix"])
    op.create_index("ix_commits_committed_at", "commits", ["committed_at"])

    op.create_table(
        "analysis_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("branch", sa.String(255), nullable=False, server_default="main"),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("trigger", sa.String(32), nullable=False, server_default="manual"),
        sa.Column("commit_sha", sa.String(64), nullable=True),
        sa.Column("model_type", sa.String(32), nullable=True),
        sa.Column("model_version", sa.String(64), nullable=True),
        sa.Column("health_score", sa.Float(), nullable=True),
        sa.Column("files_analyzed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("accuracy", sa.Float(), nullable=True),
        sa.Column("precision", sa.Float(), nullable=True),
        sa.Column("recall", sa.Float(), nullable=True),
        sa.Column("f1_score", sa.Float(), nullable=True),
        sa.Column("roc_auc", sa.Float(), nullable=True),
        sa.Column("feature_importance", postgresql.JSONB(), nullable=True),
        sa.Column("training_samples", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.String(2048), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_analysis_runs_repository_id", "analysis_runs", ["repository_id"])
    op.create_index("ix_analysis_runs_status", "analysis_runs", ["status"])

    op.create_table(
        "file_metrics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("analysis_run_id", sa.Integer(), sa.ForeignKey("analysis_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_path", sa.String(1024), nullable=False),
        sa.Column("language", sa.String(64), nullable=True),
        sa.Column("churn", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("commit_frequency", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("bug_fix_frequency", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("file_age_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("loc", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cyclomatic_complexity", sa.Float(), nullable=False, server_default="0"),
        sa.Column("developer_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("coupling_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("complexity_method", sa.String(16), nullable=False, server_default="heuristic"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_file_metrics_analysis_run_id", "file_metrics", ["analysis_run_id"])
    op.create_index("ix_file_metrics_repository_id", "file_metrics", ["repository_id"])
    op.create_index("ix_file_metrics_file_path", "file_metrics", ["file_path"])

    op.create_table(
        "risk_predictions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("file_metric_id", sa.Integer(), sa.ForeignKey("file_metrics.id", ondelete="CASCADE"), nullable=False),
        sa.Column("defect_probability", sa.Float(), nullable=False),
        sa.Column("risk_category", sa.String(16), nullable=False),
        sa.Column("model_type", sa.String(32), nullable=False),
        sa.Column("model_version", sa.String(64), nullable=False),
        sa.Column("explanation", sa.String(2048), nullable=False),
        sa.Column("feature_contributions", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_risk_predictions_file_metric_id", "risk_predictions", ["file_metric_id"], unique=True)
    op.create_index("ix_risk_predictions_risk_category", "risk_predictions", ["risk_category"])

    op.create_table(
        "pull_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pr_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(1024), nullable=False),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("state", sa.String(16), nullable=False, server_default="open"),
        sa.Column("base_branch", sa.String(255), nullable=True),
        sa.Column("head_branch", sa.String(255), nullable=True),
        sa.Column("risk_score", sa.Float(), nullable=True),
        sa.Column("risk_category", sa.String(16), nullable=True),
        sa.Column("files_changed", postgresql.JSONB(), nullable=True),
        sa.Column("summary", sa.String(4096), nullable=True),
        sa.Column("comment_preview", sa.String(8192), nullable=True),
        sa.Column("analyzed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("repository_id", "pr_number", name="uq_pr_repo_number"),
    )
    op.create_index("ix_pull_requests_repository_id", "pull_requests", ["repository_id"])

    op.create_table(
        "webhook_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=True),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("action", sa.String(64), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("processed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.String(2048), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_webhook_events_repository_id", "webhook_events", ["repository_id"])
    op.create_index("ix_webhook_events_event_type", "webhook_events", ["event_type"])
    op.create_index("ix_webhook_events_processed", "webhook_events", ["processed"])


def downgrade() -> None:
    op.drop_table("webhook_events")
    op.drop_table("pull_requests")
    op.drop_table("risk_predictions")
    op.drop_table("file_metrics")
    op.drop_table("analysis_runs")
    op.drop_table("commits")
    op.drop_table("repositories")
    op.drop_table("users")
