
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function CareersPage() {
  const currentOpenings = [
    // { title: "Senior Textile Designer", location: "Kathmandu, Nepal", type: "Full-time", link: "#" },
    // { title: "Digital Marketing Specialist", location: "Remote / Kathmandu", type: "Full-time", link: "#" },
  ];

  return (
    <div className="container-wide section-padding">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-b from-primary/5 to-transparent text-center">
        <Briefcase className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
          Join the Peak Pulse Team
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Help us weave the future of Nepali craftsmanship and contemporary fashion. We&apos;re looking for passionate individuals to grow with us.
        </p>
      </section>

      <div className="mt-16 md:mt-24 space-y-16 md:space-y-24">
        {/* Why Work With Us Section */}
        <section>
            <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold text-foreground">Why Peak Pulse?</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                    <Users className="h-10 w-10 text-accent mx-auto mb-4"/>
                    <CardTitle className="text-xl mb-2">Impactful Work</CardTitle>
                    <CardDescription>Be part of a brand that champions ethical production, cultural preservation, and community empowerment in Nepal.</CardDescription>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                    <Sparkles className="h-10 w-10 text-primary mx-auto mb-4"/>
                    <CardTitle className="text-xl mb-2">Creative Environment</CardTitle>
                    <CardDescription>Join a dynamic team where innovation, collaboration, and passion for design and craftsmanship thrive.</CardDescription>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                    <Briefcase className="h-10 w-10 text-green-500 mx-auto mb-4"/>
                    <CardTitle className="text-xl mb-2">Growth Opportunities</CardTitle>
                    <CardDescription>We are a growing company offering opportunities for professional development and making a real difference.</CardDescription>
                </Card>
            </div>
        </section>
        
        {/* Current Openings Section */}
        <section>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Current Openings</CardTitle>
              <CardDescription>Explore opportunities to join our talented team.</CardDescription>
            </CardHeader>
            <CardContent>
              {currentOpenings.length > 0 ? (
                <ul className="space-y-6">
                  {currentOpenings.map((job, index) => (
                    <li key={index} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.location} &bull; {job.type}</p>
                      </div>
                      <Button asChild variant="outline" className="mt-3 sm:mt-0">
                        <Link href={job.link}>View Details</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-xl font-semibold text-foreground mb-2">No Open Positions Currently</p>
                  <p className="text-muted-foreground">We are always looking for talented individuals. Please check back later or send us your resume.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* How to Apply Section */}
         <section className="bg-card rounded-xl p-10 md:p-16 border">
            <div className="grid md:grid-cols-2 gap-10 items-center">
                 <div className="rounded-lg overflow-hidden">
                    <AspectRatio ratio={4/3}>
                    <Image 
                        src="https://placehold.co/600x450.png"
                        alt="Peak Pulse team collaborating" 
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-500 hover:scale-105"
                        data-ai-hint="team collaboration office"
                    />
                    </AspectRatio>
                 </div>
                <div>
                    <h2 className="text-3xl font-semibold text-foreground mb-6">General Applications</h2>
                    <p className="text-lg text-muted-foreground mb-4">
                    Don&apos;t see a role that fits your profile? We&apos;re always keen to hear from talented individuals passionate about our mission.
                    </p>
                    <p className="text-lg text-muted-foreground mb-8">
                    Feel free to send your resume and a cover letter explaining why you&apos;d be a great fit for Peak Pulse to <a href="mailto:careers@peakpulse.com" className="text-primary hover:underline">careers@peakpulse.com</a>.
                    </p>
                    <Button size="lg">Email Us Your CV</Button>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
}

    