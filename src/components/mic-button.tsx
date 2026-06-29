"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useInterviewStore } from "@/store/interview-store";

interface MicButtonProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export function MicButton({
  onStartRecording,
  onStopRecording,
  disabled,
}: MicButtonProps) {
  const isRecording = useInterviewStore((s) => s.isRecording);
  const status = useInterviewStore((s) => s.status);

  const handleClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const isLoading = status === "streaming" || status === "connecting";

  return (
    <Button
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      className="rounded-full w-12 h-12"
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}
