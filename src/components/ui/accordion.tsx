
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, dangerouslySetInnerHTML, ...otherProps }, ref) => {
  const basePrimitiveClassName = "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down";

  if (dangerouslySetInnerHTML) {
    // When dangerouslySetInnerHTML is used, do NOT pass the children prop.
    // otherProps will contain all props except className, children, and dangerouslySetInnerHTML.
    return (
      <AccordionPrimitive.Content
        ref={ref}
        className={cn(basePrimitiveClassName, "pb-4 pt-0", className)} // Apply padding directly for DSIHTML
        dangerouslySetInnerHTML={dangerouslySetInnerHTML}
        {...otherProps} // Spread only the remaining otherProps
      />
    );
  }

  // When children are used (and no dangerouslySetInnerHTML)
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(basePrimitiveClassName, className)} // className is applied to the primitive
      {...otherProps} // Spread otherProps (which includes children in this path)
    >
      {/* Inner div for padding when using children */}
      <div className="pb-4 pt-0">{children}</div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
