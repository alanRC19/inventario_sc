"use client";

import React, { useState, useEffect } from 'react';

const ClientTime: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-app/20 rounded-xl px-4 py-3 shadow-sm transition-colors">
      <div className="text-center">
        <div className="text-sm font-medium text-app mb-1 transition-colors">
          {currentTime.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        <div className="text-lg font-bold font-mono text-primary transition-colors">
          {currentTime.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

export default ClientTime;
