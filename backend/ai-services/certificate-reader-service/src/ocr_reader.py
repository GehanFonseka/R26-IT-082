import threading
import os
from config import OCR_DEVICE, OCR_LANGUAGE, OCR_DETECTOR, OCR_RECOGNIZER, OCR_DETECTOR_DIR, OCR_RECOGNIZER_DIR

class OcrReader:
    def __init__(self):
        self.engine = None
        self.lock = threading.Lock()

    def load(self):
        if self.engine is None:
            if OCR_DETECTOR_DIR and OCR_RECOGNIZER_DIR:
                os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
            from paddleocr import PaddleOCR
            self.engine = PaddleOCR(lang=OCR_LANGUAGE, device=OCR_DEVICE,
                text_detection_model_name=OCR_DETECTOR, text_recognition_model_name=OCR_RECOGNIZER,
                text_detection_model_dir=OCR_DETECTOR_DIR, text_recognition_model_dir=OCR_RECOGNIZER_DIR,
                use_doc_orientation_classify=False, use_doc_unwarping=False, use_textline_orientation=False)

    def read(self, images):
        blocks = []
        with self.lock:
            self.load()
            for index, image in enumerate(images):
                for result in self.engine.predict(image):
                    data = result.json.get("res", result.json)
                    texts = data.get("rec_texts", [])
                    scores = data.get("rec_scores", [])
                    polygons = data.get("rec_polys", [])
                    for text, score, polygon in zip(texts, scores, polygons):
                        if text.strip():
                            blocks.append({"text": text, "confidence": float(score), "imageIndex": index,
                                "polygon": polygon.tolist() if hasattr(polygon, "tolist") else polygon})
        return blocks

reader = OcrReader()
