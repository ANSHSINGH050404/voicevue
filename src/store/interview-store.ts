import { create } from "zustand";
import type { GeminiResponse, InterviewConfig, Evaluation, Question, Progress, Summary } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  evaluation?: Evaluation;
  question?: Question;
}

interface InterviewState {
  sessionId: string | null;
  config: InterviewConfig | null;
  messages: ChatMessage[];
  status: "idle" | "connecting" | "streaming" | "completed" | "error";
  currentEvaluation: Evaluation | null;
  currentQuestion: Question | null;
  progress: Progress | null;
  summary: Summary | null;
  error: string | null;
  isRecording: boolean;

  setSessionId: (id: string) => void;
  setConfig: (config: InterviewConfig) => void;
  addMessage: (msg: ChatMessage) => void;
  setStatus: (status: InterviewState["status"]) => void;
  setCurrentEvaluation: (e: Evaluation | null) => void;
  setCurrentQuestion: (q: Question | null) => void;
  setProgress: (p: Progress | null) => void;
  setSummary: (s: Summary | null) => void;
  setError: (e: string | null) => void;
  setIsRecording: (r: boolean) => void;
  handleGeminiResponse: (response: GeminiResponse) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  config: null,
  messages: [],
  status: "idle" as const,
  currentEvaluation: null,
  currentQuestion: null,
  progress: null,
  summary: null,
  error: null,
  isRecording: false,
};

export const useInterviewStore = create<InterviewState>((set, get) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),
  setConfig: (config) => set({ config }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setStatus: (status) => set({ status }),
  setCurrentEvaluation: (e) => set({ currentEvaluation: e }),
  setCurrentQuestion: (q) => set({ currentQuestion: q }),
  setProgress: (p) => set({ progress: p }),
  setSummary: (s) => set({ summary: s }),
  setError: (e) => set({ error: e }),
  setIsRecording: (r) => set({ isRecording: r }),

  handleGeminiResponse: (response) => {
    const state = get();
    if (response.type === "question") {
      if (response.evaluation) {
        set({ currentEvaluation: response.evaluation });
      }
      set({ currentQuestion: response.question, progress: response.progress });
      const msgId = `q-${response.progress.current}-${Date.now()}`;
      const msgs = state.messages;
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        set((s) => ({
          messages: s.messages.map((m, i) =>
            i === s.messages.length - 1
              ? { ...m, evaluation: response.evaluation, question: response.question }
              : m
          ),
        }));
      } else {
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: msgId,
              role: "assistant",
              content: response.question.text,
              evaluation: response.evaluation,
              question: response.question,
            },
          ],
        }));
      }
    } else if (response.type === "done") {
      set({
        status: "completed",
        currentEvaluation: response.evaluation,
        summary: response.summary,
      });
      set((s) => ({
        messages: [
          ...s.messages,
          {
            id: `summary-${Date.now()}`,
            role: "assistant",
            content: response.summary.overall_feedback,
            evaluation: response.evaluation,
          },
        ],
      }));
    }
  },

  reset: () => set(initialState),
}));
