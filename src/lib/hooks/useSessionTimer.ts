import { useEffect, useRef } from "react";
import axios from "axios";

interface SessionData {
  userId: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
}

export function useSessionTimer(userId: string | null) {
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!userId) return;
    startTimeRef.current = new Date();

    const handleSessionEnd = async () => {
      if (!startTimeRef.current) return;
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000);
      const sessionData: SessionData = {
        userId,
        startTime: startTimeRef.current.toISOString(),
        endTime: endTime.toISOString(),
        duration,
      };
      try {
        await axios.post("/api/sessionTimer/save", sessionData);
      } catch (err) {
        // Optionally handle error
      }
    };

    window.addEventListener("beforeunload", handleSessionEnd);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        handleSessionEnd();
      }
    });

    return () => {
      handleSessionEnd();
      window.removeEventListener("beforeunload", handleSessionEnd);
      window.removeEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          handleSessionEnd();
        }
      });
    };
  }, [userId]);
} 