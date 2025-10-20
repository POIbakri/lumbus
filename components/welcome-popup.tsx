'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user has seen the popup before
    const hasSeenPopup = localStorage.getItem('hasSeenWelcomePopup');

    if (!hasSeenPopup) {
      // Show popup after a short delay (1 second)
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWelcomePopup', 'true');
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText('WELCOME20');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <Card className="relative max-w-md w-full bg-white border-4 border-foreground shadow-2xl animate-in zoom-in duration-300 pointer-events-auto">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute -top-3 -right-3 w-10 h-10 bg-yellow text-foreground rounded-full flex items-center justify-center font-black text-2xl hover:bg-yellow/90 transition-all hover:scale-110 shadow-lg z-10 border-2 border-foreground"
            aria-label="Close popup"
          >
            ×
          </button>

          {/* Content */}
          <div className="p-5 sm:p-6">
            {/* Header Badge */}
            <div className="text-center mb-3 sm:mb-4">
              <div className="inline-block">
                <span className="px-3 sm:px-4 py-1.5 rounded-full bg-yellow/30 border-2 border-yellow font-black uppercase text-xs tracking-widest">
                  🎉 WELCOME OFFER
                </span>
              </div>
            </div>

            {/* Main Heading */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-center mb-2 sm:mb-3 leading-tight">
              GET 20% OFF<br/>YOUR FIRST ORDER!
            </h2>

            <p className="text-sm sm:text-base font-bold text-center text-foreground/70 mb-4 sm:mb-5">
              Start your journey with Lumbus eSIM and save on your first purchase
            </p>

            {/* Discount Code Box */}
            <div className="bg-gradient-to-br from-yellow via-primary to-cyan p-1 rounded-xl mb-4 sm:mb-5">
              <div className="bg-white p-3 sm:p-4 rounded-lg">
                <div className="text-center mb-2 sm:mb-3">
                  <div className="text-xs font-black uppercase text-foreground/60 mb-1">
                    YOUR DISCOUNT CODE
                  </div>
                  <div className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-primary mb-1">
                    WELCOME20
                  </div>
                  <div className="text-xs font-bold text-foreground/70">
                    Valid on all eSIM plans
                  </div>
                </div>

                {/* Copy Button */}
                <Button
                  onClick={handleCopyCode}
                  className="w-full bg-yellow text-foreground hover:bg-yellow/90 font-black text-sm px-4 py-3 sm:py-4 rounded-lg transition-all border-2 border-foreground"
                >
                  {copied ? (
                    <span className="flex items-center justify-center gap-2">
                      <span>✓</span>
                      COPIED!
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>📋</span>
                      COPY CODE
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-5">
              <div className="flex items-start gap-2">
                <span className="text-yellow font-black text-lg flex-shrink-0">✓</span>
                <span className="font-bold text-xs sm:text-sm">Valid on all destinations & plans</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow font-black text-lg flex-shrink-0">✓</span>
                <span className="font-bold text-xs sm:text-sm">Instant activation, no signup required</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow font-black text-lg flex-shrink-0">✓</span>
                <span className="font-bold text-xs sm:text-sm">One-time use for new customers</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleClose}
              className="w-full bg-primary text-foreground hover:bg-primary/90 font-black text-sm sm:text-base px-6 py-4 sm:py-5 rounded-lg shadow-xl transition-all border-2 border-foreground"
            >
              START SHOPPING →
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
