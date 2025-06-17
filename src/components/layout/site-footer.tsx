export default function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} EventFlow. All rights reserved.</p>
        <p className="mt-1">
          Powered by Innovation | Designed for Connection
        </p>
      </div>
    </footer>
  );
}
