import { apiClient } from "./apiClient";
import type { ApiSuccessResponse } from "@/types/api.types";
import type { ParsedResume, ResumeUploadResult } from "@/types/upload.types";
import type { AIResumeAnalysis } from "@/types/ai.types";
import type { AtsResult } from "@/types/ats.types";
import type { JdMatchResult } from "@/types/jd.types";
import type { ResumeRewriteResult } from "@/types/rewrite.types";
import type { InterviewQuestionSet } from "@/types/interview.types";

export const uploadResume = async (
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<ResumeUploadResult> => {
  const formData = new FormData();
  formData.append("resume", file);

  const { data } = await apiClient.post<ApiSuccessResponse<ResumeUploadResult>>(
    "/resume/upload",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      signal,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    }
  );

  return data.data as ResumeUploadResult;
};

export const analyzeResume = async (parsedResume: ParsedResume): Promise<AIResumeAnalysis> => {
  const { data } = await apiClient.post<ApiSuccessResponse<{ analysis: AIResumeAnalysis }>>(
    "/resume/analyze",
    { parsedResume }
  );

  return (data.data as { analysis: AIResumeAnalysis }).analysis;
};

export const generateAtsScore = async (
  parsedResume: ParsedResume,
  analysis: AIResumeAnalysis
): Promise<AtsResult> => {
  const { data } = await apiClient.post<ApiSuccessResponse<{ ats: AtsResult }>>("/resume/ats", {
    parsedResume,
    analysis,
  });

  return (data.data as { ats: AtsResult }).ats;
};

export const generateJdMatch = async (
  parsedResume: ParsedResume,
  ats: AtsResult,
  analysis: AIResumeAnalysis,
  jobDescription: string
): Promise<JdMatchResult> => {
  const { data } = await apiClient.post<ApiSuccessResponse<{ match: JdMatchResult }>>(
    "/resume/jd-match",
    { parsedResume, ats, analysis, jobDescription }
  );

  return (data.data as { match: JdMatchResult }).match;
};

export const generateResumeRewrite = async (
  parsedResume: ParsedResume,
  analysis: AIResumeAnalysis,
  ats: AtsResult,
  jdMatch: JdMatchResult
): Promise<ResumeRewriteResult> => {
  const { data } = await apiClient.post<ApiSuccessResponse<{ rewrite: ResumeRewriteResult }>>(
    "/resume/rewrite",
    { parsedResume, analysis, ats, jdMatch }
  );

  return (data.data as { rewrite: ResumeRewriteResult }).rewrite;
};

export const generateInterviewQuestions = async (
  parsedResume: ParsedResume,
  analysis: AIResumeAnalysis,
  ats: AtsResult,
  jdMatch: JdMatchResult,
  rewrite: ResumeRewriteResult,
  regeneration?: { attempt: number; previousQuestions: InterviewQuestionSet | null }
): Promise<InterviewQuestionSet> => {
  const { data } = await apiClient.post<ApiSuccessResponse<{ interview: InterviewQuestionSet }>>(
    "/resume/interview",
    { parsedResume, analysis, ats, jdMatch, rewrite, regeneration }
  );

  return (data.data as { interview: InterviewQuestionSet }).interview;
};
