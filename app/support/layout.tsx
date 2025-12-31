import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Support - Get Help with Your eSIM | Lumbus',
  description: 'Need help with your Lumbus eSIM? Contact our 24/7 support team via live chat, email, or WhatsApp. We\'re here to help with installation, activation, and any issues.',
  keywords: [
    'Lumbus support',
    'eSIM help',
    'eSIM support',
    'contact Lumbus',
    'eSIM customer service',
    'eSIM installation help',
    'eSIM not working',
    'travel eSIM support',
  ],
  alternates: {
    canonical: 'https://getlumbus.com/support',
  },
  openGraph: {
    title: 'Contact Support - Get Help with Your eSIM',
    description: 'Need help with your Lumbus eSIM? Contact our 24/7 support team. We\'re here to help!',
    url: 'https://getlumbus.com/support',
    type: 'website',
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
