
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
>(({ className, children, dangerouslySetInnerHTML, ...props }, ref) => {
  const basePrimitiveClassName = "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down";

  if (dangerouslySetInnerHTML) {
    // If dangerouslySetInnerHTML is provided, pass only it, ref, and necessary structural classes.
    // Do not spread ...props here to avoid passing an implicit children prop.
    return (
      <AccordionPrimitive.Content
        ref={ref}
        className={cn(basePrimitiveClassName, "pb-4 pt-0", className)} // Apply padding here
        dangerouslySetInnerHTML={dangerouslySetInnerHTML}
        // Only include other essential props from AccordionPrimitive.Content if needed,
        // but avoid anything that could conflict with dangerouslySetInnerHTML.
      />
    );
  }

  // If dangerouslySetInnerHTML is not provided, use children.
  // Wrap children in a div for standard padding and styling.
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={basePrimitiveClassName}
      {...props} // Spread other props, which will include children if passed.
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
})
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
