import os
from pathlib import Path
from dotenv import load_dotenv

SERVICE_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = SERVICE_ROOT.parents[2] if len(SERVICE_ROOT.parents) > 2 else SERVICE_ROOT
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(SERVICE_ROOT / ".env", override=True)

PORT = int(os.getenv("CERTIFICATE_LOCAL_MODEL_PORT", "4013"))
OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
VISION_MODEL = os.getenv("CERTIFICATE_VISION_MODEL", "qwen3-vl:2b")
VISION_ENABLED = os.getenv("CERTIFICATE_VISION_ENABLED", "true").lower() == "true"
VISION_MAX_SIDE = max(512, min(1600, int(os.getenv("CERTIFICATE_VISION_MAX_SIDE", "1024"))))
OCR_DEVICE = os.getenv("CERTIFICATE_OCR_DEVICE", "cpu")
OCR_LANGUAGE = os.getenv("CERTIFICATE_OCR_LANGUAGE", "en")
OCR_THRESHOLD = float(os.getenv("CERTIFICATE_OCR_CONFIDENCE", "0.85"))
MAX_IMAGES = min(12, max(1, int(os.getenv("CERTIFICATE_MAX_IMAGES", "8"))))
MAX_PIXELS = int(os.getenv("CERTIFICATE_MAX_IMAGE_PIXELS", "16000000"))
MAX_BYTES = int(os.getenv("CERTIFICATE_MODEL_MAX_BYTES", "20000000"))
MAX_JOBS = max(1, int(os.getenv("CERTIFICATE_MODEL_MAX_JOBS", "1")))
TIMEOUT = float(os.getenv("CERTIFICATE_LOCAL_MODEL_TIMEOUT_SECONDS", "180"))
OCR_DETECTOR = os.getenv("CERTIFICATE_OCR_DETECTOR", "PP-OCRv5_mobile_det")
OCR_RECOGNIZER = os.getenv("CERTIFICATE_OCR_RECOGNIZER", "en_PP-OCRv5_mobile_rec")
LOCAL_MODELS = PROJECT_ROOT / ".local-ai" / "ocr"
OCR_DETECTOR_DIR = os.getenv("CERTIFICATE_OCR_DETECTOR_DIR") or (str(LOCAL_MODELS / "detector") if (LOCAL_MODELS / "detector" / "inference.json").exists() else None)
OCR_RECOGNIZER_DIR = os.getenv("CERTIFICATE_OCR_RECOGNIZER_DIR") or (str(LOCAL_MODELS / "recognizer") if (LOCAL_MODELS / "recognizer" / "inference.json").exists() else None)
MAX_VISION_IMAGES = max(1, min(MAX_IMAGES, int(os.getenv("CERTIFICATE_MAX_VISION_IMAGES", "2"))))
