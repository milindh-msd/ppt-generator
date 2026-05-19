import { useState, useEffect } from "react";

export function Timer({ isRunning }: { isRunning: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 0.1);
      }, 100);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isRunning) return null;

  return (
    <div className="text-sm font-mono text-primary flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      {seconds.toFixed(1)}s elapsed
    </div>
  );
}