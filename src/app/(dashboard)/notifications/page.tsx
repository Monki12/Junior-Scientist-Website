
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, Loader2, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const toggleReadStatus = (notificationId: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: !notif.read } : notif
      )
    );
  };

  
  const getIconForType = (type: string) => {
    switch(type) {
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <BellRing className="h-5 w-5 text-muted-foreground" />;
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-primary">Notifications</h1>
        <p className="text-muted-foreground mt-1">Stay updated with the latest alerts and announcements.</p>
      </header>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notif => (
            <Card key={notif.id} className={`shadow-lg hover:shadow-xl transition-shadow ${!notif.read ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="pt-1">
                  {getIconForType(notif.type)}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-semibold ${!notif.read ? 'text-primary' : 'text-foreground'}`}>{notif.title}</h3>
                    {!notif.read && <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse"></span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  <p className="text-xs text-muted-foreground/70 mt-2">{new Date(notif.date).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary" onClick={() => toggleReadStatus(notif.id)}>
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
        <Button variant="outline" disabled>Load More Notifications</Button>
      </div>
    </div>
  );
}
