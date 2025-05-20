
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InteractiveExternalLink } from '@/components/interactive-external-link';

const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data: ContactFormValues) => {
    // Mock API call
    console.log("Contact form data:", data);
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you soon.",
    });
    form.reset();
  };

  const mapEmbedUrl = "https://www.openstreetmap.org/export/embed.html?bbox=85.30909061431886%2C27.71304485171967%2C85.31865119934083%2C27.71809090070017&amp;layer=mapnik&amp;marker=27.71556790139344%2C85.31387090682983";
  const mapDisplayUrl = "https://www.openstreetmap.org/?mlat=27.71557&mlon=85.31387#map=17/27.71557/85.31387";


  return (
    <div className="container-wide section-padding">
      <div className="text-center mb-16">
        <Mail className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">Get in Touch</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          We&apos;d love to hear from you. Whether you have a question about our products, our story, or anything else, our team is ready to answer all your questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Contact Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Send Us a Message</CardTitle>
            <CardDescription>Fill out the form below and we&apos;ll respond as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="What is your message about?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Write your message here..." className="min-h-[150px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  <Send className="mr-2 h-5 w-5" /> Send Message
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Contact Information & Map */}
        <div className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Contact Information</CardTitle>
              <CardDescription>Reach out to us directly or visit our store.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-muted-foreground">
              <div className="flex items-start">
                <MapPin className="h-6 w-6 mr-4 mt-1 text-primary shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">Our Studio & Store</h4>
                   <InteractiveExternalLink href={mapDisplayUrl} className="hover:text-primary" showDialog={true}>
                      <p>Peak Pulse Designs</p>
                      <p>123 Artisan Lane, Thamel</p>
                      <p>Kathmandu, Nepal</p>
                   </InteractiveExternalLink>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-4 text-primary shrink-0" />
                <a href="mailto:info@peakpulse.com" className="hover:text-primary">info@peakpulse.com</a>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-4 text-primary shrink-0" />
                <a href="tel:+97712345678" className="hover:text-primary">+977 123 45678</a>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg overflow-hidden">
             <CardHeader>
                 <CardTitle className="text-xl">Find Us Here</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="aspect-video bg-muted w-full h-full">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={mapEmbedUrl}
                    title="Peak Pulse Location in Thamel, Kathmandu"
                    aria-label="Map showing location of Peak Pulse in Thamel, Kathmandu"
                    className="border-0"
                  ></iframe>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
