'use client';

// TikTok Icon Component
export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

// Instagram Icon Component
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

interface SocialMediaLinksProps {
  variant?: 'default' | 'compact' | 'hero' | 'dashboard';
  className?: string;
  showLabels?: boolean;
}

export function SocialMediaLinks({ variant = 'default', className = '', showLabels = false }: SocialMediaLinksProps) {
  const baseButtonClass = "flex items-center justify-center transition-all hover:scale-110";

  const variantStyles = {
    default: {
      container: "flex items-center gap-3",
      button: `${baseButtonClass} w-10 h-10 sm:w-11 sm:h-11 bg-white/10 hover:bg-white/20 rounded-xl`,
      icon: "w-5 h-5 sm:w-6 sm:h-6 text-white",
    },
    compact: {
      container: "flex items-center gap-2",
      button: `${baseButtonClass} w-8 h-8 sm:w-9 sm:h-9 bg-foreground/10 hover:bg-foreground/20 rounded-lg`,
      icon: "w-4 h-4 sm:w-5 sm:h-5 text-foreground",
    },
    hero: {
      container: "flex items-center justify-center gap-4",
      button: `${baseButtonClass} w-12 h-12 sm:w-14 sm:h-14 bg-foreground/10 hover:bg-foreground/20 rounded-2xl border-2 border-foreground/10 hover:border-foreground/30 shadow-lg`,
      icon: "w-6 h-6 sm:w-7 sm:h-7 text-foreground",
    },
    dashboard: {
      container: "flex items-center gap-3",
      button: `${baseButtonClass} w-11 h-11 sm:w-12 sm:h-12 bg-white hover:bg-gray-50 rounded-xl border-2 border-foreground/10 shadow-md`,
      icon: "w-5 h-5 sm:w-6 sm:h-6 text-foreground",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`${styles.container} ${className}`}>
      <a
        href="https://www.tiktok.com/@getlumbus"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.button}
        aria-label="Follow Lumbus on TikTok"
      >
        <TikTokIcon className={styles.icon} />
      </a>
      {showLabels && <span className="text-xs font-bold hidden sm:inline">TikTok</span>}
      <a
        href="https://www.instagram.com/getlumbus"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.button}
        aria-label="Follow Lumbus on Instagram"
      >
        <InstagramIcon className={styles.icon} />
      </a>
      {showLabels && <span className="text-xs font-bold hidden sm:inline">Instagram</span>}
    </div>
  );
}

// Inline social media links for footer or inline text usage
export function SocialMediaLinksInline({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <a
        href="https://www.tiktok.com/@getlumbus"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <TikTokIcon className="w-4 h-4" />
        <span className="text-sm">@getlumbus</span>
      </a>
      <a
        href="https://www.instagram.com/getlumbus"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <InstagramIcon className="w-4 h-4" />
        <span className="text-sm">@getlumbus</span>
      </a>
    </div>
  );
}
