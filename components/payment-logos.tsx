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
              <Image src="/apple-logo.svg" alt="Apple" width={20} height={20} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              <span className="font-black text-foreground text-xs sm:text-sm uppercase">Apple Pay</span>
            </div>
          </div>

          {/* Google Pay */}
          <div className="group px-3 sm:px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-foreground/10">
            <div className="flex items-center gap-2">
              <Image src="/google-logo.webp" alt="Google" width={20} height={20} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
              <span className="font-black text-foreground text-xs sm:text-sm uppercase">Google Pay</span>
            </div>
          </div>

          {/* Credit Cards */}
          <div className="group px-3 sm:px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-foreground/10">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl" aria-hidden="true">💳</span>
              <span className="font-black text-foreground text-xs sm:text-sm uppercase">Cards</span>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {/* Secure Payment */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-mint/50 rounded-lg border-2 border-mint">
            <span className="text-lg sm:text-xl" aria-hidden="true">🔒</span>
            <div className="flex flex-col">
              <span className="font-black text-xs uppercase leading-tight">Secure Payment</span>
              <span className="text-xs font-bold text-foreground/60">via Stripe</span>
            </div>
          </div>

          {/* No Signup */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow/50 rounded-lg border-2 border-yellow">
            <span className="text-lg sm:text-xl" aria-hidden="true">✨</span>
            <div className="flex flex-col">
              <span className="font-black text-xs uppercase leading-tight">No Signup</span>
              <span className="text-xs font-bold text-foreground/60">Required</span>
            </div>
          </div>

          {/* Instant Delivery */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyan/50 rounded-lg border-2 border-cyan">
            <span className="text-lg sm:text-xl" aria-hidden="true">⚡</span>
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
        <span aria-hidden="true">🔒</span>
        <span>Secure via Stripe</span>
      </div>
      <span className="text-foreground/30">•</span>
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
        <Image src="/apple-logo.svg" alt="Apple" width={16} height={16} className="w-4 h-4 object-contain" />
        <span>Apple Pay</span>
      </div>
      <span className="text-foreground/30">•</span>
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
        <Image src="/google-logo.webp" alt="Google" width={16} height={16} className="w-4 h-4 object-contain" />
        <span>Google Pay</span>
      </div>
      <span className="text-foreground/30">•</span>
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
        <span aria-hidden="true">✨</span>
        <span>No Signup</span>
      </div>
    </div>
  );
}
