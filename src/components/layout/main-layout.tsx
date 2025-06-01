
"use client"; 

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header"; // This is now the TopBar
import { BottomNavigation } from "@/components/layout/bottom-navigation"; // Import new component
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header /> {/* This acts as TopBar */}
      <main className="flex-grow">{children}</main>
      <BottomNavigation /> {/* Added BottomNavigation here */}
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
