from recipient import recipients, normalized, grounded


def recipient_layout_text(blocks, corroborated):
    text = []
    for block in blocks:
        value = block["text"]
        partial = recipients(value)
        polygon = block.get("polygon", [])
        if len(partial) == 1 and len(polygon) >= 4:
            left = min(point[0] for point in polygon)
            top = min(point[1] for point in polygon)
            bottom = max(point[1] for point in polygon)
            height = max(1, bottom - top)
            matches = []
            for continuation in blocks:
                points = continuation.get("polygon", [])
                if continuation.get("imageIndex") != block.get("imageIndex") or len(points) < 4:
                    continue
                next_left = min(point[0] for point in points)
                next_top = min(point[1] for point in points)
                if abs(next_left - left) > height or not top + height / 2 <= next_top <= bottom + height:
                    continue
                adjacent = f"{value} {continuation['text']}"
                matches.extend(full for full in corroborated
                    if normalized(full).startswith(normalized(partial[0]) + " ") and grounded(adjacent, full))
            if len(set(matches)) == 1:
                value = f"Recipient name: {matches[0]}"
        text.append(value)
    return "\n".join(text)
