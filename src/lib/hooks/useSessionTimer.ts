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
      console.log("[SessionTimer] Sending session data:", sessionData);
      try {
        await axios.post("/api/sessionTimer/save", sessionData);
        console.log("[SessionTimer] Session data sent successfully");
      } catch (err) {
        console.error("[SessionTimer] Failed to send session data", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleSessionEnd();
      }
    };

    window.addEventListener("beforeunload", handleSessionEnd);
    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      handleSessionEnd();
      window.removeEventListener("beforeunload", handleSessionEnd);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId]);
} 