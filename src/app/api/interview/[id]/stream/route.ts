import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { streamInterviewResponse } from "@/lib/gemini";
import type { InterviewConfig } from "@/lib/types";

export const runtime = "nodejs";

async function getSessionConfig(sessionId: string): Promise<InterviewConfig | null> {
  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.id, sessionId),
  });
  if (!session) return null;
  return {
    mode: session.mode as InterviewConfig["mode"],
    topic: session.topic ?? "",
    difficulty: session.difficulty as InterviewConfig["difficulty"],
    questionCount: session.questionCount ?? 5,
    duration: session.duration ?? 30,
  };
}

async function getTranscript(sessionId: string) {
  const questions = await db.query.questions.findMany({
    where: eq(schema.questions.sessionId, sessionId),
    orderBy: (q, { asc }) => [asc(q.sequenceNumber)],
    with: {
      answers: true,
    },
  });

  const transcript: { role: "user" | "model"; text: string }[] = [];

  for (const q of questions) {
    transcript.push({ role: "model", text: q.questionText });
    for (const a of q.answers) {
      transcript.push({ role: "user", text: a.content });
    }
  }

  return transcript;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const config = await getSessionConfig(sessionId);
    if (!config) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let text = "";
    let audioBlob: Blob | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audioFile = formData.get("audio");
      if (audioFile instanceof Blob) {
        audioBlob = audioFile;
      }
      text = (formData.get("text") as string) ?? "";
    } else {
      const body = await request.json();
      text = body.text ?? "";
    }

    const transcript = await getTranscript(sessionId);

    if (text) {
      transcript.push({ role: "user", text });
    }

    const isFirstTurn = transcript.length === 0;

    if (isFirstTurn) {
      transcript.push({ role: "user", text: "Please start the interview." });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const gen = streamInterviewResponse(config, transcript, audioBlob);

          for await (const response of gen) {
            const data = JSON.stringify(response);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            if (response.type === "question") {
              const seq = transcript.filter((m) => m.role === "model").length + 1;

              const questionId = nanoid();
              await db.insert(schema.questions).values({
                id: questionId,
                sessionId,
                sequenceNumber: seq,
                questionText: response.question.text,
                type: response.question.type,
                skillCategory: response.question.skill_category,
                difficulty: response.question.difficulty,
              });

              if (response.evaluation) {
                const lastQuestion = await db.query.questions.findFirst({
                  where: eq(schema.questions.sessionId, sessionId),
                  orderBy: (q, { desc }) => [desc(q.sequenceNumber)],
                  offset: 1,
                });

                if (lastQuestion) {
                  await db.insert(schema.evaluations).values({
                    id: nanoid(),
                    sessionId,
                    questionId: lastQuestion.id,
                    score: response.evaluation.score,
                    feedbackJson: JSON.stringify(response.evaluation),
                    strengths: JSON.stringify(response.evaluation.strengths),
                    weaknesses: JSON.stringify(response.evaluation.weaknesses),
                    skillsAssessed: JSON.stringify(response.evaluation.skills_assessed),
                  });
                }
              }

              if (text) {
                const lastQuestion = await db.query.questions.findFirst({
                  where: eq(schema.questions.sessionId, sessionId),
                  orderBy: (q, { desc }) => [desc(q.sequenceNumber)],
                });
                if (lastQuestion) {
                  await db.insert(schema.answers).values({
                    id: nanoid(),
                    questionId: lastQuestion.id,
                    content: text,
                    audioUrl: null,
                  });
                }
              }

              transcript.push({
                role: "model",
                text: response.question.text,
              });
            }

            if (response.type === "done") {
              await db
                .update(schema.sessions)
                .set({
                  status: "completed",
                  overallScore: response.summary.overall_score,
                  summary: response.summary.overall_feedback,
                  completedAt: new Date().toISOString(),
                })
                .where(eq(schema.sessions.id, sessionId));

              const lastQuestion = await db.query.questions.findFirst({
                where: eq(schema.questions.sessionId, sessionId),
                orderBy: (q, { desc }) => [desc(q.sequenceNumber)],
              });

              if (lastQuestion) {
                await db.insert(schema.evaluations).values({
                  id: nanoid(),
                  sessionId,
                  questionId: lastQuestion.id,
                  score: response.evaluation.score,
                  feedbackJson: JSON.stringify(response.evaluation),
                  strengths: JSON.stringify(response.evaluation.strengths),
                  weaknesses: JSON.stringify(response.evaluation.weaknesses),
                  skillsAssessed: JSON.stringify(response.evaluation.skills_assessed),
                });
              }

              await db.insert(schema.evaluations).values({
                id: nanoid(),
                sessionId,
                score: response.summary.overall_score / 10,
                feedbackJson: JSON.stringify(response.summary),
                strengths: JSON.stringify(response.summary.final_strengths),
                weaknesses: JSON.stringify(response.summary.final_weaknesses),
                skillsAssessed: JSON.stringify(
                  Object.keys(response.summary.skill_breakdown)
                ),
              });
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          const errorData = JSON.stringify({ error: "Interview stream failed" });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
