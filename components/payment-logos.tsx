'use client';

import Image from 'next/image';

/**
 * Payment Logos Component
 * Displays trust seals and payment method badges
 * Mobile-responsive with proper touch targets
 */
export function PaymentLogos() {
  return (
    <div className="w-full">
      <div className="flex flex-col items-center gap-4 sm:gap-6">
        {/* Payment Methods */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* Apple Pay */}
          <div className="group px-3 sm:px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-foreground/10">
            <div className="flex items-center gap-2">
              <Image src="/apple-logo.svg" alt="Apple Pay payment method" width={20} height={20} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              <span className="font-black text-foreground text-xs sm:text-sm uppercase">Apple Pay</span>
            </div>
          </div>

          {/* Google Pay */}
          <div className="group px-3 sm:px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-foreground/10">
            <div className="flex items-center gap-2">
              <Image src="/google-logo.webp" alt="Google Pay payment method" width={20} height={20} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              <span className="font-black text-foreground text-xs sm:text-sm uppercase">Google Pay</span>
            </div>
          </div>

          {/* Credit Cards */}
          <div className="group px-3 sm:px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-foreground/10">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              <span className="font-black text-foreground text-xs sm:text-sm uppercase">Cards</span>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {/* Secure Payment */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-mint/50 rounded-lg border-2 border-mint">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <div className="flex flex-col">
              <span className="font-black text-xs uppercase leading-tight">Secure Payment</span>
              <span className="text-xs font-bold text-foreground/60">via Stripe</span>
            </div>
          </div>

          {/* No Signup */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow/50 rounded-lg border-2 border-yellow">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            <div className="flex flex-col">
              <span className="font-black text-xs uppercase leading-tight">No Signup</span>
              <span className="text-xs font-bold text-foreground/60">Required</span>
            </div>
          </div>

          {/* Instant Delivery */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyan/50 rounded-lg border-2 border-cyan">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <div className="flex flex-col">
              <span className="font-black text-xs uppercase leading-tight">Instant</span>
              <span className="text-xs font-bold text-foreground/60">Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Payment Logos - For footer or smaller spaces
 */
export function PaymentLogosCompact() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-foreground/60">
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <span>Secure via Stripe</span>
      </div>
      <span className="text-foreground/30">•</span>
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
        <Image src="/apple-logo.svg" alt="Apple Pay payment method" width={16} height={16} className="w-4 h-4 object-contain" />
        <span>Apple Pay</span>
      </div>
      <span className="text-foreground/30">•</span>
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
        <Image src="/google-logo.webp" alt="Google Pay payment method" width={16} height={16} className="w-4 h-4 object-contain" />
        <span>Google Pay</span>
      </div>
      <span className="text-foreground/30">•</span>
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        <span>No Signup</span>
      </div>
    </div>
  );
}
