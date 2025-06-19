
"use client";

import { useState, useEffect } from 'react';

interface AdminStopwatchProps {
  resetKey: number; // Changes to trigger a reset
}

export default function AdminStopwatch({ resetKey }: AdminStopwatchProps) {
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds

  useEffect(() => {
    setElapsedTime(0); // Reset time when resetKey changes
    const intervalId = setInterval(() => {
      setElapsedTime((prevTime) => prevTime + 1);
    }, 1000);

    return () => clearInterval(intervalId); // Cleanup interval on component unmount or resetKey change
  }, [resetKey]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div 
      className="fixed bottom-4 right-4 bg-gray-800 bg-opacity-80 text-white p-2 px-4 rounded-lg shadow-xl text-sm z-[9999] backdrop-blur-sm"
      aria-live="off" // Tidak perlu diumumkan oleh screen reader setiap detik
      role="timer"
    >
      <span>Waktu Inaktif: {formatTime(elapsedTime)}</span>
    </div>
  );
}
