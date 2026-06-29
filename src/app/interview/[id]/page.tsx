"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ChatMessage } from "@/components/chat-message";
import { MicButton } from "@/components/mic-button";
import { Timer } from "@/components/timer";
import { useInterviewStore } from "@/store/interview-store";
import { useInterviewStream } from "@/hooks/use-interview-stream";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { Send, Loader2 } from "lucide-react";
import Link from "next/link";

export default function InterviewPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const messages = useInterviewStore((s) => s.messages);
  const config = useInterviewStore((s) => s.config);
  const status = useInterviewStore((s) => s.status);
  const setSessionId = useInterviewStore((s) => s.setSessionId);
  const summary = useInterviewStore((s) => s.summary);
  const currentQuestion = useInterviewStore((s) => s.currentQuestion);

  const { submitAnswer, submitAudio, cancel } = useInterviewStream();
  const { startRecording, stopRecording, isRecording } = useMediaRecorder();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (sessionId && !initialized) {
      setSessionId(sessionId);
      setInitialized(true);
    }
  }, [sessionId, setSessionId, initialized]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || status === "streaming") return;
    submitAnswer(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch {
      // permission denied or no mic
    }
  };

  const handleStopRecording = async () => {
    try {
      const blob = await stopRecording();
      await submitAudio(blob);
    } catch {
      // recording was empty or cancelled
    }
  };

  const handleTimeUp = () => {
    cancel();
  };

  const isLoading = status === "streaming" || status === "connecting";

  if (status === "completed" && summary) {
    return (
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Interview Complete</h1>
          <p className="text-lg text-muted-foreground">
            {summary.overall_feedback}
          </p>
          <div className="text-6xl font-bold">{summary.overall_score}/100</div>
          <div className="flex justify-center gap-2">
            {summary.final_strengths.map((s, i) => (
              <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                + {s}
              </span>
            ))}
            {summary.final_weaknesses.map((w, i) => (
              <span key={i} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                - {w}
              </span>
            ))}
          </div>
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/">
              <Button>Practice Again</Button>
            </Link>
            <Link href={`/results/${sessionId}`}>
              <Button variant="outline">View Full Results</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-4 flex flex-col max-w-3xl">
      <div className="flex items-center justify-between py-3 border-b mb-4">
        <div className="text-sm font-medium">
          {config?.topic ?? "Interview"}
        </div>
        <div className="flex items-center gap-3">
          {currentQuestion && (
            <span className="text-sm text-muted-foreground">
              {messages.filter((m) => m.role === "user").length + 1} / {config?.questionCount ?? "?"}
            </span>
          )}
          {config?.duration && config.duration > 0 && (
            <Timer durationMinutes={config.duration} onTimeUp={handleTimeUp} />
          )}
        </div>
      </div>

      <div className="flex-1 mb-4 px-2 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-1">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg mb-2">Your interview is ready</p>
              <p className="text-sm">
                The first question will appear when you click Start.
              </p>
              <Button
                className="mt-4"
                onClick={() => submitAnswer("Start the interview")}
              >
                Start Interview
              </Button>
            </div>
          )}
          {messages.length === 0 && isLoading && (
            <div className="text-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Starting your interview...</p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              evaluation={msg.evaluation}
            />
          ))}
          {isLoading && messages.length > 0 && (
            <div className="flex justify-start mb-4">
              <div className="bg-card rounded-lg p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {status !== "completed" && (
        <div className="border-t pt-4 pb-6">
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              className="min-h-[60px] max-h-[120px] resize-none"
              placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <div className="flex gap-2 pb-1">
              <MicButton
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
