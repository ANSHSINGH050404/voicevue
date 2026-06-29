import { Suspense } from "react";
import { ConfigForm } from "@/components/config-form";

export default function InterviewStartPage() {
  return (
    <main className="flex-1 container mx-auto px-4 py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <ConfigForm />
      </Suspense>
    </main>
  );
}
