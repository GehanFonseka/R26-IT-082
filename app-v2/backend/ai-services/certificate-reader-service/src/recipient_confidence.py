import re
from recipient import normalized

def recipient_confidence(blocks, names, default=0):
    scores = []
    for block in blocks:
        text = normalized(block["text"])
        if len(text) < 2 or not any(character.isalpha() for character in text):
            continue
        for name in names:
            value = normalized(name)
            if re.search(r"(?<!\w)" + re.escape(text) + r"(?!\w)", value) \
                or re.search(r"(?<!\w)" + re.escape(value) + r"(?!\w)", text):
                scores.append(block["confidence"])
                break
    return min(scores, default=default)
