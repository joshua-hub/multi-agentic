# Stage 1: Builder
FROM ubuntu:22.04 AS builder

# Update package lists and install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up pip configuration
RUN mkdir -p /root/.pip

# Copy pip.conf from the build context (now the root of the project)
COPY pip.conf /root/.pip/

# Create Python virtual environment
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Install Python dependencies
COPY middle/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Final
FROM ubuntu:22.04

# Update and upgrade OS packages for security
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-privileged user and group
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Set up application directory
RUN mkdir -p /app && chown -R appuser:appgroup /app

# Copy virtual environment from builder stage
COPY --from=builder /venv /venv
RUN chown -R appuser:appgroup /venv

# Set environment variables
ENV PATH="/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Switch to non-privileged user
USER appuser

# Copy application code
WORKDIR /app
COPY --chown=appuser:appgroup middle/app/ ./app/

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 