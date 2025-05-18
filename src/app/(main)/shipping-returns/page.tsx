
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, RotateCcw, MapPin, PackageOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ShippingReturnsPage() {
  return (
    <div className="container-slim section-padding">
      <div className="text-center mb-16">
        <Truck className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Shipping & Returns
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Information about how we get our products to you and how to handle returns.
        </p>
      </div>

      <div className="space-y-12">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><MapPin className="mr-3 h-7 w-7 text-primary"/>Shipping Information</CardTitle>
            <CardDescription>Details about our shipping process from Kathmandu, Nepal.</CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none text-foreground space-y-4">
            <h3>Domestic Shipping (Within Nepal)</h3>
            <ul>
              <li><strong>Processing Time:</strong> Orders are typically processed within 1-2 business days.</li>
              <li><strong>Delivery Time:</strong> Expect delivery within 2-5 business days after processing, depending on your location within Nepal.</li>
              <li><strong>Cost:</strong> We offer a flat rate shipping fee of NPR 150 for orders within Kathmandu Valley and NPR 250 for orders outside the Valley. Free shipping may be available for orders above a certain value (e.g., NPR 5,000).</li>
              <li><strong>Carriers:</strong> We partner with reliable local courier services.</li>
            </ul>

            <h3>International Shipping</h3>
            <ul>
              <li><strong>Processing Time:</strong> International orders are typically processed within 2-3 business days.</li>
              <li><strong>Delivery Time & Cost:</strong> Estimated delivery times and shipping costs are calculated at checkout based on your destination country and package weight. Our system uses AI to provide competitive rates from Kathmandu, Nepal. Delivery times can range from 7-21 business days, depending on the destination and selected shipping service.</li>
              <li><strong>Customs & Duties:</strong> Please note that international orders may be subject to import duties, taxes, and customs processing fees, which are the responsibility of the recipient. Peak Pulse is not responsible for these charges. We recommend checking with your local customs office for more information.</li>
              <li><strong>Tracking:</strong> All international orders come with tracking information, which will be provided once your order is shipped.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-xl" id="returns">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><RotateCcw className="mr-3 h-7 w-7 text-primary"/>Return & Exchange Policy</CardTitle>
            <CardDescription>Our policy for returns and exchanges.</CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none text-foreground space-y-4">
            <h3>General Conditions for Returns & Exchanges</h3>
            <ul>
              <li>Items must be returned within <strong>14 days</strong> of the delivery date.</li>
              <li>Items must be in their original, unworn, unwashed condition, with all tags attached.</li>
              <li>Proof of purchase (order number or receipt) is required.</li>
              <li>Sale items, custom orders, and certain accessories (e.g., face masks, undergarments) may be non-returnable. This will be indicated on the product page.</li>
            </ul>

            <h3>How to Initiate a Return/Exchange</h3>
            <ol>
              <li>Contact our customer support team at <a href="mailto:returns@peakpulse.com" className="text-primary hover:underline">returns@peakpulse.com</a> with your order number and reason for return/exchange.</li>
              <li>Once approved, we will provide you with return instructions and a return shipping address (if applicable).</li>
              <li>Package your item securely. Customers are typically responsible for return shipping costs unless the item is faulty or incorrect.</li>
            </ol>
            
            <h3>Refunds</h3>
            <ul>
              <li>Once we receive and inspect your returned item, we will notify you of the approval or rejection of your refund.</li>
              <li>If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 7-10 business days. Shipping costs are non-refundable.</li>
            </ul>

            <h3>Exchanges</h3>
            <ul>
              <li>If you wish to exchange an item for a different size or color, please contact us. Exchanges are subject to availability.</li>
            </ul>

            <h3>Faulty or Incorrect Items</h3>
            <ul>
              <li>If you receive a faulty or incorrect item, please contact us immediately with photos of the issue. We will arrange for a replacement or refund, including any shipping costs incurred.</li>
            </ul>
          </CardContent>
        </Card>

         <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center"><PackageOpen className="mr-3 h-7 w-7 text-primary"/>Packaging</CardTitle>
            <CardDescription>Our approach to packaging your orders.</CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none text-foreground space-y-4">
            <p>We are committed to sustainable packaging. Whenever possible, we use recycled, recyclable, or biodegradable materials for shipping your Peak Pulse orders. We aim to minimize waste while ensuring your items arrive safely.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    