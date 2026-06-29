export type InterviewMode = "technical" | "behavioral" | "general" | "role-specific" | "knowledge";

export type QuestionType = "opening" | "followup" | "probing" | "closing";
export type Difficulty = "easy" | "medium" | "hard";
export type SessionStatus = "in_progress" | "completed";
export type HiringRecommendation = "strong_hire" | "hire" | "lean_hire" | "no_hire";

export interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  skills_assessed: string[];
}

export interface Question {
  text: string;
  type: QuestionType;
  skill_category: string;
  difficulty: Difficulty;
}

export interface Progress {
  current: number;
  total: number;
}

export interface Summary {
  overall_score: number;
  overall_feedback: string;
  final_strengths: string[];
  final_weaknesses: string[];
  hiring_recommendation: HiringRecommendation;
  skill_breakdown: Record<string, number>;
}

export interface GeminiQuestionResponse {
  type: "question";
  evaluation?: Evaluation;
  question: Question;
  progress: Progress;
}

export interface GeminiDoneResponse {
  type: "done";
  evaluation: Evaluation;
  summary: Summary;
}

export type GeminiResponse = GeminiQuestionResponse | GeminiDoneResponse;

export interface InterviewConfig {
  mode: InterviewMode;
  topic: string;
  difficulty: Difficulty;
  questionCount: number;
  duration: number;
}

export interface SSEEvent {
  event: "evaluation" | "question" | "progress" | "done" | "error";
  data: unknown;
}
