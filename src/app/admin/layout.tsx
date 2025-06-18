
// This is a basic admin layout. 
// You can expand this later with shared navigation, sidebars, etc.
// For now, it just ensures children are rendered.
// Middleware will handle auth protection for all routes under /admin.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* 
        Future: Add a shared admin navbar or sidebar here if needed.
        Example:
        <header className="bg-primary text-primary-foreground p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            // Logout button could also go here
          </div>
        </header>
      */}
      <main>{children}</main>
    </div>
  );
}
