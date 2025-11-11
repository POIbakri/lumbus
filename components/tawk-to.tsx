'use client';

import Script from 'next/script';

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      [key: string]: unknown;
    };
    Tawk_LoadStart?: Date;
  }
}

export function TawkTo() {
  return (
    <>
      <Script
        id="tawk-to-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/6913619083160d195a17498b/25bd5f474400d6abb53bc8b0fbb116e0d85bfaf5';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
            })();
          `,
        }}
      />
    </>
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
