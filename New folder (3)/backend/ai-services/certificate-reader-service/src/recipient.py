import re
import unicodedata

def normalized(value):
    return " ".join(unicodedata.normalize("NFKC", str(value)).casefold().split())

def grounded(text, name):
    return bool(normalized(name)) and normalized(name) in normalized(text)

def is_recipient_name(name):
    return isinstance(name, str) and 2 <= len(name) <= 180 and all(
        character.isalpha() or unicodedata.category(character).startswith("M") or character in " .'- ,’"
        for character in name) and not re.match(
            r"^(?:the|this|certificate|certification|certified|completion|badge|credential|successfully|has)\b", name, re.I)

def recipients(text, corroborated=()):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    found = []
    cue = re.compile(r"^(?:this is to certify that|this certifies that|(?:(?:this )?(?:certificate|badge|credential) (?:was )?)?(?:awarded|presented|issued) to|congratulations to|(?:course )?completed by|earned by|(?:certificate )?recipient(?: name)?|credential holder)\b\s*[:\-]?\s*(.*)$", re.I)
    for index, line in enumerate(lines):
        match = cue.match(line)
        if match:
            name = match[1] or (lines[index + 1] if index + 1 < len(lines) else "")
        else:
            completion = re.match(r"^(.*?)\bhas\s+(?:successfully\s+)?(?:completed|earned|achieved)\b", line, re.I)
            if not completion:
                continue
            name = completion[1].strip() or (lines[index - 1] if index > 0 else "")
            if len(name.split()) == 1 and index > 1 and len(lines[index - 2].split()) == 1:
                previous = lines[index - 2]
                if previous.isalpha() and not re.match(r"certificate|completion|certification|diploma", previous, re.I):
                    name = f"{previous} {name}"
        name = re.split(r"\s+(?:has|for|in recognition|on completion)\b", name, flags=re.I)[0].strip()
        if match:
            # Join OCR line wrapping only when the full name has a separate printed label.
            start = index if match[1] else index + 1
            adjacent = " ".join(lines[start:start + 2])
            full_names = [full for full in corroborated
                if normalized(full).startswith(normalized(name) + " ") and grounded(adjacent, full)]
            if len(full_names) == 1:
                name = full_names[0]
        if is_recipient_name(name) and normalized(name) not in [normalized(item) for item in found]:
            found.append(name)
    return found[:20]
