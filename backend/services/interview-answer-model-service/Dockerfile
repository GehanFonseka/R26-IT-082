FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir \
    --default-timeout=120 \
    --retries=10 \
    -r requirements.txt

RUN pip install --no-cache-dir \
    torch==2.6.0 \
    --index-url https://download.pytorch.org/whl/cpu

COPY . .

ENV PYTHONUNBUFFERED=1

ENV MODEL_DIR=/app/model/v5
ENV NLI_MODEL_DIR=/app/model/nli
ENV MODEL_ID=Final_ASAG_Interview_Scorer_V5
ENV NLI_MODEL_ID=cross-encoder/nli-deberta-v3-base

EXPOSE 4010

CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "4010"]