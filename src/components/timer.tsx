"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TimerProps {
  durationMinutes: number;
  onTimeUp?: () => void;
}

export function Timer({ durationMinutes, onTimeUp }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (durationMinutes <= 0) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (!calledRef.current) {
            calledRef.current = true;
            onTimeUp?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [durationMinutes, onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isLow = secondsLeft < 60;
  const isCritical = secondsLeft < 30;

  return (
    <Badge
      variant={isCritical ? "destructive" : isLow ? "secondary" : "outline"}
      className="font-mono text-sm px-3 py-1"
    >
      {display}
    </Badge>
  );
}
