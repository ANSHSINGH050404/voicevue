import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import type { InterviewMode, Difficulty } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, topic, difficulty, questionCount, duration } = body as {
      mode: InterviewMode;
      topic: string;
      difficulty: Difficulty;
      questionCount: number;
      duration: number;
    };

    const cookieStore = await cookies();
    let sessionToken = cookieStore.get("session_token")?.value;
    if (!sessionToken) {
      sessionToken = nanoid();
    }

    const sessionId = nanoid();

    await db.insert(schema.sessions).values({
      id: sessionId,
      mode,
      topic: topic || null,
      difficulty,
      questionCount: questionCount || 5,
      duration: duration || null,
      status: "in_progress",
      sessionToken,
    });

    const response = NextResponse.json({ sessionId });
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
