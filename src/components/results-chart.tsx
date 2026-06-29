"use client";

import type { Summary } from "@/lib/types";

interface ResultsChartProps {
  summary: Summary;
}

export function ResultsChart({ summary }: ResultsChartProps) {
  const skills = Object.entries(summary.skill_breakdown);

  if (skills.length === 0) return null;

  const maxScore = Math.max(...skills.map(([, v]) => v), 1);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Skill Breakdown
      </h3>
      <div className="space-y-2">
        {skills.map(([skill, score]) => (
          <div key={skill} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{skill.replace(/_/g, " ")}</span>
              <span className="font-mono">{Math.round(score)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(score / maxScore) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
