
"use client"; // Keep if Header, Footer, or ChatbotWidget need client context

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
