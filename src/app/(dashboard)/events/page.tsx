
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This is a temporary component to resolve a routing conflict.
// It redirects from the conflicting '/events' path in the dashboard to the student management page,
// which is a more logical place for event-related data management until a dedicated page is built.
export default function EventsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/students');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2 text-muted-foreground">Redirecting to student management...</p>
    </div>
  );
}
