FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src

ENV PYTHONUNBUFFERED=1
ENV PORT=4005
ENV WHISPER_MODEL_SIZE=tiny
ENV WHISPER_DEVICE=cpu
ENV WHISPER_COMPUTE_TYPE=int8

EXPOSE 4005
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "4005"]
