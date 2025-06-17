
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, Loader2, Info, CheckCircle, AlertTriangle } from 'lucide-react';

// Mock notifications
const mockNotifications = [
  { id: '1', type: 'info', title: 'Welcome to EventFlow!', message: 'Explore events and manage your activities seamlessly.', date: '2024-07-28', read: false },
  { id: '2', type: 'success', title: 'Profile Updated', message: 'Your profile information has been successfully updated.', date: '2024-07-27', read: true },
  { id: '3', type: 'warning', title: 'Upcoming Event Reminder', message: 'Tech Conference 2024 is starting in 3 days.', date: '2024-07-26', read: false },
  { id: '4', type: 'info', title: 'New Event Posted', message: 'Check out the new "Art Workshop" event in your area.', date: '2024-07-25', read: true },
];


export default function NotificationsPage() {
  const { authUser, loading } = useAuth(); // Use authUser for checking login status
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login?redirect=/notifications');
    }
  }, [authUser, loading, router]);

  if (loading || !authUser) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const getIconForType = (type: string) => {
    switch(type) {
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <BellRing className="h-5 w-5 text-muted-foreground" />;
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">Notifications</h1>
        <p className="text-muted-foreground mt-1">Stay updated with the latest alerts and announcements.</p>
      </header>

      {mockNotifications.length > 0 ? (
        <div className="space-y-4">
          {mockNotifications.map(notif => (
            <Card key={notif.id} className={`shadow-lg hover:shadow-xl transition-shadow ${!notif.read ? 'bg-primary/5 border-primary/20' : ''}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="pt-1">
                  {getIconForType(notif.type)}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-semibold ${!notif.read ? 'text-primary' : 'text-foreground'}`}>{notif.title}</h3>
                    {!notif.read && <span className="inline-block h-2 w-2 rounded-full bg-accent"></span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  <p className="text-xs text-muted-foreground/70 mt-2">{new Date(notif.date).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                  Mark as {notif.read ? 'unread' : 'read'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-10 text-center">
             <BellRing className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">No New Notifications</h3>
            <p className="text-muted-foreground">You're all caught up!</p>
          </CardContent>
        </Card>
      )}
      
       <div className="text-center mt-8">
        <Button variant="outline">Load More Notifications</Button>
      </div>
    </div>
  );
}
