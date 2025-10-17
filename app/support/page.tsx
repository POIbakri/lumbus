import Link from 'next/link';
import { Nav } from '@/components/nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Nav />

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 sm:mb-16 px-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 sm:mb-6 leading-tight">
                SUPPORT & FAQS
              </h1>
              <p className="text-base sm:text-lg md:text-xl font-bold">
                Everything you need to know about using Lumbus eSIMs
              </p>
            </div>

            {/* Device Compatibility */}
            <Card className="bg-purple border-2 border-accent shadow-lg mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">IS MY PHONE COMPATIBLE?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-black uppercase text-lg mb-3">iPhone (iOS)</h3>
                  <p className="font-bold mb-3">
                    All iPhones from iPhone XS, XR (2018) and newer support eSIM.
                  </p>
                  <ul className="font-bold space-y-2 ml-6">
                    <li>• iPhone 15 series</li>
                    <li>• iPhone 14 series</li>
                    <li>• iPhone 13 series</li>
                    <li>• iPhone 12 series</li>
                    <li>• iPhone 11 series</li>
                    <li>• iPhone XS, XS Max, XR</li>
                    <li>• iPhone SE (2020 and 2022)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-black uppercase text-lg mb-3">Android</h3>
                  <p className="font-bold mb-3">
                    Most modern Android phones with Android 9+ support eSIM, including:
                  </p>
                  <ul className="font-bold space-y-2 ml-6">
                    <li>• Google Pixel 3 and newer</li>
                    <li>• Samsung Galaxy S20 and newer</li>
                    <li>• Samsung Galaxy Fold series</li>
                    <li>• Motorola Razr (2019) and newer</li>
                    <li>• Oppo Find X3 Pro and newer</li>
                  </ul>
                </div>

                <div className="p-4 bg-white rounded-xl">
                  <h3 className="font-black uppercase text-sm mb-2">HOW TO CHECK</h3>
                  <p className="font-bold text-sm">
                    On iPhone: Settings → Cellular → Add eSIM<br />
                    On Android: Settings → Network & Internet → SIMs → Add eSIM
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Installation Instructions */}
            <Card className="bg-mint border-2 border-primary shadow-lg mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">HOW TO INSTALL YOUR eSIM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-black uppercase text-lg mb-3">ON IPHONE</h3>
                  <ol className="font-bold space-y-3 ml-6">
                    <li>1. Go to Settings → Cellular (or Mobile Data)</li>
                    <li>2. Tap "Add eSIM"</li>
                    <li>3. iOS 17.4+: Tap the "Activate without QR" button we provide</li>
                    <li>4. Older iOS: Scan the QR code or tap "Enter Details Manually"</li>
                    <li>5. Follow on-screen instructions</li>
                    <li>6. Label your eSIM (e.g., "Travel Data")</li>
                  </ol>
                  <p className="font-bold text-sm mt-4">
                    Official Apple guide:{' '}
                    <a
                      href="https://support.apple.com/en-us/HT212780"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      support.apple.com
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="font-black uppercase text-lg mb-3">ON ANDROID</h3>
                  <ol className="font-bold space-y-3 ml-6">
                    <li>1. Go to Settings → Network & Internet → SIMs</li>
                    <li>2. Tap "Add eSIM" or "Download a SIM instead?"</li>
                    <li>3. Scan the QR code with your camera</li>
                    <li>4. Or tap "Enter manually" and copy-paste the details</li>
                    <li>5. Tap "Download" and wait for activation</li>
                    <li>6. Enable the eSIM and set it as your mobile data SIM</li>
                  </ol>
                  <p className="font-bold text-sm mt-4 text-muted-foreground uppercase">
                    Note: Menu names may vary by manufacturer
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* FAQs */}
            <Card className="bg-yellow border-2 border-secondary shadow-lg mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">FREQUENTLY ASKED QUESTIONS</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq-1" className="border-b-2 border-foreground/20">
                    <AccordionTrigger className="font-bold uppercase hover:text-primary">What is an eSIM?</AccordionTrigger>
                    <AccordionContent className="font-bold">
                      An eSIM (embedded SIM) is a digital SIM that's built into your phone. Instead of inserting
                      a physical SIM card, you scan a QR code or use a link to download your mobile plan directly
                      to your device. It's faster, more convenient, and perfect for travelers.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-2" className="border-b-2 border-foreground/20">
                    <AccordionTrigger className="font-bold uppercase hover:text-primary">When does my plan start?</AccordionTrigger>
                    <AccordionContent className="font-bold">
                      Your plan starts when you first connect to a mobile network in the destination region. The
                      validity period (e.g., 30 days) begins from that moment, not from the purchase date.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-3" className="border-b-2 border-foreground/20">
                    <AccordionTrigger className="font-bold uppercase hover:text-primary">Can I use my eSIM on multiple devices?</AccordionTrigger>
                    <AccordionContent className="font-bold">
                      No, each eSIM can only be installed on one device. Once activated, it cannot be transferred
                      to another device. If you need connectivity on multiple devices, you'll need to purchase
                      separate plans.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-4" className="border-b-2 border-foreground/20">
                    <AccordionTrigger className="font-bold uppercase hover:text-primary">What if I lose my QR code?</AccordionTrigger>
                    <AccordionContent className="font-bold">
                      Don't worry! Check your email — we sent your activation details including the QR code and
                      manual entry codes. You can also revisit the installation page using the link in your email.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-5" className="border-b-2 border-foreground/20">
                    <AccordionTrigger className="font-bold uppercase hover:text-primary">Can I get a refund?</AccordionTrigger>
                    <AccordionContent className="font-bold">
                      Refunds are available if your eSIM has not been activated yet. Once you install and activate
                      the eSIM, refunds are no longer possible as the service has been delivered. Please contact
                      support if you need assistance.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-6" className="border-b-2 border-foreground/20">
                    <AccordionTrigger className="font-bold uppercase hover:text-primary">What happens when my data runs out?</AccordionTrigger>
                    <AccordionContent className="font-bold">
                      Your eSIM will stop working once you've used all your data or the validity period expires,
                      whichever comes first. You can purchase a new plan anytime at lumbus.com.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-7" className="border-b-2 border-foreground/20">
                    <AccordionTrigger className="font-bold uppercase hover:text-primary">Do I need to remove my existing SIM?</AccordionTrigger>
                    <AccordionContent className="font-bold">
                      No! You can keep your existing physical SIM card installed. Most modern phones support both
                      a physical SIM and an eSIM at the same time (dual SIM). You can choose which one to use for
                      calls, texts, and data in your phone settings.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-8" className="border-b-2 border-foreground/20">
                    <AccordionTrigger className="font-bold uppercase hover:text-primary">Is there customer support?</AccordionTrigger>
                    <AccordionContent className="font-bold">
                      Yes! If you run into any issues, check your order confirmation email for support contact
                      information, or revisit this page for troubleshooting guides.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="bg-cyan border-2 border-primary shadow-lg text-center">
              <CardContent className="pt-6 pb-6 px-4">
                <h3 className="font-black uppercase text-xl sm:text-2xl mb-3">STILL NEED HELP?</h3>
                <p className="font-bold mb-6 text-sm sm:text-base">
                  Check your order confirmation email for specific activation details
                </p>
                <Link
                  href="/plans"
                  className="inline-block btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base"
                >
                  BROWSE PLANS →
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
