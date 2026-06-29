import { GoogleGenerativeAI, SchemaType, type GenerateContentStreamResult } from "@google/generative-ai";
import { loadPrompt } from "./prompts/loader";
import type { GeminiResponse, InterviewMode, InterviewConfig } from "./types";

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAI(apiKey);
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    type: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["question", "done"],
    },
    evaluation: {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.NUMBER },
        feedback: { type: SchemaType.STRING },
        strengths: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        weaknesses: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        skills_assessed: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
    },
    question: {
      type: SchemaType.OBJECT,
      properties: {
        text: { type: SchemaType.STRING },
        type: {
          type: SchemaType.STRING,
          format: "enum",
          enum: ["opening", "followup", "probing", "closing"],
        },
        skill_category: { type: SchemaType.STRING },
        difficulty: {
          type: SchemaType.STRING,
          format: "enum",
          enum: ["easy", "medium", "hard"],
        },
      },
    },
    progress: {
      type: SchemaType.OBJECT,
      properties: {
        current: { type: SchemaType.NUMBER },
        total: { type: SchemaType.NUMBER },
      },
    },
    summary: {
      type: SchemaType.OBJECT,
      properties: {
        overall_score: { type: SchemaType.NUMBER },
        overall_feedback: { type: SchemaType.STRING },
        final_strengths: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        final_weaknesses: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        hiring_recommendation: {
          type: SchemaType.STRING,
          format: "enum",
          enum: ["strong_hire", "hire", "lean_hire", "no_hire"],
        },
        skill_breakdown: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
    },
  },
  required: ["type"],
};

function assembleSystemPrompt(mode: InterviewMode, config: InterviewConfig): string {
  const base = loadPrompt("base.md");
  const modePrompt = loadPrompt(`${mode}.md`);

  return `${base}

${modePrompt}

## Session Configuration
- Mode: ${mode}
- Topic/Role: ${config.topic}
- Difficulty: ${config.difficulty}
- Number of Questions: ${config.questionCount}
- Duration: ${config.duration} minutes

Begin the interview now.`;
}

function assembleHistory(transcript: { role: "user" | "model"; text: string }[]) {
  return transcript.map((entry) => ({
    role: entry.role,
    parts: [{ text: entry.text }],
  }));
}

export async function* streamInterviewResponse(
  config: InterviewConfig,
  transcript: { role: "user" | "model"; text: string }[],
  audioBlob?: Blob
): AsyncGenerator<GeminiResponse> {
  const systemPrompt = assembleSystemPrompt(config.mode, config);

  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as never,
      temperature: 0.7,
      maxOutputTokens: 2048,
    } as never,
  });

  const history = assembleHistory(transcript);

  const chat = model.startChat({
    history,
  });

  let result: GenerateContentStreamResult;
  if (audioBlob) {
    const base64Audio = Buffer.from(await audioBlob.arrayBuffer()).toString("base64");
    result = await chat.sendMessageStream([
      { text: "Here is my answer (audio):" },
      {
        inlineData: {
          mimeType: audioBlob.type || "audio/webm",
          data: base64Audio,
        },
      },
    ]);
  } else {
    const lastUserMessage = transcript.filter((m) => m.role === "user").pop()?.text ?? "";
    result = await chat.sendMessageStream(lastUserMessage);
  }

  let buffer = "";
  for await (const chunk of result.stream) {
    buffer += chunk.text();
    try {
      const parsed = JSON.parse(buffer) as GeminiResponse;
      buffer = "";
      yield parsed;
    } catch {
      // incomplete JSON, keep buffering
    }
  }

  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer) as GeminiResponse;
    } catch {
      // discard unparseable tail
    }
  }
}
