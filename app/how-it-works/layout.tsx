import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Buy & Activate eSIM - 3 Easy Steps | Complete Setup Guide 2025',
  description: 'Learn how to buy and activate your eSIM in 3 easy steps. Complete setup guide for iPhone & Android. Get connected in 5 minutes. No technical knowledge needed.',
  keywords: [
    'how to buy eSIM',
    'how to activate eSIM',
    'eSIM setup guide',
    'install eSIM iPhone',
    'install eSIM Android',
    'eSIM activation steps',
    'how eSIM works',
  ],
  alternates: {
    canonical: 'https://getlumbus.com/how-it-works',
  },
  openGraph: {
    title: 'How to Buy & Activate eSIM - Complete Setup Guide',
    description: 'Learn how to buy and activate your eSIM in 3 easy steps. Get connected in 5 minutes.',
    url: 'https://getlumbus.com/how-it-works',
    type: 'article',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
