'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This is a temporary component to resolve a routing conflict between the public
// /events page and an internal dashboard page at the same path.
// This component redirects authenticated users from the conflicting path back to their main dashboard.
export default function EventsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main dashboard page to avoid the path conflict.
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2 text-muted-foreground">Redirecting...</p>
    </div>
  );
}
