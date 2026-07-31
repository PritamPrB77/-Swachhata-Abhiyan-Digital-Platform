import { api } from "@/lib/api";

export type GameProfile = {
  user_id: number;
  display_name: string;
  role: string;
  ward: string;
  xp: number;
  points: number;
  level: number;
  tier: string;
  daily_streak: number;
  weekly_streak: number;
  xp_to_next_level: number;
  badges_count: number;
};

export type AwardResult = {
  awarded: boolean;
  xp_gained: number;
  points_gained: number;
  level: number;
  tier: string;
  new_badges: string[];
  message: string;
};

export async function awardAction(
  action: string,
  refType = "",
  refId = "",
  note = "",
): Promise<AwardResult | null> {
  try {
    return await api<AwardResult>("/api/gamification/award", {
      method: "POST",
      body: JSON.stringify({
        action,
        ref_type: refType,
        ref_id: String(refId),
        note,
      }),
    });
  } catch {
    return null;
  }
}

export async function dailyCheckin(): Promise<AwardResult | null> {
  try {
    return await api<AwardResult>("/api/gamification/checkin", { method: "POST" });
  } catch {
    return null;
  }
}

export async function fetchProfile(): Promise<GameProfile | null> {
  try {
    return await api<GameProfile>("/api/gamification/me");
  } catch {
    return null;
  }
}
