import re
from recipient import normalized

def words(name):
    return re.findall(r"[^\W\d_]+", normalized(name))

def expands(short, full):
    first, second = words(short), words(full)
    return len(first) >= 2 and len(first) == len(second) and any(len(word) == 1 for word in first) \
        and any(len(word) > 1 for word in first) and all(len(word) > 1 for word in second) \
        and all(b.startswith(a) if len(a) == 1 else a == b for a, b in zip(first, second))

def distinct_recipients(names):
    unique = list(dict.fromkeys(names))
    return [name for name in unique if sum(expands(name, full) for full in unique) != 1]
