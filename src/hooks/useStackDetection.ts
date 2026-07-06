import { useState } from "react";
import { api } from "../api/client";

export function useStackDetection(onDetected: (mergedNotes: string) => void) {
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = async (website: string, currentNotes: string) => {
    setDetecting(true);
    setError(null);
    try {
      const { matches } = await api.detectStack(website);
      if (matches.length === 0) {
        setError("No known technologies detected.");
        return;
      }
      onDetected(currentNotes ? `${currentNotes}\n${matches.join(", ")}` : matches.join(", "));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed.");
    } finally {
      setDetecting(false);
    }
  };

  return { detecting, error, detect };
}
