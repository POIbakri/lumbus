import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy - eSIM Refunds & Cancellations | Lumbus',
  description: 'Lumbus refund policy for eSIM purchases. Learn about our refund eligibility, process, and how to request a refund for unused eSIM data plans.',
  keywords: [
    'Lumbus refund policy',
    'eSIM refund',
    'eSIM cancellation',
    'money back guarantee',
    'refund request',
    'eSIM return policy',
  ],
  alternates: {
    canonical: 'https://getlumbus.com/refund-policy',
  },
  openGraph: {
    title: 'Refund Policy - eSIM Refunds & Cancellations',
    description: 'Learn about Lumbus refund policy for eSIM purchases and how to request a refund.',
    url: 'https://getlumbus.com/refund-policy',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
