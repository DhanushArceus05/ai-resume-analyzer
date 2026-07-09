export interface UploadedResumeMeta {
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
}

export interface ResumeBasicInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  links: string[];
}

export interface ResumeSections {
  summary: string | null;
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
  certifications: string[];
  languages: string[];
}

export interface ResumeMetadata {
  wordCount: number;
  characterCount: number;
  parsedAt: string;
}

export interface ParsedResume {
  rawText: string;
  basicInfo: ResumeBasicInfo;
  sections: ResumeSections;
  metadata: ResumeMetadata;
}

export interface ResumeUploadResult {
  file: UploadedResumeMeta;
  parsedResume: ParsedResume | null;
  parseError: string | null;
}

export type UploadStatus = "idle" | "selected" | "uploading" | "success" | "error";
