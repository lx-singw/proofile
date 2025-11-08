# Multi-stage build for development and production

# Development stage
FROM python:3.11-slim as development

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry==1.7.1

# Configure Poetry
RUN poetry config virtualenvs.create false

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry install --no-interaction --no-ansi

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Development command (will be overridden by docker-compose)
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM python:3.11-slim as production

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libmagic1 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry==1.7.1

# Configure Poetry
RUN poetry config virtualenvs.create false

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install only production dependencies
RUN poetry install --no-interaction --no-ansi --no-dev

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Production command
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
