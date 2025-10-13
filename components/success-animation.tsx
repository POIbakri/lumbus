'use client';

import { useEffect, useState } from 'react';

export function SuccessAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-64 h-64 mx-auto mb-8">
      {/* Planet */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
        <div className="relative w-48 h-48">
          {/* Planet Body */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-cyan to-purple shadow-2xl animate-pulse-slow">
            {/* Continents */}
            <div className="absolute top-6 left-8 w-12 h-8 bg-foreground/20 rounded-full" style={{transform: 'rotate(-20deg)'}}></div>
            <div className="absolute bottom-10 right-6 w-16 h-10 bg-foreground/20 rounded-full" style={{transform: 'rotate(30deg)'}}></div>
            <div className="absolute top-1/2 left-1/4 w-10 h-6 bg-foreground/15 rounded-full" style={{transform: 'rotate(-45deg)'}}></div>
          </div>

          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-cyan blur-2xl opacity-50 animate-pulse-slow"></div>

          {/* Orbit Ring */}
          <svg className="absolute inset-0 w-full h-full animate-spin-slow" style={{animationDuration: '20s'}}>
            <ellipse cx="96" cy="96" rx="80" ry="30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" className="text-primary/30" />
          </svg>

          {/* Orbiting Signal Dot */}
          <div className="absolute top-1/2 left-1/2 w-full h-full animate-spin-slow" style={{animationDuration: '20s'}}>
            <div className="absolute -top-2 left-1/2 w-4 h-4 bg-yellow rounded-full shadow-lg animate-bounce-subtle"></div>
          </div>
        </div>
      </div>

      {/* Signal Bars */}
      <div className={`absolute -right-8 top-1/2 transform -translate-y-1/2 flex gap-2 items-end transition-all duration-1000 delay-500 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
        {[1, 2, 3, 4].map((bar, index) => (
          <div
            key={bar}
            className="w-3 bg-gradient-to-t from-primary to-cyan rounded-full transition-all duration-500"
            style={{
              height: `${bar * 8 + 8}px`,
              animationDelay: `${index * 0.1}s`,
              animation: 'signalPulse 2s ease-in-out infinite'
            }}
          ></div>
        ))}
      </div>

      {/* Sparkles */}
      {mounted && (
        <>
          <div className="absolute top-4 right-8 text-2xl animate-bounce-subtle" style={{animationDelay: '0.2s'}}>✨</div>
          <div className="absolute bottom-4 left-8 text-2xl animate-bounce-subtle" style={{animationDelay: '0.6s'}}>✨</div>
          <div className="absolute top-12 left-4 text-xl animate-bounce-subtle" style={{animationDelay: '0.4s'}}>⭐</div>
          <div className="absolute bottom-12 right-4 text-xl animate-bounce-subtle" style={{animationDelay: '0.8s'}}>⭐</div>
        </>
      )}

      <style jsx>{`
        @keyframes signalPulse {
          0%, 100% {
            opacity: 1;
            transform: scaleY(1);
          }
          50% {
            opacity: 0.5;
            transform: scaleY(1.2);
          }
        }
      `}</style>
    </div>
  );
}
