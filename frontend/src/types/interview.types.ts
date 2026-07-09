export type QuestionDifficulty = "Easy" | "Medium" | "Hard";

export interface InterviewQuestion {
  question: string;
  whyAsked: string;
  difficulty: QuestionDifficulty;
}

export interface InterviewQuestionSet {
  technical: InterviewQuestion[];
  project: InterviewQuestion[];
  behavioral: InterviewQuestion[];
  hr: InterviewQuestion[];
}

export type InterviewStatus = "idle" | "loading" | "success" | "error";
