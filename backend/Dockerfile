FROM python:3.12-slim AS base

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:0.7 /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install production dependencies only
RUN uv sync --frozen --no-dev --no-install-project

# Copy application code and install the project into the virtual environment.
COPY app/ app/
COPY migrations/ migrations/
COPY alembic.ini .
COPY start.sh .
RUN uv sync --frozen --no-dev
RUN chmod 755 start.sh

# Run as non-root
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

CMD ["./start.sh"]
