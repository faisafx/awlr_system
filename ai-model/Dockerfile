FROM python:3.10

# Hugging Face menyarankan menggunakan non-root user
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy requirement dan install
COPY --chown=user ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Copy sisa file AI
COPY --chown=user . /app

# Jalankan server FastAPI
CMD ["uvicorn", "ai_server:app", "--host", "0.0.0.0", "--port", "7860"]
