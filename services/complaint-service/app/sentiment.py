"""Lightweight keyword sentiment + urgency (no ML cloud)."""
import re

CRITICAL = [
    "urgent", "emergency", "danger", "dangerous", "toxic", "flood", "overflow",
    "blocked drain", "sewage", "disease", "children", "hospital", "critical",
    "immediately", "hazard", "fire", "dead animal",
]
HIGH = [
    "smelly", "stinking", "garbage pile", "not cleaned", "days", "week",
    "angry", "frustrated", "worst", "horrible", "disgusting", "rats", "mosquito",
]
POSITIVE = ["thank", "resolved", "clean", "good", "appreciate", "happy", "improved"]


def analyze_text(text: str) -> dict:
    t = (text or "").lower()
    score = 0
    for w in POSITIVE:
        if w in t:
            score += 1
    for w in HIGH:
        if w in t:
            score -= 1
    for w in CRITICAL:
        if w in t:
            score -= 2

    if score <= -3:
        label, urgency = "very_negative", "critical"
    elif score <= -1:
        label, urgency = "negative", "high"
    elif score >= 2:
        label, urgency = "positive", "low"
    else:
        label, urgency = "neutral", "medium"

    # Exclamation / caps intensity
    if text.count("!") >= 2 or re.search(r"[A-Z]{6,}", text or ""):
        if urgency == "medium":
            urgency = "high"
        elif urgency == "high":
            urgency = "critical"
        score -= 1
        if label == "neutral":
            label = "negative"

    return {
        "sentiment_score": float(score),
        "sentiment_label": label,
        "urgency": urgency,
    }
