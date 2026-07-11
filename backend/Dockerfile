# Multi-stage build for Enterprise FastAPI
FROM python:3.11-slim as requirements-stage

WORKDIR /tmp
RUN pip install poetry
COPY ./requirements.txt /tmp/requirements.txt
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /tmp/wheels -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

# Install dependencies securely without cache
COPY --from=requirements-stage /tmp/wheels /wheels
COPY --from=requirements-stage /tmp/requirements.txt .
RUN pip install --no-cache /wheels/*

# Copy Alembic and App Source
COPY alembic.ini .
COPY alembic /app/alembic
COPY app /app/app

# Expose enterprise API port
EXPOSE 8000

# Run Uvicorn asynchronously with standard workers
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
