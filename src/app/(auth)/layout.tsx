
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Minimal layout for auth pages, no main Header or Footer
    // Background can be styled here if needed, or within individual auth pages
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {children}
    </div>
  );
}
