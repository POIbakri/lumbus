'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Nav } from '@/components/nav';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />
      
      <main className="flex-grow flex items-center justify-center px-4 py-20 sm:py-32 relative overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container mx-auto max-w-2xl text-center relative z-10">
          <div className="mb-6 sm:mb-8 animate-bounce-slow flex justify-center">
            <svg className="w-16 h-16 sm:w-24 sm:h-24 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">
            OFF THE MAP?
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-muted-foreground mb-8 sm:mb-12 leading-relaxed">
            We couldn't find the page you're looking for. It might have moved or doesn't exist.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full btn-lumbus bg-primary text-foreground hover:bg-primary/90 font-black text-lg px-8 py-6 rounded-xl shadow-xl">
                BACK HOME
              </Button>
            </Link>
            <Link href="/destinations" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full border-4 border-foreground font-black text-lg px-8 py-6 rounded-xl hover:bg-foreground/5">
                VIEW DESTINATIONS
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

