"use client";

import { useRef, useCallback, useState } from "react";

export function useMediaRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(mediaStream);

    const recorder = new MediaRecorder(mediaStream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        reject(new Error("No active recording"));
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        stream?.getTracks().forEach((t) => t.stop());
        setStream(null);
        setIsRecording(false);
        resolve(blob);
      };

      recorder.stop();
    });
  }, [stream]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    chunksRef.current = [];
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsRecording(false);
  }, [stream]);

  return { startRecording, stopRecording, cancelRecording, isRecording };
}
