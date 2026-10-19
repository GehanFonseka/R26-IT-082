export function attritionScore(model) {
  const value = model?.riskScore ?? model?.risk_score;
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
    && Number(value) >= 0 && Number(value) <= 100 ? Number(value) : null;
}

export function attritionModels(result) {
  return {
    attrition: result?.models ? result.models.attrition : result?.target === "EarlyAttrition" ? null : result,
    earlyAttrition: result?.models?.earlyAttrition,
  };
}
