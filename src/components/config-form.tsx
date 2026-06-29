"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useInterviewStream } from "@/hooks/use-interview-stream";
import type { InterviewConfig, InterviewMode, Difficulty } from "@/lib/types";

const modeLabels: Record<InterviewMode, string> = {
  technical: "Technical Interview",
  behavioral: "Behavioral Interview",
  general: "General Q&A",
  "role-specific": "Role-Specific Mock",
  knowledge: "Knowledge Assessment",
};

export function ConfigForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as InterviewMode) ?? "general";
  const { createSession } = useInterviewStream();

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const config: InterviewConfig = {
        mode,
        topic: topic || modeLabels[mode],
        difficulty,
        questionCount,
        duration,
      };
      const sessionId = await createSession(config);
      router.push(`/interview/${sessionId}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{modeLabels[mode]}</CardTitle>
        <CardDescription>Configure your interview session</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic">
            {mode === "role-specific"
              ? "Job Description URL or Paste"
              : "Topic / Role"}
          </Label>
          <Input
            id="topic"
            placeholder={
              mode === "role-specific"
                ? "Paste the job description..."
                : "e.g., React, System Design, Leadership..."
            }
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as Difficulty)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Number of Questions: {questionCount}</Label>
          <Slider
            min={1}
            max={15}
            step={1}
            value={questionCount}
            onValueChange={(v) => setQuestionCount(typeof v === "number" ? v : v[0])}
          />
        </div>

        <div className="space-y-2">
          <Label>Duration (minutes): {duration}</Label>
          <Slider
            min={5}
            max={90}
            step={5}
            value={duration}
            onValueChange={(v) => setDuration(typeof v === "number" ? v : v[0])}
          />
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? "Starting..." : "Start Interview"}
        </Button>
      </CardContent>
    </Card>
  );
}
