export interface AtsCategoryBreakdown {
  score: number;
  maxScore: number;
  reason: string;
  lostPoints: string[];
}

export interface AtsBreakdown {
  resumeCompleteness: AtsCategoryBreakdown;
  skills: AtsCategoryBreakdown;
  experience: AtsCategoryBreakdown;
  education: AtsCategoryBreakdown;
  projects: AtsCategoryBreakdown;
  aiBonus: AtsCategoryBreakdown;
}

export interface AtsResult {
  overallScore: number;
  label: string;
  confidence: number;
  breakdown: AtsBreakdown;
  topImprovements: string[];
}

export type AtsStatus = "idle" | "loading" | "success" | "error";
