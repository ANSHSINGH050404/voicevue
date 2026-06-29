"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Evaluation } from "@/lib/types";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  evaluation?: Evaluation | null;
}

export function ChatMessage({ role, content, evaluation }: ChatMessageProps) {
  const isUser = role === "user" || role === "system";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? "order-1" : "order-1"}`}>
        <Card className={`p-4 ${isUser ? "bg-primary text-primary-foreground" : "bg-card"}`}>
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </Card>
        {evaluation && role === "assistant" && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={evaluation.score >= 7 ? "default" : evaluation.score >= 4 ? "secondary" : "destructive"}>
                Score: {evaluation.score}/10
              </Badge>
            </div>
            {evaluation.feedback && (
              <p className="text-xs text-muted-foreground">{evaluation.feedback}</p>
            )}
            {evaluation.strengths.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {evaluation.strengths.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    + {s}
                  </Badge>
                ))}
              </div>
            )}
            {evaluation.weaknesses.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {evaluation.weaknesses.map((w, i) => (
                  <Badge key={i} variant="outline" className="text-xs text-destructive">
                    - {w}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
