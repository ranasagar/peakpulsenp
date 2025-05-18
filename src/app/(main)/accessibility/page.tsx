
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PersonStanding, Eye, Ear, MousePointerClick } from 'lucide-react'; // Using PersonStanding as a generic accessibility icon

export default function AccessibilityPage() {
  return (
    <div className="container-slim section-padding">
      <div className="text-center mb-16">
        <PersonStanding className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Accessibility Statement
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Peak Pulse is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
        </p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Our Commitment</CardTitle>
          <CardDescription>We strive to make our website accessible and usable for all our customers.</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none text-foreground space-y-4">
          <p>Peak Pulse believes in providing an inclusive online experience. We aim to adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 level AA as our standard. These guidelines explain how to make web content more accessible for people with a wide array of disabilities.</p>

          <h3>Measures Taken</h3>
          <p>We have taken the following measures to ensure accessibility of Peak Pulse&apos;s website:</p>
          <ul>
            <li><strong>Semantic HTML:</strong> We use semantically correct HTML to ensure that content is structured logically and can be easily interpreted by assistive technologies.</li>
            <li><strong>Keyboard Navigation:</strong> Our website is designed to be navigable using a keyboard, ensuring users who cannot use a mouse can still access all content and functionality.</li>
            <li><strong>Alternative Text for Images:</strong> We provide descriptive alternative text for all meaningful images to ensure that users who are visually impaired can understand the content conveyed by images.</li>
            <li><strong>Readable Text:</strong> We strive to use clear, legible fonts and maintain sufficient color contrast between text and its background.</li>
            <li><strong>Accessible Forms:</strong> Our forms are designed with clear labels and instructions, and support assistive technologies for completion.</li>
            <li><strong>Responsive Design:</strong> Our website is responsive and adapts to different screen sizes, improving usability on various devices.</li>
          </ul>

          <h3>Ongoing Efforts</h3>
          <p>Accessibility is an ongoing effort at Peak Pulse. We regularly review our website and make improvements to enhance accessibility. This includes:</p>
          <ul>
            <li>Conducting accessibility audits and testing.</li>
            <li>Training our team on accessibility best practices.</li>
            <li>Staying updated with the latest accessibility standards and guidelines.</li>
          </ul>
          
          <h3>Feedback</h3>
          <p>We welcome your feedback on the accessibility of Peak Pulse. If you encounter any accessibility barriers or have suggestions on how we can improve, please let us know:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:accessibility@peakpulse.com" className="text-primary hover:underline">accessibility@peakpulse.com</a></li>
            <li><strong>Contact Form:</strong> Via our <a href="/contact" className="text-primary hover:underline">Contact Page</a></li>
          </ul>
          <p>We aim to respond to accessibility feedback within 5 business days.</p>

          <h3>Compatibility with Browsers and Assistive Technology</h3>
          <p>Peak Pulse is designed to be compatible with modern browsers and assistive technologies. We recommend using the latest versions of your browser and assistive technology for the best experience.</p>

          <p>This statement was last updated on {new Date().toLocaleDateString()}.</p>
        </CardContent>
      </Card>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <Card className="p-6 bg-card">
              <Eye className="h-10 w-10 text-primary mx-auto mb-3"/>
              <h4 className="font-semibold text-lg">Visual Accessibility</h4>
              <p className="text-sm text-muted-foreground">Resizable text, sufficient contrast, and alt text for images.</p>
          </Card>
          <Card className="p-6 bg-card">
              <Ear className="h-10 w-10 text-primary mx-auto mb-3"/>
              <h4 className="font-semibold text-lg">Auditory Accessibility</h4>
              <p className="text-sm text-muted-foreground">Transcripts or captions for video content where applicable.</p>
          </Card>
          <Card className="p-6 bg-card">
              <MousePointerClick className="h-10 w-10 text-primary mx-auto mb-3"/>
              <h4 className="font-semibold text-lg">Motor Accessibility</h4>
              <p className="text-sm text-muted-foreground">Full keyboard navigation and clear focus indicators.</p>
          </Card>
      </div>
    </div>
  );
}

    