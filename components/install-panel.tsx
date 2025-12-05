'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    window.location.href = universalLink;
  };

  const defaultTab = platform === 'ios' ? 'ios' : 'android';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <Card className="bg-white border-4 border-foreground shadow-2xl">
        <CardHeader className="bg-purple border-b-4 border-foreground pb-4 sm:pb-6">
          <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-center text-foreground">
            INSTALLATION INSTRUCTIONS
          </CardTitle>
          <p className="text-sm sm:text-base md:text-lg font-bold text-foreground/80 text-center mt-2">
            Choose your device type below to get started
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-3 sm:gap-4 bg-transparent p-0 h-auto mb-6 sm:mb-8">
          <TabsTrigger
            value="ios"
            className="font-black uppercase text-sm sm:text-base md:text-lg lg:text-xl data-[state=active]:bg-primary data-[state=active]:text-foreground data-[state=active]:border-4 data-[state=active]:border-foreground data-[state=active]:shadow-2xl data-[state=active]:scale-105 bg-muted border-3 border-foreground/30 text-foreground/40 hover:border-foreground/50 hover:text-foreground/60 px-4 sm:px-6 py-4 sm:py-6 md:py-8 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-102"
          >
            <span className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <Image src="/apple-logo.svg" alt="Apple" width={32} height={32} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain" />
              <span className="hidden md:inline">iPhone / iPad</span>
              <span className="md:hidden">Apple iOS</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="android"
            className="font-black uppercase text-sm sm:text-base md:text-lg lg:text-xl data-[state=active]:bg-yellow data-[state=active]:text-foreground data-[state=active]:border-4 data-[state=active]:border-foreground data-[state=active]:shadow-2xl data-[state=active]:scale-105 bg-muted border-3 border-foreground/30 text-foreground/40 hover:border-foreground/50 hover:text-foreground/60 px-4 sm:px-6 py-4 sm:py-6 md:py-8 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-102"
          >
            <span className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <Image src="/android-logo.svg" alt="Android" width={32} height={32} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain" />
              <span>Android</span>
            </span>
          </TabsTrigger>
        </TabsList>

      <TabsContent value="ios" className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Method 1: One-Tap Install (iOS 17.4+) */}
        {supportsUniversalLink && (
          <Card className="bg-purple border-2 sm:border-3 md:border-4 border-foreground shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase">
                  METHOD 1: INSTANT INSTALL
                </CardTitle>
                <Badge className="bg-foreground text-white font-black uppercase text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5">
                  RECOMMENDED
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border-2 border-foreground/10">
                <p className="font-black text-sm sm:text-base md:text-lg uppercase text-center text-foreground">
                  For iOS 17.4 or newer
                </p>
                <ol className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg font-bold text-foreground">
                  <li className="flex gap-3 sm:gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
                    <span className="flex-1 pt-0.5">Tap the button below to open Settings automatically</span>
                  </li>
                  <li className="flex gap-3 sm:gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
                    <span className="flex-1 pt-0.5">Tap "Continue" when prompted</span>
                  </li>
                  <li className="flex gap-3 sm:gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
                    <span className="flex-1 pt-0.5">Label your eSIM (e.g., "Travel Data")</span>
                  </li>
                  <li className="flex gap-3 sm:gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">4</span>
                    <span className="flex-1 pt-0.5">Done! Your eSIM is installed</span>
                  </li>
                </ol>
              </div>
              <Button
                onClick={handleUniversalLinkClick}
                className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 text-sm sm:text-base md:text-lg lg:text-xl py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8 font-black shadow-xl hover:scale-105 active:scale-105 transition-all touch-manipulation"
              >
                INSTALL eSIM NOW
              </Button>
              <p className="text-xs sm:text-sm font-bold uppercase text-center text-foreground/80">
                No QR code needed - Fastest method
              </p>
            </CardContent>
          </Card>
        )}

        {/* Method 2: QR Code */}
        <Card className="bg-cyan border-2 sm:border-3 md:border-4 border-foreground shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase">
                {supportsUniversalLink ? 'METHOD 2:' : 'METHOD 1:'} SCAN QR CODE
              </CardTitle>
              {!supportsUniversalLink && (
                <Badge className="bg-foreground text-white font-black uppercase text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5">
                  RECOMMENDED
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border-2 border-foreground/10">
              <p className="font-black text-sm sm:text-base md:text-lg uppercase text-center text-foreground">
                For all iPhones
              </p>
              <ol className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg font-bold text-foreground">
                <li className="flex gap-3 sm:gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
                  <span className="flex-1 pt-0.5">Long-press the QR code below with your camera app</span>
                </li>
                <li className="flex gap-3 sm:gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
                  <span className="flex-1 pt-0.5">Tap "Set Up Cellular Plan" or "Add eSIM"</span>
                </li>
                <li className="flex gap-3 sm:gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
                  <span className="flex-1 pt-0.5">Follow the on-screen prompts</span>
                </li>
                <li className="flex gap-3 sm:gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">4</span>
                  <span className="flex-1 pt-0.5">Label your eSIM and tap "Done"</span>
                </li>
              </ol>
            </div>

            <div className="text-center">
              <div className="bg-white p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl inline-block shadow-2xl border-2 sm:border-3 md:border-4 border-foreground">
                <Image
                  src={qrUrl}
                  alt="eSIM QR Code"
                  width={280}
                  height={280}
                  className="mx-auto w-full max-w-[180px] sm:max-w-[220px] md:max-w-[280px] h-auto"
                  priority
                />
              </div>
              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 md:p-4 bg-yellow/80 rounded-lg sm:rounded-xl border-2 border-foreground/20">
                <p className="font-black uppercase text-xs sm:text-sm">
                  TIP: Take a screenshot to save this QR code
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Method 3: Manual Entry */}
        <Card className="bg-yellow border-2 sm:border-3 md:border-4 border-foreground shadow-xl">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase">
              {supportsUniversalLink ? 'METHOD 3:' : 'METHOD 2:'} MANUAL ENTRY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Accordion type="single" collapsible className="bg-white/90 rounded-lg sm:rounded-xl">
              <AccordionItem value="manual" className="border-none">
                <AccordionTrigger className="font-black uppercase text-xs sm:text-sm md:text-base px-3 sm:px-4 hover:no-underline">
                  Show Manual Entry Instructions
                </AccordionTrigger>
                <AccordionContent className="space-y-4 sm:space-y-5 px-3 sm:px-4 pb-4 sm:pb-5">
                  <div className="space-y-3 sm:space-y-4 text-sm sm:text-base font-bold mb-4">
                    <p className="font-black uppercase text-center text-foreground text-base sm:text-lg">Follow these steps:</p>
                    <ol className="space-y-3 sm:space-y-4 text-foreground">
                      <li className="flex gap-3 sm:gap-4 items-start">
                        <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
                        <span className="flex-1 pt-0.5">Go to: <strong>Settings → Cellular → Add eSIM</strong></span>
                      </li>
                      <li className="flex gap-3 sm:gap-4 items-start">
                        <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
                        <span className="flex-1 pt-0.5">Select <strong>"Enter Details Manually"</strong></span>
                      </li>
                      <li className="flex gap-3 sm:gap-4 items-start">
                        <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
                        <span className="flex-1 pt-0.5">Copy and paste the codes below</span>
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="font-black uppercase text-sm sm:text-base block mb-2 text-foreground">SM-DP+ Address:</label>
                      <div className="flex gap-2">
                        <code className="flex-1 p-3 sm:p-4 bg-white border-2 border-foreground/20 rounded-lg text-xs sm:text-sm break-all font-mono text-foreground">
                          {smdp}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => handleCopy(smdp, 'smdp')}
                          className="bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 font-bold shrink-0 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base py-3 sm:py-4 touch-manipulation"
                        >
                          {copiedField === 'smdp' ? '✓' : 'COPY'}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="font-black uppercase text-sm sm:text-base block mb-2 text-foreground">Activation Code:</label>
                      <div className="flex gap-2">
                        <code className="flex-1 p-3 sm:p-4 bg-white border-2 border-foreground/20 rounded-lg text-xs sm:text-sm break-all font-mono text-foreground">
                          {activationCode}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => handleCopy(activationCode, 'activation')}
                          className="bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 font-bold shrink-0 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base py-3 sm:py-4 touch-manipulation"
                        >
                          {copiedField === 'activation' ? '✓' : 'COPY'}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="font-black uppercase text-sm sm:text-base block mb-2 text-foreground">LPA String (Complete):</label>
                      <div className="flex gap-2">
                        <code className="flex-1 p-3 sm:p-4 bg-white border-2 border-foreground/20 rounded-lg text-xs sm:text-sm break-all font-mono text-foreground">
                          {lpaString}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => handleCopy(lpaString, 'lpa')}
                          className="bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 font-bold shrink-0 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base py-3 sm:py-4 touch-manipulation"
                        >
                          {copiedField === 'lpa' ? '✓' : 'COPY'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-mint/50 rounded-lg border-2 border-foreground/10">
                    <p className="text-xs sm:text-sm font-bold text-center">
                      Use the LPA String for quick entry, or use SM-DP+ Address + Activation Code separately
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="android" className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Method 1: QR Code Scan */}
        <Card className="bg-yellow border-2 sm:border-3 md:border-4 border-foreground shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase">
                METHOD 1: SCAN QR CODE
              </CardTitle>
              <Badge className="bg-foreground text-white font-black uppercase text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5">
                RECOMMENDED
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4 border-2 border-foreground/10">
              <p className="font-black text-sm sm:text-base md:text-lg uppercase text-center text-foreground">
                For all Android phones
              </p>
              <ol className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg font-bold text-foreground">
                <li className="flex gap-3 sm:gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
                  <span className="flex-1 pt-0.5">Go to: <strong>Settings → Network & Internet → SIMs</strong></span>
                </li>
                <li className="flex gap-3 sm:gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
                  <span className="flex-1 pt-0.5">Tap <strong>"Add eSIM"</strong> or the <strong>"+"</strong> button</span>
                </li>
                <li className="flex gap-3 sm:gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
                  <span className="flex-1 pt-0.5">Select <strong>"Scan QR code"</strong></span>
                </li>
                <li className="flex gap-3 sm:gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">4</span>
                  <span className="flex-1 pt-0.5">Point your camera at the QR code below</span>
                </li>
                <li className="flex gap-3 sm:gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">5</span>
                  <span className="flex-1 pt-0.5">Follow prompts to activate your eSIM</span>
                </li>
              </ol>
            </div>

            <div className="text-center">
              <div className="bg-white p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl inline-block shadow-2xl border-2 sm:border-3 md:border-4 border-foreground">
                <Image
                  src={qrUrl}
                  alt="eSIM QR Code"
                  width={280}
                  height={280}
                  className="mx-auto w-full max-w-[180px] sm:max-w-[220px] md:max-w-[280px] h-auto"
                  priority
                />
              </div>
              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 md:p-4 bg-cyan/80 rounded-lg sm:rounded-xl border-2 border-foreground/20">
                <p className="font-black uppercase text-xs sm:text-sm">
                  TIP: Take a screenshot to save this QR code
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Method 2: Manual Entry */}
        <Card className="bg-cyan border-2 sm:border-3 md:border-4 border-foreground shadow-xl">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase">
              METHOD 2: MANUAL ENTRY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Accordion type="single" collapsible className="bg-white/90 rounded-lg sm:rounded-xl">
              <AccordionItem value="manual" className="border-none">
                <AccordionTrigger className="font-black uppercase text-xs sm:text-sm md:text-base px-3 sm:px-4 hover:no-underline">
                  Show Manual Entry Instructions
                </AccordionTrigger>
                <AccordionContent className="space-y-4 sm:space-y-5 px-3 sm:px-4 pb-4 sm:pb-5">
                  <div className="space-y-3 sm:space-y-4 text-sm sm:text-base font-bold mb-4">
                    <p className="font-black uppercase text-center text-foreground text-base sm:text-lg">Follow these steps:</p>
                    <ol className="space-y-3 sm:space-y-4 text-foreground">
                      <li className="flex gap-3 sm:gap-4 items-start">
                        <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">1</span>
                        <span className="flex-1 pt-0.5">Go to: <strong>Settings → Network & Internet → SIMs</strong></span>
                      </li>
                      <li className="flex gap-3 sm:gap-4 items-start">
                        <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
                        <span className="flex-1 pt-0.5">Tap <strong>"Add eSIM"</strong> or <strong>"+"</strong></span>
                      </li>
                      <li className="flex gap-3 sm:gap-4 items-start">
                        <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
                        <span className="flex-1 pt-0.5">Select <strong>"Enter activation code"</strong> or <strong>"Enter manually"</strong></span>
                      </li>
                      <li className="flex gap-3 sm:gap-4 items-start">
                        <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">4</span>
                        <span className="flex-1 pt-0.5">Copy and paste the codes below</span>
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="font-black uppercase text-sm sm:text-base block mb-2 text-foreground">SM-DP+ Address:</label>
                      <div className="flex gap-2">
                        <code className="flex-1 p-3 sm:p-4 bg-white border-2 border-foreground/20 rounded-lg text-xs sm:text-sm break-all font-mono text-foreground">
                          {smdp}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => handleCopy(smdp, 'smdp-android')}
                          className="bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 font-bold shrink-0 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base py-3 sm:py-4 touch-manipulation"
                        >
                          {copiedField === 'smdp-android' ? '✓' : 'COPY'}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="font-black uppercase text-sm sm:text-base block mb-2 text-foreground">Activation Code:</label>
                      <div className="flex gap-2">
                        <code className="flex-1 p-3 sm:p-4 bg-white border-2 border-foreground/20 rounded-lg text-xs sm:text-sm break-all font-mono text-foreground">
                          {activationCode}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => handleCopy(activationCode, 'activation-android')}
                          className="bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 font-bold shrink-0 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base py-3 sm:py-4 touch-manipulation"
                        >
                          {copiedField === 'activation-android' ? '✓' : 'COPY'}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="font-black uppercase text-sm sm:text-base block mb-2 text-foreground">LPA String (Complete):</label>
                      <div className="flex gap-2">
                        <code className="flex-1 p-3 sm:p-4 bg-white border-2 border-foreground/20 rounded-lg text-xs sm:text-sm break-all font-mono text-foreground">
                          {lpaString}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => handleCopy(lpaString, 'lpa-android')}
                          className="bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/90 font-bold shrink-0 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base py-3 sm:py-4 touch-manipulation"
                        >
                          {copiedField === 'lpa-android' ? '✓' : 'COPY'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-mint/50 rounded-lg border-2 border-foreground/10">
                    <p className="text-xs sm:text-sm font-bold text-center">
                      Different Android phones may have slightly different menu names. Look for "eSIM", "SIM Manager", or "Mobile Network" settings.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
  );
}
