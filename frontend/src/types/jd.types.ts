export interface JdMatchResult {
  matchScore: number;
  label: string;
  matchedSkills: string[];
  missingSkills: string[];
  keywordOverlap: string[];
  recommendations: string[];
}

export type JdMatchStatus = "idle" | "loading" | "success" | "error";
