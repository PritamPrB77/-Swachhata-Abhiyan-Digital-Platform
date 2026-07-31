import { useMemo } from "react";

const CRITICAL = [
  "urgent", "emergency", "danger", "toxic", "flood", "sewage", "disease",
  "critical", "immediately", "hazard", "dead animal",
];
const HIGH = [
  "smelly", "stinking", "garbage", "angry", "frustrated", "worst",
  "horrible", "disgusting", "rats", "mosquito", "not cleaned",
];
const POSITIVE = ["thank", "resolved", "clean", "good", "appreciate", "happy"];

export type SentimentResult = {
  score: number;
  label: string;
  urgency: "low" | "medium" | "high" | "critical";
};

export function analyzeComplaintText(text: string): SentimentResult {
  const t = (text || "").toLowerCase();
  let score = 0;
  for (const w of POSITIVE) if (t.includes(w)) score += 1;
  for (const w of HIGH) if (t.includes(w)) score -= 1;
  for (const w of CRITICAL) if (t.includes(w)) score -= 2;

  let label = "neutral";
  let urgency: SentimentResult["urgency"] = "medium";
  if (score <= -3) {
    label = "very_negative";
    urgency = "critical";
  } else if (score <= -1) {
    label = "negative";
    urgency = "high";
  } else if (score >= 2) {
    label = "positive";
    urgency = "low";
  }

  if ((text.match(/!/g) || []).length >= 2) {
    if (urgency === "medium") urgency = "high";
    else if (urgency === "high") urgency = "critical";
  }

  return { score, label, urgency };
}

export function useLiveSentiment(text: string): SentimentResult {
  return useMemo(() => analyzeComplaintText(text), [text]);
}

export function urgencyColor(u: string) {
  switch (u) {
    case "critical":
      return "bg-red-600 text-white";
    case "high":
      return "bg-orange-500 text-white";
    case "low":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-amber-100 text-amber-900";
  }
}
