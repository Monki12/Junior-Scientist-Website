// This file is intentionally left without a default export.
// It previously caused a build error because it conflicted with src/app/events/page.tsx.
// By removing the default export, this file no longer creates a page at this route,
// resolving the Next.js path conflict.
// The redirect logic for staff has been moved to src/app/events/page.tsx.

export const placeholder = true;
