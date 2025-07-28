"use client";

import { useEffect, useState } from "react";

export default function ClientTime() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div>
        <div className="text-2xl font-semibold text-card">--:--:--</div>
        <div className="text-sm text-muted capitalize">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-2xl font-semibold text-card">
        {currentTime.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}
      </div>
      <div className="text-sm text-muted capitalize">
        {currentTime.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
    </div>
  );
}
