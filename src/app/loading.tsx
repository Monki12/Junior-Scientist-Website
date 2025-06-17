
import { Loader2, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground p-4 text-center">
      <Sparkles className="h-16 w-16 text-primary mb-6 animate-pulse" />
      <h1 className="text-3xl font-semibold mb-3">Loading experience...</h1>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground mt-4 text-sm">
        Please wait while we prepare everything for you.
      </p>
    </div>
  );
}
