import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eSIM Help & FAQ - Setup Guides, Troubleshooting & Support | Lumbus',
  description: 'Get help with your Lumbus eSIM. Complete FAQ, setup guides, troubleshooting tips. Learn how to install, activate and use your eSIM. 24/7 support available.',
  keywords: [
    'eSIM help',
    'eSIM FAQ',
    'how to install eSIM',
    'eSIM setup guide',
    'eSIM troubleshooting',
    'eSIM activation help',
    'eSIM support',
  ],
  alternates: {
    canonical: 'https://getlumbus.com/help',
  },
  openGraph: {
    title: 'eSIM Help & FAQ - Setup Guides & Support',
    description: 'Get help with your eSIM. Complete FAQ, setup guides, and 24/7 support.',
    url: 'https://getlumbus.com/help',
    type: 'website',
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
