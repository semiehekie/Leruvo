import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

export function useExamMonitoring(examId: string, studentId: string) {
  const [violations, setViolations] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const { socket, isConnected } = useWebSocket(`/ws?examId=${examId}`);

  useEffect(() => {
    if (!socket || !isConnected) return;

    setIsMonitoring(true);

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'heartbeat',
          studentId,
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000);

    // Monitor fullscreen changes
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const violation = "Exited fullscreen mode";
        setViolations(prev => [...prev, violation]);
        
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'violation',
            studentId,
            violation,
            timestamp: new Date().toISOString()
          }));
        }
      }
    };

    // Monitor tab/window visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const violation = "Tab/window switched away";
        setViolations(prev => [...prev, violation]);
        
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'violation',
            studentId,
            violation,
            timestamp: new Date().toISOString()
          }));
        }
      }
    };

    // Monitor window blur
    const handleWindowBlur = () => {
      const violation = "Window lost focus";
      setViolations(prev => [...prev, violation]);
      
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'violation',
          studentId,
          violation,
          timestamp: new Date().toISOString()
        }));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      setIsMonitoring(false);
    };
  }, [socket, isConnected, studentId]);

  return {
    violations,
    isMonitoring,
    violationCount: violations.length
  };
}
