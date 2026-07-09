export interface AIResumeAnalysis {
  overallSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export type AIAnalysisStatus = "idle" | "loading" | "success" | "error";
