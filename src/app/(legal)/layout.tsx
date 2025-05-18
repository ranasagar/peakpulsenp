
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-background">
        <div className="container-slim section-padding">
            {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
