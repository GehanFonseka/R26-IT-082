import time
from config import OCR_THRESHOLD, VISION_ENABLED, MAX_VISION_IMAGES, TIMEOUT
from image_input import load_images
from ocr_reader import reader
from recipient import recipients, grounded, normalized, is_recipient_name
from vision_reader import read_vision
from recipient_layout import recipient_layout_text
from recipient_aliases import distinct_recipients
from recipient_roles import is_non_recipient
from recipient_confidence import recipient_confidence

def read_certificate(payload, request_id):
    started = time.monotonic()
    images, complete = load_images(payload)
    ocr_error = ""
    try:
        blocks = reader.read(images) if images else []
    except Exception:
        blocks = []
        complete = False
        ocr_error = "Local OCR could not read the document. Check OCR installation and model setup."
    ocr_text = "\n".join(block["text"] for block in blocks)
    evidence = f"{payload.rawText}\n{ocr_text}".strip()
    html_names = recipients(payload.rawText)
    names = recipients(f"{payload.rawText}\n{recipient_layout_text(blocks, html_names)}", html_names)
    names = distinct_recipients([name for name in names if not is_non_recipient(name, payload.rawText)])
    confidence = recipient_confidence(blocks, names, default=1 if names and payload.rawText else 0)
    if html_names and all(normalized(name) in [normalized(item) for item in html_names] for name in names):
        confidence = 1
    source = "html_text" if html_names else "image_ocr" if blocks else "document_text"
    warning = ocr_error
    vision_used = False
    vision_names = []
    vision_only_name = False
    vision_texts = []
    ocr_confidence = sum(block["confidence"] for block in blocks) / len(blocks) if blocks else 0
    needs_vision = payload.purpose == "certificate" or ocr_confidence < OCR_THRESHOLD
    if images and needs_vision:
        if VISION_ENABLED:
            candidates = sorted(range(len(images)), key=lambda index: not any(
                "certificate" in block["text"].lower() for block in blocks if block["imageIndex"] == index))
            # An embedded PDF supplies the full-resolution credential; screenshots
            # remain OCR evidence and any additional unconfirmed recipient requires review.
            vision_limit = 1 if payload.data and payload.mimeType == "application/pdf" and payload.images else MAX_VISION_IMAGES
            if vision_limit == 1 and payload.data and payload.mimeType == "application/pdf" and payload.images:
                candidates = [0]
            for index in candidates[:vision_limit]:
                image = images[index]
                page_text = "\n".join(block["text"] for block in blocks if block["imageIndex"] == index)
                try:
                    remaining = TIMEOUT - (time.monotonic() - started)
                    if remaining <= 1:
                        raise RuntimeError("Local certificate reading exceeded its time budget.")
                    output = read_vision(image, page_text, request_id, remaining, purpose=payload.purpose)
                    vision_used = True
                    transcription = output.get("documentText", "")
                    if isinstance(transcription, str) and transcription.strip():
                        vision_texts.append(transcription[:12000])
                    for name in output.get("recipientNames", []):
                        if isinstance(name, str) and is_recipient_name(name.strip()) and grounded(transcription, name) \
                            and not is_non_recipient(name, payload.rawText):
                            vision_names.append(normalized(name))
                            if normalized(name) not in [normalized(item) for item in names]:
                                names.append(name.strip())
                            if not grounded(f"{page_text}\n{payload.rawText}", name):
                                vision_only_name = True
                                warning = "The name was read by local vision but could not be corroborated by OCR. Please review the certificate."
                except (RuntimeError, ValueError, OSError) as error:
                    warning = str(error) if isinstance(error, RuntimeError) else "Local vision inference is unavailable."
                    break
                except Exception:
                    warning = "Ollama is unavailable or took too long. Start Ollama and install the configured vision model."
                    break
        else:
            warning = "Local vision reading is disabled."
        names = distinct_recipients(names)
        if names:
            confidence = recipient_confidence(blocks, names, default=confidence)
            if html_names and all(normalized(name) in [normalized(item) for item in html_names] for name in names):
                confidence = 1
        if vision_only_name:
            confidence = min(confidence, OCR_THRESHOLD - 0.01)
        if vision_used:
            source = "local_vision"
            if names and any(normalized(name) not in vision_names for name in names):
                warning = warning or "Local vision could not confirm all recipient names read from the page. Please review the certificate."
        if warning:
            complete = False
    if vision_texts:
        evidence += "\n" + "\n".join(vision_texts)
        if payload.purpose == "content":
            source = "local_vision"
    complete = complete and len(evidence) <= 60000 and len(blocks) <= 2000
    if payload.purpose == "content":
        confidence = ocr_confidence if blocks else 1 if payload.rawText.strip() else 0
    return {"recipientName": names[0] if names else "", "recipientNames": names[:20],
        "documentText": evidence[:60000], "confidence": max(0, min(1, confidence)), "blocks": blocks[:2000],
        "source": source, "inspectionComplete": complete, "warning": warning, "visionUsed": vision_used}
