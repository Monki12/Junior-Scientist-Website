
import { redirect } from 'next/navigation';

// This page exists only to resolve a build-time routing conflict.
// The public /events page is at src/app/events/page.tsx.
// The internal dashboard event management page is at /my-events.
// This redirect ensures that if a user somehow navigates to /events while in the dashboard,
// they are sent to the correct internal page.
export default function ConflictingEventsPage() {
  redirect('/my-events');
}
