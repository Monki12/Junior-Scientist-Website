// This file's path conflicts with the public /events page.
// It is replaced with a server-side redirect to the correct dashboard events page.
import { redirect } from 'next/navigation';

export default function ConflictingEventsPage() {
  // Redirect any traffic hitting this invalid path to the correct dashboard path.
  redirect('/my-events');
  // The redirect function throws an error, so no component is ever rendered.
  return null;
}
