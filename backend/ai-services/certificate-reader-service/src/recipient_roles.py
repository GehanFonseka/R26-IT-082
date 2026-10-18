import re
from recipient import normalized, recipients

def non_recipient_values(text):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    values = []
    cue = re.compile(r"^(?:(?:organization|issuer|issued by|instructors?|(?:course )?authors?|signed by|signature|taught by)\b\s*[:\-]?|by\s*:)\s*(.*)$", re.I)
    for index, line in enumerate(lines):
        match = cue.match(line)
        if match:
            value = match[1] or (lines[index + 1] if index + 1 < len(lines) else "")
            if value:
                values.append(normalized(value))
    return values

def is_non_recipient(name, text):
    value = normalized(name)
    positive = [normalized(item) for item in recipients(text)]
    return value not in positive and value in non_recipient_values(text)
