import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await db.query.sessions.findFirst({
      where: eq(schema.sessions.id, id),
      with: {
        questions: {
          with: {
            answers: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const evaluations = await db.query.evaluations.findMany({
      where: eq(schema.evaluations.sessionId, id),
    });

    return NextResponse.json({ session, evaluations });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await db
      .update(schema.sessions)
      .set({
        status: body.status,
        overallScore: body.overallScore,
        summary: body.summary,
        completedAt: body.status === "completed" ? new Date().toISOString() : undefined,
      })
      .where(eq(schema.sessions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
