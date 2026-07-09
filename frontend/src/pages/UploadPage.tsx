import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { BaseLayout } from "@/layouts/BaseLayout";
import { useAuth } from "@/hooks/useAuth";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { FileCard } from "@/components/upload/FileCard";
import { ParsedResumePreview } from "@/components/upload/ParsedResumePreview";
import { AIAnalysisSection } from "@/components/upload/AIAnalysisSection";
import { AtsScoreSection } from "@/components/upload/AtsScoreSection";
import { JdMatchSection } from "@/components/upload/JdMatchSection";
import { RewriteSection } from "@/components/upload/RewriteSection";
import { InterviewSection } from "@/components/upload/InterviewSection";
import {
  uploadResume,
  analyzeResume,
  generateAtsScore,
  generateJdMatch,
  generateResumeRewrite,
  generateInterviewQuestions,
} from "@/services/resume.service";
import { validateResumeFile } from "@/utils/resumeValidation";
import { extractErrorMessage } from "@/utils/extractErrorMessage";
import { saveLatestReport, clearLatestReport, getLatestReport } from "@/utils/reportStorage";
import type { ResumeUploadResult, UploadedResumeMeta, UploadStatus } from "@/types/upload.types";
import type { AIAnalysisStatus, AIResumeAnalysis } from "@/types/ai.types";
import type { AtsResult, AtsStatus } from "@/types/ats.types";
import type { JdMatchResult, JdMatchStatus } from "@/types/jd.types";
import type { ResumeRewriteResult, RewriteStatus } from "@/types/rewrite.types";
import type { InterviewQuestionSet, InterviewStatus } from "@/types/interview.types";

const UploadPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [selectedAt, setSelectedAt] = useState<Date | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedMeta, setUploadedMeta] = useState<UploadedResumeMeta | null>(null);
  const [uploadResult, setUploadResult] = useState<ResumeUploadResult | null>(null);
  const [aiStatus, setAiStatus] = useState<AIAnalysisStatus>("idle");
  const [aiAnalysis, setAiAnalysis] = useState<AIResumeAnalysis | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [atsStatus, setAtsStatus] = useState<AtsStatus>("idle");
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [atsErrorMessage, setAtsErrorMessage] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jdStatus, setJdStatus] = useState<JdMatchStatus>("idle");
  const [jdResult, setJdResult] = useState<JdMatchResult | null>(null);
  const [jdErrorMessage, setJdErrorMessage] = useState<string | null>(null);
  const [rewriteStatus, setRewriteStatus] = useState<RewriteStatus>("idle");
  const [rewriteResult, setRewriteResult] = useState<ResumeRewriteResult | null>(null);
  const [rewriteErrorMessage, setRewriteErrorMessage] = useState<string | null>(null);
  const [interviewStatus, setInterviewStatus] = useState<InterviewStatus>("idle");
  const [interviewResult, setInterviewResult] = useState<InterviewQuestionSet | null>(null);
  const [interviewErrorMessage, setInterviewErrorMessage] = useState<string | null>(null);
  const [interviewAttempt, setInterviewAttempt] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized (stable reference across renders, since it only calls
  // setState setters) so it can safely be listed as a dependency of the
  // user-scoped restore effect below without causing that effect to
  // re-run on every render.
  const resetToIdle = useCallback(() => {
    setFile(null);
    setSelectedAt(null);
    setStatus("idle");
    setProgress(0);
    setErrorMessage(null);
    setUploadedMeta(null);
    setUploadResult(null);
    setAiStatus("idle");
    setAiAnalysis(null);
    setAiErrorMessage(null);
    setAtsStatus("idle");
    setAtsResult(null);
    setAtsErrorMessage(null);
    setJobDescription("");
    setJdStatus("idle");
    setJdResult(null);
    setJdErrorMessage(null);
    setRewriteStatus("idle");
    setRewriteResult(null);
    setRewriteErrorMessage(null);
    setInterviewStatus("idle");
    setInterviewResult(null);
    setInterviewErrorMessage(null);
    setInterviewAttempt(0);
  }, []);

  // Restore the latest saved workflow results for the current user, so
  // refreshing /upload doesn't force a re-upload. The raw `File` object
  // is never stored (and can't be), so `file`/`selectedAt` stay null —
  // the dropzone stays available for a fresh upload, while any
  // previously completed stages render below using the restored data.
  //
  // Keyed on user?.id (not just mount) so that if the authenticated
  // user changes — logout, then a different user logs in, without this
  // page ever unmounting — any in-memory results left over from the
  // previous user are cleared first via resetToIdle(), and only the
  // new user's own stored report (if any) is restored. With no user
  // logged in, getLatestReport returns null and the page simply stays
  // empty.
  useEffect(() => {
    const stored = getLatestReport(user?.id);
    if (!stored?.file) {
      resetToIdle();
      return;
    }

    setUploadedMeta(stored.file);
    setUploadResult({
      file: stored.file,
      parsedResume: stored.parsedResume,
      parseError: null,
    });
    setStatus("success");

    if (stored.analysis) {
      setAiAnalysis(stored.analysis);
      setAiStatus("success");
    }

    if (stored.ats) {
      setAtsResult(stored.ats);
      setAtsStatus("success");
    }

    if (stored.jdMatch) {
      setJdResult(stored.jdMatch);
      setJdStatus("success");
    }

    if (stored.rewrite) {
      setRewriteResult(stored.rewrite);
      setRewriteStatus("success");
    }

    if (stored.interview) {
      setInterviewResult(stored.interview);
      setInterviewStatus("success");
    }
  }, [user?.id, resetToIdle]);

  // Scroll to the section named by the URL hash (e.g. /upload#analysis,
  // /upload#interview) once its content is actually on the page. This
  // covers both the mount-time restore above and freshly generated
  // results within the same session -- either way, the target section
  // may not exist yet on the very first render, so this re-runs
  // whenever the hash or the relevant result data changes.
  useEffect(() => {
    if (!location.hash) return;

    const targetId = location.hash.slice(1);
    const timeoutId = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash, uploadResult, interviewResult]);

  const startUpload = useCallback(async (selectedFile: File) => {
    setStatus("uploading");
    setProgress(0);
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await uploadResume(selectedFile, setProgress, controller.signal);
      setUploadedMeta(result.file);
      setUploadResult(result);
      setStatus("success");
      saveLatestReport(user?.id, { file: result.file, parsedResume: result.parsedResume });
    } catch (error) {
      if (controller.signal.aborted) {
        // Deliberate cancellation — reset quietly instead of showing an error.
        setFile(null);
        setSelectedAt(null);
        setStatus("idle");
        setProgress(0);
        return;
      }
      setErrorMessage(extractErrorMessage(error, "Upload failed. Please try again."));
      setStatus("error");
    }
  }, [user?.id]);

  const handleFileSelected = (selectedFile: File) => {
    const validationError = validateResumeFile(selectedFile);

    setFile(selectedFile);
    setSelectedAt(new Date());
    setUploadedMeta(null);
    setUploadResult(null);
    setAiStatus("idle");
    setAiAnalysis(null);
    setAiErrorMessage(null);
    setAtsStatus("idle");
    setAtsResult(null);
    setAtsErrorMessage(null);
    setJobDescription("");
    setJdStatus("idle");
    setJdResult(null);
    setJdErrorMessage(null);
    setRewriteStatus("idle");
    setRewriteResult(null);
    setRewriteErrorMessage(null);
    setInterviewStatus("idle");
    setInterviewResult(null);
    setInterviewErrorMessage(null);
    setInterviewAttempt(0);

    if (validationError) {
      setErrorMessage(validationError);
      setStatus("error");
      return;
    }

    clearLatestReport(user?.id);
    startUpload(selectedFile);
  };

  const handleAnalyze = useCallback(async () => {
    if (!uploadResult?.parsedResume) return;

    setAiStatus("loading");
    setAiErrorMessage(null);
    setAtsStatus("idle");
    setAtsResult(null);
    setAtsErrorMessage(null);
    setJdStatus("idle");
    setJdResult(null);
    setJdErrorMessage(null);
    setRewriteStatus("idle");
    setRewriteResult(null);
    setRewriteErrorMessage(null);
    setInterviewStatus("idle");
    setInterviewResult(null);
    setInterviewErrorMessage(null);
    setInterviewAttempt(0);

    try {
      const analysis = await analyzeResume(uploadResult.parsedResume);
      setAiAnalysis(analysis);
      setAiStatus("success");
      saveLatestReport(user?.id, { analysis });
    } catch (error) {
      setAiErrorMessage(extractErrorMessage(error, "Analysis failed. Please try again."));
      setAiStatus("error");
    }
  }, [uploadResult, user?.id]);

  const handleGenerateAts = useCallback(async () => {
    if (!uploadResult?.parsedResume || !aiAnalysis) return;

    setAtsStatus("loading");
    setAtsErrorMessage(null);
    setJdStatus("idle");
    setJdResult(null);
    setJdErrorMessage(null);
    setRewriteStatus("idle");
    setRewriteResult(null);
    setRewriteErrorMessage(null);
    setInterviewStatus("idle");
    setInterviewResult(null);
    setInterviewErrorMessage(null);
    setInterviewAttempt(0);

    try {
      const result = await generateAtsScore(uploadResult.parsedResume, aiAnalysis);
      setAtsResult(result);
      setAtsStatus("success");
      saveLatestReport(user?.id, { ats: result });
    } catch (error) {
      setAtsErrorMessage(extractErrorMessage(error, "ATS scoring failed. Please try again."));
      setAtsStatus("error");
    }
  }, [uploadResult, aiAnalysis, user?.id]);

  const handleGenerateJdMatch = useCallback(async () => {
    if (!uploadResult?.parsedResume || !aiAnalysis || !atsResult) return;

    const trimmedJD = jobDescription.trim();
    if (!trimmedJD) {
      setJdErrorMessage("Please paste a job description before analyzing.");
      setJdStatus("error");
      return;
    }

    if (trimmedJD.length < 50 || trimmedJD.split(/\s+/).filter(Boolean).length < 10) {
      setJdErrorMessage("Job description is too short to analyze. Please paste the full job description.");
      setJdStatus("error");
      return;
    }

    setJdStatus("loading");
    setJdErrorMessage(null);
    setRewriteStatus("idle");
    setRewriteResult(null);
    setRewriteErrorMessage(null);
    setInterviewStatus("idle");
    setInterviewResult(null);
    setInterviewErrorMessage(null);
    setInterviewAttempt(0);

    try {
      const result = await generateJdMatch(uploadResult.parsedResume, atsResult, aiAnalysis, trimmedJD);
      setJdResult(result);
      setJdStatus("success");
      saveLatestReport(user?.id, { jdMatch: result });
    } catch (error) {
      setJdErrorMessage(extractErrorMessage(error, "Job description matching failed. Please try again."));
      setJdStatus("error");
    }
  }, [uploadResult, aiAnalysis, atsResult, jobDescription, user?.id]);

  const handleGenerateRewrite = useCallback(async () => {
    if (!uploadResult?.parsedResume || !aiAnalysis || !atsResult || !jdResult) return;

    setRewriteStatus("loading");
    setRewriteErrorMessage(null);
    setInterviewStatus("idle");
    setInterviewResult(null);
    setInterviewErrorMessage(null);
    setInterviewAttempt(0);

    try {
      const result = await generateResumeRewrite(uploadResult.parsedResume, aiAnalysis, atsResult, jdResult);
      setRewriteResult(result);
      setRewriteStatus("success");
      saveLatestReport(user?.id, { rewrite: result });
    } catch (error) {
      setRewriteErrorMessage(extractErrorMessage(error, "Resume rewrite failed. Please try again."));
      setRewriteStatus("error");
    }
  }, [uploadResult, aiAnalysis, atsResult, jdResult, user?.id]);

  const handleGenerateInterview = useCallback(async () => {
    if (!uploadResult?.parsedResume || !aiAnalysis || !atsResult || !jdResult || !rewriteResult) return;

    setInterviewStatus("loading");
    setInterviewErrorMessage(null);

    const nextAttempt = interviewAttempt + 1;

    try {
      const result = await generateInterviewQuestions(
        uploadResult.parsedResume,
        aiAnalysis,
        atsResult,
        jdResult,
        rewriteResult,
        { attempt: nextAttempt, previousQuestions: interviewResult }
      );
      setInterviewResult(result);
      setInterviewStatus("success");
      setInterviewAttempt(nextAttempt);
      saveLatestReport(user?.id, { interview: result });
    } catch (error) {
      setInterviewErrorMessage(
        extractErrorMessage(error, "Interview question generation failed. Please try again.")
      );
      setInterviewStatus("error");
    }
  }, [uploadResult, aiAnalysis, atsResult, jdResult, rewriteResult, interviewAttempt, interviewResult, user?.id]);

  const handleRemove = () => {
    abortControllerRef.current?.abort();
    resetToIdle();
  };

  const handleRetry = () => {
    if (file) {
      startUpload(file);
    }
  };

  return (
    <BaseLayout>
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-widest text-signal">
            Resume upload
          </span>
          <h1 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
            Upload your resume
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            PDF or DOCX, up to 10MB. We'll take it from here.
          </p>

          <div className="mt-8">
            {file && selectedAt ? (
              <FileCard
                file={file}
                status={status}
                progress={progress}
                errorMessage={errorMessage}
                uploadedMeta={uploadedMeta}
                selectedAt={selectedAt}
                onRemove={handleRemove}
                onUploadAnother={resetToIdle}
                onRetry={handleRetry}
              />
            ) : (
              <UploadDropzone onFileSelected={handleFileSelected} />
            )}
          </div>

          {status === "success" && uploadResult?.parseError && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {uploadResult.parseError}
            </p>
          )}
        </div>

        {status === "success" && uploadResult?.parsedResume && (
          <div id="analysis">
            <ParsedResumePreview parsedResume={uploadResult.parsedResume} />
            <AIAnalysisSection
              status={aiStatus}
              analysis={aiAnalysis}
              errorMessage={aiErrorMessage}
              onAnalyze={handleAnalyze}
              onRetry={handleAnalyze}
            />
            {aiStatus === "success" && aiAnalysis && (
              <AtsScoreSection
                status={atsStatus}
                result={atsResult}
                errorMessage={atsErrorMessage}
                onGenerate={handleGenerateAts}
                onRetry={handleGenerateAts}
              />
            )}
            {atsStatus === "success" && atsResult && (
              <JdMatchSection
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
                status={jdStatus}
                result={jdResult}
                errorMessage={jdErrorMessage}
                onAnalyze={handleGenerateJdMatch}
                onRetry={handleGenerateJdMatch}
              />
            )}
            {jdStatus === "success" && jdResult && (
              <RewriteSection
                status={rewriteStatus}
                result={rewriteResult}
                errorMessage={rewriteErrorMessage}
                onGenerate={handleGenerateRewrite}
                onRetry={handleGenerateRewrite}
              />
            )}
            {rewriteStatus === "success" && rewriteResult && (
              <div id="interview">
                <InterviewSection
                  status={interviewStatus}
                  result={interviewResult}
                  errorMessage={interviewErrorMessage}
                  onGenerate={handleGenerateInterview}
                  onRetry={handleGenerateInterview}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default UploadPage;
