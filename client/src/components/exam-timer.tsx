import { useEffect, useState } from "react";

interface ExamTimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
}

export function ExamTimer({ durationMinutes, onTimeUp }: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining < 300) return "text-destructive"; // Less than 5 minutes
    if (timeRemaining < 900) return "text-yellow-600"; // Less than 15 minutes
    return "text-foreground";
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <i className="fas fa-clock text-muted-foreground"></i>
      <span 
        className={`font-mono font-medium ${getTimerColor()}`}
        data-testid="text-exam-timer"
      >
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
}
