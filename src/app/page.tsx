import { ModeCards } from "@/components/mode-cards";

export default function Home() {
  return (
    <main className="flex-1 container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          AI Interview Agent
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Practice interviews with an adaptive AI interviewer. Get real-time
          feedback, skill analysis, and personalized improvement suggestions.
        </p>
      </div>
      <ModeCards />
    </main>
  );
}
