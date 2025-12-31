import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - How We Protect Your Data | Lumbus',
  description: 'Learn how Lumbus protects your personal information. Our privacy policy explains what data we collect, how we use it, and your rights regarding your information.',
  keywords: [
    'Lumbus privacy policy',
    'eSIM privacy',
    'data protection',
    'personal information',
    'GDPR',
    'privacy rights',
  ],
  alternates: {
    canonical: 'https://getlumbus.com/privacy',
  },
  openGraph: {
    title: 'Privacy Policy - How We Protect Your Data',
    description: 'Learn how Lumbus protects your personal information and respects your privacy.',
    url: 'https://getlumbus.com/privacy',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
