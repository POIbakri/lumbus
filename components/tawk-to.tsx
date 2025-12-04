'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      minimize?: () => void;
      toggle?: () => void;
      onLoad?: () => void;
      isChatMaximized?: () => boolean;
      [key: string]: unknown;
    };
    Tawk_LoadStart?: Date;
  }
}

export function TawkTo() {
  useEffect(() => {
    // Configuration
    const DELAY_MS = 15000; // 15 seconds delay
    const STORAGE_KEY = 'lumbus_tawk_auto_opened_v1';
    
    // Track interval to clear it on unmount
    let retryInterval: ReturnType<typeof setInterval> | undefined;

    const autoOpenChat = () => {
      // 1. Check if we are on client side
      if (typeof window === 'undefined') return;

      // 2. Don't auto-open on mobile (bad UX, covers screen)
      if (window.innerWidth < 768) return;

      // 3. Don't auto-open if already opened in this session
      if (sessionStorage.getItem(STORAGE_KEY)) return;

      // 4. Don't auto-open on specific pages if needed (e.g. legal pages)
      // Note: Using window.location.pathname since we are inside a closure with no dependencies
      // const excludedPaths = ['/privacy', '/terms'];
      // if (excludedPaths.some(p => window.location.pathname.includes(p))) return;

      // 5. Attempt to open
      const open = () => {
        if (window.Tawk_API?.maximize) {
          // Check if already open
          if (window.Tawk_API.isChatMaximized && window.Tawk_API.isChatMaximized()) {
            sessionStorage.setItem(STORAGE_KEY, 'true');
            return;
          }
          
          window.Tawk_API.maximize();
          sessionStorage.setItem(STORAGE_KEY, 'true');
        }
      };

      // Retry logic in case script hasn't loaded yet
      if (window.Tawk_API?.maximize) {
        open();
      } else {
        let attempts = 0;
        retryInterval = setInterval(() => {
          attempts++;
          if (window.Tawk_API?.maximize) {
            open();
            if (retryInterval) clearInterval(retryInterval);
            retryInterval = undefined;
          } else if (attempts >= 20) { // Stop after 20 seconds of trying
            if (retryInterval) clearInterval(retryInterval);
            retryInterval = undefined;
          }
        }, 1000);
      }
    };

    // Set the timer
    const timer = setTimeout(autoOpenChat, DELAY_MS);

    // Cleanup function to clear both timeout and interval
    return () => {
      clearTimeout(timer);
      if (retryInterval) {
        clearInterval(retryInterval);
      }
    };
  }, []); // Empty dependency array: Only run once on mount (session start), preventing timer reset on navigation

  return (
    <Script
      id="tawk-to-script"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/6913619083160d195a17498b/1j9pra7j0';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  );
}

// Helper function to open the Tawk.to chat widget
export function openTawkToChat() {
  if (typeof window !== 'undefined') {
    if (window.Tawk_API && window.Tawk_API.maximize) {
      window.Tawk_API.maximize();
    }
  }
}
