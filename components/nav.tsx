'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

export function Nav() {
  const { user, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-foreground/10 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 py-1.5 sm:py-2 md:py-1.5">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/logotrans.png"
              alt="Lumbus"
              width={300}
              height={80}
              className="h-16 w-auto sm:h-20 md:h-24"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-8 items-center">
            <Link href="/" className="font-bold text-sm hover:text-primary  ">
              Home
            </Link>
            <Link href="/destinations" className="font-bold text-sm hover:text-primary  ">
              Destinations
            </Link>
            <Link href="/device" className="font-bold text-sm hover:text-primary  ">
              Device
            </Link>
            <Link href="/how-it-works" className="font-bold text-sm hover:text-primary  ">
              How it works
            </Link>
            <Link href="/help" className="font-bold text-sm hover:text-primary  ">
              Help Center
            </Link>
            <Link href="/affiliate-program" className="font-bold text-sm hover:text-primary  ">
              Affiliates
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button className="bg-primary text-foreground hover:bg-primary/90 font-black text-sm px-6 py-2 rounded-lg">
                        DASHBOARD
                      </Button>
                    </Link>
                    <Button
                      onClick={handleSignOut}
                      className="bg-foreground text-white hover:bg-foreground/90 font-black text-sm px-6 py-2 rounded-lg"
                    >
                      SIGN OUT
                    </Button>
                  </>
                ) : (
                  <Link href="/login">
                    <Button className="bg-foreground text-white hover:bg-foreground/90 font-black text-sm px-6 py-2 rounded-lg">
                      LOGIN
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-foreground  ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-full h-0.5 bg-foreground  ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-full h-0.5 bg-foreground  ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 flex flex-col gap-4">
            <Link href="/" className="font-bold text-sm hover:text-primary " onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/destinations" className="font-bold text-sm hover:text-primary " onClick={() => setMobileMenuOpen(false)}>
              Destinations
            </Link>
            <Link href="/device" className="font-bold text-sm hover:text-primary " onClick={() => setMobileMenuOpen(false)}>
              Device
            </Link>
            <Link href="/how-it-works" className="font-bold text-sm hover:text-primary " onClick={() => setMobileMenuOpen(false)}>
              How it works
            </Link>
            <Link href="/help" className="font-bold text-sm hover:text-primary " onClick={() => setMobileMenuOpen(false)}>
              Help Center
            </Link>
            <Link href="/affiliate-program" className="font-bold text-sm hover:text-primary " onClick={() => setMobileMenuOpen(false)}>
              Affiliates
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-primary text-foreground hover:bg-primary/90 font-black text-sm px-6 py-2 rounded-lg">
                        DASHBOARD
                      </Button>
                    </Link>
                    <Button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-foreground text-white hover:bg-foreground/90 font-black text-sm px-6 py-2 rounded-lg"
                    >
                      SIGN OUT
                    </Button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-foreground text-white hover:bg-foreground/90 font-black text-sm px-6 py-2 rounded-lg">
                      LOGIN
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
