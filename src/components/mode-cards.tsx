"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InterviewMode } from "@/lib/types";
import { useRouter } from "next/navigation";

const modes: {
  mode: InterviewMode;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    mode: "technical",
    title: "Technical Interview",
    description: "Data structures, algorithms, system design, and coding",
    icon: "⚙",
  },
  {
    mode: "behavioral",
    title: "Behavioral Interview",
    description: "Leadership, teamwork, conflict resolution, and STAR stories",
    icon: "💬",
  },
  {
    mode: "general",
    title: "General Q&A",
    description: "Pick a topic and get quizzed on it",
    icon: "📚",
  },
  {
    mode: "role-specific",
    title: "Role-Specific Mock",
    description: "Paste a job description and get tailored questions",
    icon: "🎯",
  },
  {
    mode: "knowledge",
    title: "Knowledge Assessment",
    description: "Test your expertise in a specific domain",
    icon: "🧠",
  },
];

export function ModeCards() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {modes.map(({ mode, title, description, icon }) => (
        <Card
          key={mode}
          className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all"
          onClick={() => router.push(`/interview/start?mode=${mode}`)}
        >
          <CardHeader>
            <div className="text-3xl mb-2">{icon}</div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Adaptive • Real-time feedback • AI-powered
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
