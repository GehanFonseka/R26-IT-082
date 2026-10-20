import base64
import io
import pymupdf as fitz
import numpy as np
from PIL import Image
from config import MAX_IMAGES, MAX_PIXELS

Image.MAX_IMAGE_PIXELS = MAX_PIXELS

def load_images(payload):
    images = []
    complete = True
    if payload.data and payload.mimeType == "application/pdf":
        with fitz.open(stream=base64.b64decode(payload.data), filetype="pdf") as document:
            if document.needs_pass:
                raise ValueError("The certificate PDF requires a password.")
            complete = len(document) <= MAX_IMAGES
            for index in range(min(len(document), MAX_IMAGES)):
                page = document[index]
                scale = min(2, (MAX_PIXELS / max(1, page.rect.width * page.rect.height)) ** 0.5)
                pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
                images.append(Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples))
    sources = payload.images or ([payload] if payload.data and payload.mimeType != "application/pdf" else [])
    complete = complete and len(images) + len(sources) <= MAX_IMAGES
    for item in sources[:max(0, MAX_IMAGES - len(images))]:
        with Image.open(io.BytesIO(base64.b64decode(item.data))) as image:
            if image.width * image.height > MAX_PIXELS:
                raise ValueError("A certificate image exceeds the pixel limit.")
            images.append(image.convert("RGB"))
    return [np.array(image) for image in images], complete

def encode_image(image, max_side=None):
    output = io.BytesIO()
    rendered = Image.fromarray(image)
    if max_side:
        rendered.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    rendered.save(output, format="JPEG", quality=90)
    return base64.b64encode(output.getvalue()).decode("ascii")
