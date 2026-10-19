from typing import Any

import torch


LEVELS = ["Beginner", "Intermediate", "Advanced"]
OUTPUTS = ["project", "skill", "alignment"]


def decode_outputs(logits: torch.Tensor, items: list[dict[str, Any]], years: list[float], calibration: dict[str, float]) -> list[dict[str, Any]]:
    if logits.ndim != 2 or logits.shape[1] < 12:
        raise ValueError(f"V5 checkpoint must return 12 logits, found {tuple(logits.shape)}")
    scores = torch.sigmoid(logits[:, :3]) * 100
    probabilities = torch.softmax(logits[:, 3:].reshape(-1, 3, 3), dim=-1)
    for index, name in enumerate(OUTPUTS):
        probabilities[:, index, 2] *= float(calibration.get(f"{name}_advanced", 1.0))
    probabilities = probabilities / probabilities.sum(dim=-1, keepdim=True).clamp_min(1e-12)
    predictions = probabilities.argmax(dim=-1)
    results = []
    for index, item in enumerate(items):
        levels = [LEVELS[int(value)] for value in predictions[index]]
        confidence = [float(probabilities[index, output, predictions[index, output]]) for output in range(3)]
        results.append({
            "skill": str(item.get("skill") or "").strip(), "projectStrength": round(float(scores[index, 0]), 2),
            "skillEvidenceStrength": round(float(scores[index, 1]), 2), "experienceProjectAlignment": round(float(scores[index, 2]), 2),
            "projectStrengthLevel": levels[0], "skillStrengthLevel": levels[1], "alignmentLevel": levels[2],
            "projectStrengthConfidence": round(confidence[0], 4), "skillStrengthConfidence": round(confidence[1], 4),
            "alignmentConfidence": round(confidence[2], 4), "skillProficiency": levels[1], "skillProficiencyConfidence": round(confidence[1], 4),
            "experienceYears": round(float(years[index]), 2), "modelVersion": "v5", "scoreType": "sigmoid-percent",
        })
    return results
