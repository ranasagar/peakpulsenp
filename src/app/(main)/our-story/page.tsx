
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Mountain, Users, Handshake, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function OurStoryPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container-wide text-center">
          <Mountain className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            The Heart of Peak Pulse
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Weaving together the threads of Nepali heritage and contemporary vision, Peak Pulse is more than a brand – it&apos;s a celebration of culture, craftsmanship, and connection.
          </p>
        </div>
      </section>

      <div className="container-wide section-padding">
        {/* Mission Section */}
        <section className="mb-16 md:mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-semibold text-foreground mb-6">Our Mission: Threads of Tradition, Woven for Tomorrow</h2>
                    <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                    At Peak Pulse, our mission is to elevate Nepali craftsmanship onto the global stage. We believe in fashion that tells a story, pieces that carry the soul of their origin, and a business model that empowers communities.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                    We strive to create contemporary streetwear that not only looks and feels exceptional but also fosters a deeper connection to the rich cultural tapestry of Nepal. Each garment is a dialogue between age-old traditions and modern aesthetics.
                    </p>
                </div>
                 <div className="rounded-xl overflow-hidden shadow-2xl">
                    <AspectRatio ratio={4/3}>
                    <Image 
                        src="https://placehold.co/800x600.png?text=Nepali+Artisans" 
                        alt="Nepali artisans working" 
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
                    <h2 className="text-3xl font-semibold text-foreground mb-6">The Art of Creation: Handcrafted with Passion</h2>
                    <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                    Our collections are born from a meticulous process that honors traditional techniques. From hand-loomed textiles to intricate embroidery, every detail is thoughtfully considered and executed by skilled artisans.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                    We source high-quality, sustainable materials, often locally, to ensure that our products are not only beautiful but also kind to the planet. This dedication to quality and sustainability is woven into the very fabric of Peak Pulse.
                    </p>
                </div>
                <div className="rounded-xl overflow-hidden shadow-2xl md:order-1">
                    <AspectRatio ratio={4/3}>
                    <Image 
                        src="https://placehold.co/800x600.png?text=Textile+Details" 
                        alt="Detailed view of fabric or craft" 
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
            <h2 className="text-3xl font-semibold text-foreground mb-12">Our Values: Beyond the Seams</h2>
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
                <h2 className="text-3xl font-semibold text-foreground mb-6">Join Our Journey</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Follow us on social media for behind-the-scenes glimpses, artisan stories, and the latest from Peak Pulse. Be part of a community that values authenticity, quality, and conscious consumption.
                </p>
                {/* Placeholder for social links or button to a blog/gallery */}
                <div className="flex justify-center space-x-4">
                    {/* Example: <Button variant="outline">Follow on Instagram</Button> */}
                    <p className="text-sm text-muted-foreground">Placeholder for social media links or a gallery.</p>
                </div>
            </div>
        </section>

      </div>
    </>
  );
}
