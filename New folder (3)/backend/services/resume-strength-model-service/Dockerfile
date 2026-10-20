FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .

RUN pip install --no-cache-dir \
    --default-timeout=180 \
    --retries=10 \
    torch==2.6.0 \
    --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir \
    --default-timeout=120 \
    --retries=10 \
    -r requirements.txt
COPY . .
ENV PYTHONUNBUFFERED=1
EXPOSE 4009
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "4009"]
