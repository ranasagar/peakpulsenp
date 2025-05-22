
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Recycle, ShieldCheck, Globe } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout'; // Import MainLayout

export default function SustainabilityPage() {
  return (
    <MainLayout> {/* Wrap content with MainLayout */}
      <div className="container-wide section-padding">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-green-500/5 to-transparent text-center">
          <Leaf className="h-16 w-16 text-green-600 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Our Commitment to Sustainability
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            At Peak Pulse, we believe fashion and sustainability go hand-in-hand. We are dedicated to minimizing our environmental impact and promoting ethical practices throughout our supply chain.
          </p>
        </section>

        <div className="mt-16 md:mt-24 space-y-16 md:space-y-24">
          {/* Materials Section */}
          <section>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                      <h2 className="text-3xl font-semibold text-foreground mb-6 flex items-center">
                          <Recycle className="h-8 w-8 mr-3 text-green-500"/> Mindful Materials
                      </h2>
                      <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                      We prioritize the use of eco-friendly materials, including organic cotton, recycled fibers, and innovative textiles like Himalayan Nettle (Allo). These choices reduce water consumption, pesticide use, and landfill waste.
                      </p>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                      Our sourcing process involves rigorous checks for sustainability certifications and material traceability. We constantly explore new ways to incorporate greener alternatives without compromising on quality or design.
                      </p>
                  </div>
                   <div className="rounded-xl overflow-hidden shadow-2xl">
                      <AspectRatio ratio={16/10}>
                      <Image
                          src="https://placehold.co/800x500.png"
                          alt="Sustainable fabrics and materials"
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                          data-ai-hint="fabric textile sustainable"
                      />
                      </AspectRatio>
                   </div>
              </div>
          </section>

          <Separator />

          {/* Ethical Production Section */}
          <section>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="md:order-2">
                      <h2 className="text-3xl font-semibold text-foreground mb-6 flex items-center">
                          <ShieldCheck className="h-8 w-8 mr-3 text-blue-500"/>Ethical Production
                      </h2>
                      <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                      Peak Pulse is committed to fair labor practices. We partner with artisan cooperatives and workshops in Nepal that ensure safe working conditions, fair wages, and opportunities for skill development.
                      </p>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                      We believe in transparency and work closely with our partners to uphold ethical standards. By supporting Peak Pulse, you contribute to the empowerment of local communities and the preservation of traditional craftsmanship.
                      </p>
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-2xl md:order-1">
                      <AspectRatio ratio={16/10}>
                      <Image
                          src="https://placehold.co/800x500.png"
                          alt="Artisans working in an ethical environment"
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                          data-ai-hint="artisans craft ethical"
                      />
                      </AspectRatio>
                  </div>
              </div>
          </section>

          <Separator />

          {/* Our Goals Section */}
          <section className="text-center">
              <h2 className="text-3xl font-semibold text-foreground mb-12">Our Green Goals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Card className="p-8 bg-card hover:shadow-xl transition-shadow text-left">
                      <Globe className="h-10 w-10 text-primary mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">Carbon Footprint Reduction</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">We are actively working to measure and reduce our carbon emissions through optimized logistics, renewable energy in partner workshops, and sustainable packaging.</p>
                  </Card>
                  <Card className="p-8 bg-card hover:shadow-xl transition-shadow text-left">
                      <Recycle className="h-10 w-10 text-green-500 mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">Circular Economy Initiatives</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">Exploring take-back programs and designing for durability and recyclability to move towards a more circular fashion model.</p>
                  </Card>
                  <Card className="p-8 bg-card hover:shadow-xl transition-shadow text-left">
                      <Leaf className="h-10 w-10 text-accent mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">Continuous Improvement</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">Sustainability is an ongoing journey. We are committed to continuously learning, innovating, and improving our practices to better serve our planet and people.</p>
                  </Card>
              </div>
          </section>

           <section className="bg-primary/5 rounded-xl p-10 md:p-16 text-center">
              <h2 className="text-3xl font-semibold text-foreground mb-6">Join Us in Making a Difference</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Learn more about our initiatives and how you can contribute to a more sustainable future through conscious consumer choices.
              </p>
              <Button variant="outline" asChild>
                  <Link href="/contact">Contact Us for More Info</Link>
              </Button>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
