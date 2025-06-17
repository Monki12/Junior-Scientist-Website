'use client';

import { useState, useEffect } from 'react';
import EventCard from '@/components/event-card';
import type { Event } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ListFilter, Loader2 } from 'lucide-react';

// Mock data for events
const mockEvents: Event[] = [
  { id: '1', title: 'Tech Conference 2024', description: 'Join us for the latest in tech innovation.', date: '2024-10-15', time: '09:00 AM', location: 'Convention Center', organizerId: 'org1', imageUrl: 'https://placehold.co/600x400.png?a=1', category: 'Technology', dataAiHint: 'tech conference' },
  { id: '2', title: 'Art Workshop', description: 'Explore your creative side with our hands-on art workshop.', date: '2024-11-05', time: '02:00 PM', location: 'Community Art Studio', organizerId: 'org2', imageUrl: 'https://placehold.co/600x400.png?a=2', category: 'Arts & Culture', dataAiHint: 'art workshop' },
  { id: '3', title: 'Music Festival', description: 'A weekend of live music from various artists.', date: '2024-09-20', time: '12:00 PM', location: 'City Park', organizerId: 'org3', imageUrl: 'https://placehold.co/600x400.png?a=3', category: 'Music', dataAiHint: 'music festival' },
  { id: '4', title: 'Startup Pitch Night', description: 'Witness innovative startups pitch their ideas.', date: '2024-10-25', time: '06:00 PM', location: 'Innovation Hub', organizerId: 'org1', imageUrl: 'https://placehold.co/600x400.png?a=4', category: 'Business', dataAiHint: 'startup pitch' },
  { id: '5', title: 'Food Fair Extravaganza', description: 'Taste delicacies from around the world.', date: '2024-11-12', time: '11:00 AM', location: 'Exhibition Grounds', organizerId: 'org4', imageUrl: 'https://placehold.co/600x400.png?a=5', category: 'Food & Drink', dataAiHint: 'food fair' },
  { id: '6', title: 'Literary Fest', description: 'Meet authors, attend talks, and discover new books.', date: '2024-12-01', time: '10:00 AM', location: 'Public Library', organizerId: 'org2', imageUrl: 'https://placehold.co/600x400.png?a=6', category: 'Literature', dataAiHint: 'book festival' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    // Simulate fetching events
    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredEvents = events
    .filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(event => 
      categoryFilter === 'all' || (event.category && event.category === categoryFilter)
    );
  
  const uniqueCategories = ['all', ...new Set(mockEvents.map(event => event.category).filter(Boolean) as string[])];


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Discover Events</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find exciting events happening near you or online. Explore a variety of categories and book your spot today!
        </p>
      </header>

      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="Search events..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
           <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px] pl-10">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-foreground mb-2">No Events Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria, or check back later for new events.
          </p>
        </div>
      )}
    </div>
  );
}
