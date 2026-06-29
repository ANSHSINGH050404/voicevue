"use client";

import { useCallback, useRef } from "react";
import { useInterviewStore } from "@/store/interview-store";
import type { InterviewConfig } from "@/lib/types";

export function useInterviewStream() {
  const abortRef = useRef<AbortController | null>(null);
  const {
    sessionId,
    setSessionId,
    setStatus,
    addMessage,
    handleGeminiResponse,
    setError,
    status,
    setConfig,
  } = useInterviewStore();

  const createSession = useCallback(
    async (config: InterviewConfig): Promise<string> => {
      setStatus("connecting");
      setConfig(config);

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const err = await res.text();
        setError(err);
        setStatus("error");
        throw new Error(err);
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setStatus("idle");
      return data.sessionId;
    },
    [setSessionId, setStatus, setConfig, setError]
  );

  const submitAnswer = useCallback(
    async (text: string) => {
      if (!sessionId) return;
      setStatus("streaming");

      addMessage({ id: `user-${Date.now()}`, role: "user", content: text });

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const res = await fetch(`/api/interview/${sessionId}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const err = await res.text();
          setError(err);
          setStatus("error");
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setError("No response stream");
          setStatus("error");
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  setError(data.error);
                  setStatus("error");
                  return;
                }
                handleGeminiResponse(data);
              } catch {
                // skip malformed
              }
            }
          }
        }

        const currentStatus = useInterviewStore.getState().status;
        if (currentStatus === "streaming") {
          setStatus("idle");
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
          setStatus("error");
        }
      }
    },
    [sessionId, addMessage, handleGeminiResponse, setStatus, setError]
  );

  const submitAudio = useCallback(
    async (audioBlob: Blob) => {
      if (!sessionId) return;
      setStatus("streaming");

      addMessage({
        id: `user-${Date.now()}`,
        role: "user",
        content: "[Voice input submitted]",
      });

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const res = await fetch(`/api/interview/${sessionId}/stream`, {
          method: "POST",
          body: formData,
          signal: abort.signal,
        });

        if (!res.ok) {
          const err = await res.text();
          setError(err);
          setStatus("error");
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setError("No response stream");
          setStatus("error");
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  setError(data.error);
                  setStatus("error");
                  return;
                }
                handleGeminiResponse(data);
              } catch {
                // skip malformed
              }
            }
          }
        }

        const currentStatus = useInterviewStore.getState().status;
        if (currentStatus === "streaming") {
          setStatus("idle");
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
          setStatus("error");
        }
      }
    },
    [sessionId, addMessage, handleGeminiResponse, setStatus, setError]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, [setStatus]);

  return { createSession, submitAnswer, submitAudio, cancel, status };
}
