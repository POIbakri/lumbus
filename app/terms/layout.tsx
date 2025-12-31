import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Lumbus eSIM',
  description: 'Read the Lumbus Terms of Service. Understand the terms and conditions for using our eSIM services, including usage policies, limitations, and your rights.',
  keywords: [
    'Lumbus terms of service',
    'eSIM terms',
    'terms and conditions',
    'user agreement',
    'service terms',
  ],
  alternates: {
    canonical: 'https://getlumbus.com/terms',
  },
  openGraph: {
    title: 'Terms of Service - Lumbus eSIM',
    description: 'Read the Lumbus Terms of Service for using our eSIM services.',
    url: 'https://getlumbus.com/terms',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
