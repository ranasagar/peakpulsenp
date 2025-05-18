
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, ShoppingBag, Truck, RotateCcw, ShieldQuestion } from 'lucide-react';

const faqs = [
  {
    id: 'faq-1',
    question: 'What makes Peak Pulse clothing unique?',
    answer: 'Peak Pulse blends traditional Nepali craftsmanship with contemporary streetwear aesthetics. We focus on high-quality, often sustainable materials, ethical production, and designs that tell a story of Nepal\'s rich cultural heritage.',
    icon: ShoppingBag,
  },
  {
    id: 'faq-2',
    question: 'Where are your products made?',
    answer: 'All our products are proudly designed and ethically crafted in Nepal, primarily in the Kathmandu Valley. We partner with local artisans and cooperatives to ensure fair wages and support traditional skills.',
    icon: ShoppingBag,
  },
  {
    id: 'faq-3',
    question: 'What are your shipping options and costs?',
    answer: 'We offer domestic shipping within Nepal and international shipping to select countries. Domestic shipping typically costs a flat rate (e.g., रू500). International shipping costs and times are calculated at checkout based on your destination and are estimated using AI for competitive rates. Please see our <a href="/shipping-returns" class="text-primary hover:underline">Shipping & Returns</a> page for more details.',
    icon: Truck,
  },
  {
    id: 'faq-4',
    question: 'What is your return policy?',
    answer: 'We accept returns for most items within 14 days of delivery, provided they are in original condition with tags attached. Some exclusions may apply. For detailed information, please visit our <a href="/shipping-returns#returns" class="text-primary hover:underline">Shipping & Returns</a> page.',
    icon: RotateCcw,
  },
  {
    id: 'faq-5',
    question: 'How do I care for my Peak Pulse garments?',
    answer: 'Care instructions vary by product. Generally, we recommend gentle machine wash or hand wash for most items. Specific care details can be found on the product label and on each product page on our website under "Care Instructions".',
    icon: ShoppingBag,
  },
  {
    id: 'faq-6',
    question: 'Do you offer international shipping?',
    answer: 'Yes, we ship to many countries worldwide! International shipping rates and estimated delivery times are calculated at checkout. Our system uses AI to provide competitive shipping estimates from Kathmandu, Nepal.',
    icon: Truck,
  },
  {
    id: 'faq-7',
    question: 'How can I track my order?',
    answer: 'Once your order is shipped, you will receive a confirmation email with a tracking number and a link to track your package. You can also track your order status by logging into your account on our website.',
    icon: Truck,
  },
  {
    id: 'faq-8',
    question: 'What payment methods do you accept?',
    answer: 'For domestic (Nepal) orders, we accept major local payment gateways like eSewa, Khalti, IME Pay, ConnectIPS, QR payments, bank transfers, and Cash on Delivery (COD may require an advance). For international orders, we accept major credit/debit cards.',
    icon: ShieldQuestion,
  },
  {
    id: 'faq-9',
    question: 'Are your materials sustainable?',
    answer: 'Sustainability is a core value at Peak Pulse. We prioritize eco-friendly materials such as organic cotton, recycled fibers, and traditional Nepali textiles like Allo (Himalayan Nettle). We are continuously working to improve our sustainability practices. Learn more on our <a href="/sustainability" class="text-primary hover:underline">Sustainability</a> page.',
    icon: ShoppingBag,
  },
   {
    id: 'faq-10',
    question: 'How can I contact customer support?',
    answer: 'You can reach our customer support team via email at support@peakpulse.com, by phone at +977-1-xxxxxxx, or by filling out the contact form on our <a href="/contact" class="text-primary hover:underline">Contact Us</a> page. Our AI Chatbot is also available 24/7 for quick answers to common questions.',
    icon: HelpCircle,
  },
];

export default function FaqPage() {
  return (
    <div className="container-slim section-padding">
      <div className="text-center mb-16">
        <HelpCircle className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about our products, shipping, returns, and more. If you can&apos;t find your answer here, feel free to contact us.
        </p>
      </div>

      <Card className="shadow-xl">
        <CardContent className="p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline text-left py-5">
                  <div className="flex items-start">
                    {faq.icon && <faq.icon className="h-6 w-6 mr-4 mt-1 text-primary shrink-0" />}
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground prose dark:prose-invert max-w-none leading-relaxed pl-12 pb-5" dangerouslySetInnerHTML={{ __html: faq.answer }} />
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

    