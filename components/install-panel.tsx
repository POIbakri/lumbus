'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { buildIOSUniversalLink, buildLPAString, triggerHaptic } from '@/lib/device-detection';
import Image from 'next/image';

interface InstallPanelProps {
  smdp: string;
  activationCode: string;
  orderId: string;
  supportsUniversalLink: boolean;
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
}

export function InstallPanel({
  smdp,
  activationCode,
  orderId,
  supportsUniversalLink,
  platform,
}: InstallPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const lpaString = buildLPAString(smdp, activationCode);
  const universalLink = buildIOSUniversalLink(smdp, activationCode);
  const qrUrl = `/api/qr/${orderId}`;

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    triggerHaptic('light');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUniversalLinkClick = () => {
    triggerHaptic('medium');
    window.open(universalLink, '_blank');
  };

  const defaultTab = platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'desktop';

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-mint border-2 border-primary p-1">
        <TabsTrigger value="ios" className="font-bold uppercase text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-foreground px-2 sm:px-3">
          <span className="hidden sm:inline">iPhone / iPad</span>
          <span className="sm:hidden">iOS</span>
        </TabsTrigger>
        <TabsTrigger value="android" className="font-bold uppercase text-xs sm:text-sm data-[state=active]:bg-secondary data-[state=active]:text-foreground px-2 sm:px-3">Android</TabsTrigger>
        <TabsTrigger value="desktop" className="font-bold uppercase text-xs sm:text-sm data-[state=active]:bg-accent data-[state=active]:text-foreground px-2 sm:px-3">Desktop</TabsTrigger>
      </TabsList>

      <TabsContent value="ios" className="space-y-4">
        <Card className="bg-purple border-2 border-accent shadow-lg">
          <CardContent className="pt-6">
            {supportsUniversalLink && (
              <div className="mb-6">
                <Badge className="mb-3 bg-foreground text-white font-bold uppercase text-xs px-3 py-1">
                  iOS 17.4+ - SCAN-FREE
                </Badge>
                <Button
                  onClick={handleUniversalLinkClick}
                  className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 text-lg py-7 font-black"
                >
                  ACTIVATE WITHOUT QR
                </Button>
                <p className="text-xs font-bold uppercase text-muted-foreground mt-2 text-center">
                  Opens native eSIM installer
                </p>
              </div>
            )}

            <div className="text-center mb-4">
              <h3 className="font-black uppercase text-lg sm:text-xl mb-4">OR SCAN QR CODE</h3>
              <div className="bg-white p-4 sm:p-6 rounded-xl inline-block shadow-lg">
                <Image
                  src={qrUrl}
                  alt="eSIM QR Code"
                  width={250}
                  height={250}
                  className="mx-auto w-full max-w-[250px] sm:max-w-[300px] h-auto"
                />
              </div>
              <p className="font-bold uppercase text-xs sm:text-sm mt-4 px-2">
                Long-press QR → Add eSIM
              </p>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="manual" className="border-t-2 border-foreground/20">
                <AccordionTrigger className="font-bold uppercase">Enter details manually</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <label className="font-bold uppercase text-sm">SM-DP+ Address</label>
                    <div className="flex gap-2 mt-2">
                      <code className="flex-1 p-3 bg-white border-2 border-foreground/20 rounded-lg text-xs break-all font-mono">
                        {smdp}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => handleCopy(smdp, 'smdp')}
                        className="bg-foreground text-white hover:bg-foreground/90 font-bold"
                      >
                        {copiedField === 'smdp' ? '✓' : 'COPY'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-sm">Activation Code</label>
                    <div className="flex gap-2 mt-2">
                      <code className="flex-1 p-3 bg-white border-2 border-foreground/20 rounded-lg text-xs break-all font-mono">
                        {activationCode}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => handleCopy(activationCode, 'activation')}
                        className="bg-foreground text-white hover:bg-foreground/90 font-bold"
                      >
                        {copiedField === 'activation' ? '✓' : 'COPY'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-sm">LPA String</label>
                    <div className="flex gap-2 mt-2">
                      <code className="flex-1 p-3 bg-white border-2 border-foreground/20 rounded-lg text-xs break-all font-mono">
                        {lpaString}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => handleCopy(lpaString, 'lpa')}
                        className="bg-foreground text-white hover:bg-foreground/90 font-bold"
                      >
                        {copiedField === 'lpa' ? '✓' : 'COPY'}
                      </Button>
                    </div>
                  </div>
                  <div className="font-bold uppercase text-xs text-muted-foreground">
                    Settings → Cellular → Add eSIM → Enter Details Manually
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="android" className="space-y-4">
        <Card className="bg-yellow border-2 border-secondary shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h3 className="font-black uppercase text-lg sm:text-xl mb-4">SCAN QR CODE</h3>
              <div className="bg-white p-4 sm:p-6 rounded-xl inline-block shadow-lg">
                <Image
                  src={qrUrl}
                  alt="eSIM QR Code"
                  width={250}
                  height={250}
                  className="mx-auto w-full max-w-[250px] sm:max-w-[300px] h-auto"
                />
              </div>
              <p className="font-bold uppercase text-xs sm:text-sm mt-4 px-2">
                Settings → Network & Internet → SIMs → Add eSIM → Scan QR code
              </p>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="manual" className="border-t-2 border-foreground/20">
                <AccordionTrigger className="font-bold uppercase">Enter details manually</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <label className="font-bold uppercase text-sm">SM-DP+ Address</label>
                    <div className="flex gap-2 mt-2">
                      <code className="flex-1 p-3 bg-white border-2 border-foreground/20 rounded-lg text-xs break-all font-mono">
                        {smdp}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => handleCopy(smdp, 'smdp')}
                        className="bg-foreground text-white hover:bg-foreground/90 font-bold"
                      >
                        {copiedField === 'smdp' ? '✓' : 'COPY'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-sm">Activation Code</label>
                    <div className="flex gap-2 mt-2">
                      <code className="flex-1 p-3 bg-white border-2 border-foreground/20 rounded-lg text-xs break-all font-mono">
                        {activationCode}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => handleCopy(activationCode, 'activation')}
                        className="bg-foreground text-white hover:bg-foreground/90 font-bold"
                      >
                        {copiedField === 'activation' ? '✓' : 'COPY'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-sm">LPA String (Complete)</label>
                    <div className="flex gap-2 mt-2">
                      <code className="flex-1 p-3 bg-white border-2 border-foreground/20 rounded-lg text-xs break-all font-mono">
                        {lpaString}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => handleCopy(lpaString, 'lpa')}
                        className="bg-foreground text-white hover:bg-foreground/90 font-bold"
                      >
                        {copiedField === 'lpa' ? '✓' : 'COPY'}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="desktop" className="space-y-4">
        <Card className="bg-cyan border-2 border-primary shadow-lg">
          <CardContent className="pt-6 text-center">
            <div className="mb-6">
              <h3 className="font-black uppercase text-lg sm:text-xl mb-4">SCAN WITH YOUR PHONE</h3>
              <div className="bg-white p-4 sm:p-6 rounded-xl inline-block shadow-lg">
                <Image
                  src={qrUrl}
                  alt="eSIM QR Code"
                  width={250}
                  height={250}
                  className="mx-auto w-full max-w-[250px] sm:max-w-[300px] h-auto"
                />
              </div>
            </div>
            <p className="font-bold uppercase text-xs sm:text-sm px-2">
              Use your phone's camera to scan this QR code
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
