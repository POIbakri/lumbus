import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eSIM Compatible Devices - iPhone, Android & More | Device Checker 2025',
  description: 'Check if your phone supports eSIM. Complete list of eSIM compatible devices: iPhone, Samsung, Google Pixel, and more. Find out if your device works with eSIM.',
  keywords: [
    'eSIM compatible devices',
    'eSIM compatible phones',
    'iPhone eSIM',
    'Android eSIM',
    'eSIM device compatibility',
    'check eSIM compatibility',
    'which phones support eSIM',
  ],
  alternates: {
    canonical: 'https://getlumbus.com/device',
  },
  openGraph: {
    title: 'eSIM Compatible Devices - Check If Your Phone Supports eSIM',
    description: 'Complete list of eSIM compatible devices. Check if your iPhone or Android supports eSIM.',
    url: 'https://getlumbus.com/device',
    type: 'website',
  },
};

export default function DeviceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
