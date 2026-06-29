import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ResultsChart } from "@/components/results-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { HiringRecommendation, Summary } from "@/lib/types";

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

const recommendationLabels: Record<HiringRecommendation, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  strong_hire: { label: "Strong Hire", variant: "default" },
  hire: { label: "Hire", variant: "secondary" },
  lean_hire: { label: "Lean Hire", variant: "outline" },
  no_hire: { label: "No Hire", variant: "destructive" },
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;

  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.id, id),
  });

  if (!session) {
    notFound();
  }

  const questions = await db.query.questions.findMany({
    where: eq(schema.questions.sessionId, id),
    orderBy: (q, { asc }) => [asc(q.sequenceNumber)],
    with: {
      answers: true,
      evaluations: true,
    },
  });

  const evaluations = await db.query.evaluations.findMany({
    where: eq(schema.evaluations.sessionId, id),
  });

  const finalEval = evaluations.find((e) => !e.questionId);
  const summary: Summary | null = finalEval?.feedbackJson
    ? JSON.parse(finalEval.feedbackJson)
    : null;

  return (
    <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Interview Results</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{session.mode}</Badge>
          <span>{session.topic}</span>
          <span>•</span>
          <span>{session.difficulty}</span>
          {session.overallScore !== null && (
            <>
              <span>•</span>
              <span>Score: {Math.round(session.overallScore)}%</span>
            </>
          )}
        </div>
      </div>

      {summary && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>{summary.overall_feedback}</p>

            <div className="text-center">
              <div className="text-5xl font-bold">{summary.overall_score}/100</div>
              <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
            </div>

            <ResultsChart summary={summary} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-green-700 mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {summary.final_strengths.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground">+ {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-red-700 mb-2">Areas to Improve</h4>
                <ul className="space-y-1">
                  {summary.final_weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-muted-foreground">- {w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {summary.hiring_recommendation && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm font-medium">Recommendation:</span>
                <Badge variant={recommendationLabels[summary.hiring_recommendation].variant}>
                  {recommendationLabels[summary.hiring_recommendation].label}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Question Timeline</h2>
        {questions.map((q, i) => {
          const answer = q.answers[0];
          const evaluation = q.evaluations[0];

          return (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Q{i + 1}</Badge>
                    <CardTitle className="text-base">{q.questionText}</CardTitle>
                  </div>
                  {evaluation && evaluation.score !== null && (
                    <Badge variant={evaluation.score >= 7 ? "default" : "secondary"}>
                      {Math.round(evaluation.score)}/10
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {answer && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Answer</p>
                    <p className="text-sm">{answer.content}</p>
                  </div>
                )}
                {evaluation && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Feedback</p>
                      <p className="text-sm">{evaluation.feedbackJson ? (JSON.parse(evaluation.feedbackJson).feedback ?? "") : ""}</p>
                    </div>
                    {evaluation.strengths !== null && (
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(evaluation.strengths).map((s: string, j: number) => (
                          <Badge key={j} variant="outline" className="text-xs">+ {s}</Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Link href="/">
          <Button>Practice Again</Button>
        </Link>
      </div>
    </main>
  );
}
