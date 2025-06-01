
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header"; // This is now the TopBar
import { BottomNavigation } from "@/components/layout/bottom-navigation"; // Import new component
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget"; // Added for consistency

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header /> {/* TopBar */}
      <main className="flex-grow bg-background">
        <div className="container-slim section-padding">
            {children}
        </div>
      </main>
      <BottomNavigation /> {/* Added BottomNavigation */}
      <Footer />
      <ChatbotWidget /> {/* Added ChatbotWidget */}
    </div>
  );
}
