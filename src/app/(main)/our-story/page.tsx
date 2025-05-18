
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Mountain, Users, Handshake, Sparkles, Facebook, Instagram, Twitter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface OurStoryContent {
  hero: { title: string; description: string; };
  mission: { title: string; paragraph1: string; paragraph2: string; };
  craftsmanship: { title: string; paragraph1: string; paragraph2: string; };
  valuesSection: { title: string; };
  joinJourneySection: { title: string; description: string; };
}

async function getOurStoryContent(): Promise<OurStoryContent> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const res = await fetch(`${baseUrl}/api/content/our-story`, { cache: 'no-store' });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Failed to fetch Our Story content: ${res.status} ${res.statusText}`, errorBody);
      throw new Error(`Failed to fetch Our Story content: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching Our Story content in page.tsx:", error);
    // Fallback content
    return {
      hero: { title: "The Heart of Peak Pulse (Fallback)", description: "Content failed to load. Weaving together heritage and vision." },
      mission: { title: "Our Mission (Fallback)", paragraph1: "Content failed to load. Elevating craftsmanship.", paragraph2: "Content failed to load. Connecting cultures." },
      craftsmanship: { title: "The Art of Creation (Fallback)", paragraph1: "Content failed to load. Honoring traditions.", paragraph2: "Content failed to load. Sourcing quality." },
      valuesSection: { title: "Our Values: Beyond the Seams (Fallback)" },
      joinJourneySection: { title: "Join Our Journey (Fallback)", description: "Content failed to load. Follow us for updates." }
    };
  }
}


export default async function OurStoryPage() {
  const content = await getOurStoryContent();

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container-wide text-center">
          <Mountain className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            {content.hero.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {content.hero.description}
          </p>
        </div>
      </section>

      <div className="container-wide section-padding pt-12 md:pt-16"> {/* Reduced top padding for this container */}
        {/* Mission Section */}
        <section className="mb-16 md:mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-semibold text-foreground mb-6">{content.mission.title}</h2>
                    <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                    {content.mission.paragraph1}
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                    {content.mission.paragraph2}
                    </p>
                </div>
                 <div className="rounded-xl overflow-hidden shadow-2xl">
                    <AspectRatio ratio={4/3}>
                    <Image 
                        src="https://placehold.co/800x600.png"
                        alt="Nepali artisans crafting traditional textiles" 
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-500 hover:scale-105"
                        data-ai-hint="artisans nepal craft"
                    />
                    </AspectRatio>
                 </div>
            </div>
        </section>
        
        <Separator className="my-16 md:my-24" />

        {/* Craftsmanship Section */}
        <section className="mb-16 md:mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="md:order-2">
                    <h2 className="text-3xl font-semibold text-foreground mb-6">{content.craftsmanship.title}</h2>
                    <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                    {content.craftsmanship.paragraph1}
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                    {content.craftsmanship.paragraph2}
                    </p>
                </div>
                <div className="rounded-xl overflow-hidden shadow-2xl md:order-1">
                    <AspectRatio ratio={4/3}>
                    <Image 
                        src="https://placehold.co/800x600.png"
                        alt="Detailed view of hand-woven fabric or intricate embroidery" 
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-500 hover:scale-105"
                        data-ai-hint="textile fabric detail"
                    />
                    </AspectRatio>
                </div>
            </div>
        </section>

        <Separator className="my-16 md:my-24" />
        
        {/* Community & Values Section */}
        <section className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl font-semibold text-foreground mb-12">{content.valuesSection.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <Card className="p-8 bg-card hover:shadow-xl transition-shadow">
                    <Handshake className="h-12 w-12 text-primary mx-auto mb-5" />
                    <h3 className="text-xl font-semibold text-foreground mb-3">Ethical Partnerships</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">We collaborate directly with artisan cooperatives, ensuring fair wages, safe working conditions, and sustainable livelihoods.</p>
                </Card>
                <Card className="p-8 bg-card hover:shadow-xl transition-shadow">
                    <Sparkles className="h-12 w-12 text-accent mx-auto mb-5" />
                    <h3 className="text-xl font-semibold text-foreground mb-3">Cultural Preservation</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">Our designs celebrate and help preserve Nepal&apos;s rich artistic heritage for future generations to appreciate and continue.</p>
                </Card>
                <Card className="p-8 bg-card hover:shadow-xl transition-shadow">
                    <Users className="h-12 w-12 text-green-500 mx-auto mb-5" />
                    <h3 className="text-xl font-semibold text-foreground mb-3">Community Empowerment</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">A portion of our profits is reinvested into community projects focused on education and skill development in artisan communities.</p>
                </Card>
            </div>
        </section>
        
        {/* Call to Action or Behind the Scenes */}
         <section className="bg-primary/5 rounded-xl p-10 md:p-16">
            <div className="text-center">
                <h2 className="text-3xl font-semibold text-foreground mb-6">{content.joinJourneySection.title}</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {content.joinJourneySection.description}
                </p>
                <div className="flex justify-center space-x-4">
                    <Button variant="outline" asChild>
                       <Link href="https://instagram.com/peakpulse" target="_blank" rel="noopener noreferrer">
                            <Instagram className="mr-2 h-5 w-5" /> Instagram
                       </Link>
                    </Button>
                     <Button variant="outline" asChild>
                       <Link href="https://facebook.com/peakpulse" target="_blank" rel="noopener noreferrer">
                            <Facebook className="mr-2 h-5 w-5" /> Facebook
                       </Link>
                    </Button>
                     <Button variant="outline" asChild>
                       <Link href="https://twitter.com/peakpulse" target="_blank" rel="noopener noreferrer">
                            <Twitter className="mr-2 h-5 w-5" /> Twitter
                       </Link>
                    </Button>
                </div>
            </div>
        </section>
      </div>
    </>
  );
}
