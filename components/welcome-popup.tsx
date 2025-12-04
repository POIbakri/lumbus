'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const POPUP_DELAY_MS = 15000;

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user has seen the popup before
    const hasSeenPopup = localStorage.getItem('hasSeenWelcomePopup');

    if (hasSeenPopup) return;

    // Give visitors time to browse before surfacing the offer
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
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
                <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-yellow/30 border-2 border-yellow font-black uppercase text-xs tracking-widest">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  WELCOME OFFER
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
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      COPIED!
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      COPY CODE
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-5">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="font-bold text-xs sm:text-sm">Valid on all destinations & plans</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="font-bold text-xs sm:text-sm">Instant activation, no signup required</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="font-bold text-xs sm:text-sm">One-time use for new customers</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              asChild
              className="w-full bg-primary text-foreground hover:bg-primary/90 font-black text-sm sm:text-base px-6 py-4 sm:py-5 rounded-lg shadow-xl transition-all border-2 border-foreground"
            >
              <Link href="/destinations" onClick={handleClose}>
                SEARCH DESTINATIONS NOW →
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
