
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, Loader2, Info, CheckCircle, AlertTriangle, Trophy, ExternalLink, RefreshCw } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: 'achievement' | 'announcement' | 'task' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  date: string; // ISO string from createdAt
  read: boolean;
  link?: string;
  createdAt?: any;
}

export default function NotificationsPage() {
  const { userProfile, loading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async (showToast = false) => {
    if (!userProfile) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    
    try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(notificationsRef, where('userId', '==', userProfile.uid), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedNotifications = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            } as NotificationItem;
        });

        setNotifications(fetchedNotifications);
        if (showToast) {
            toast({ title: "Refreshed", description: "Notifications are up to date."});
        }
    } catch (error) {
        console.error("Error fetching notifications:", error);
        toast({ title: "Error", description: "Could not fetch notifications.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [userProfile, toast]);

  // Set up real-time listener on mount
  useEffect(() => {
    if (loading || !userProfile) {
        if (!loading) setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userProfile.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedNotifications = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            } as NotificationItem;
        });
        setNotifications(fetchedNotifications);
        setIsLoading(false);
    }, (error) => {
        console.error("Error with real-time notifications:", error);
        toast({ title: "Real-time Error", description: "Could not listen for live updates.", variant: "destructive"});
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile, loading, toast]);

  const toggleReadStatus = async (notificationId: string, currentStatus: boolean) => {
    const notificationRef = doc(db, 'notifications', notificationId);
    try {
        await updateDoc(notificationRef, { read: !currentStatus });
        // The onSnapshot listener will automatically update the UI.
    } catch (error) {
        toast({ title: "Error", description: "Could not update notification status.", variant: "destructive"});
    }
  };
  
  const getIconForType = (type: string) => {
    switch(type) {
      case 'achievement': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <BellRing className="h-5 w-5 text-muted-foreground" />;
    }
  }

  if (loading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with the latest alerts and announcements.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchNotifications(true)} disabled={isLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refresh
        </Button>
      </header>

      {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notif => (
            <Card key={notif.id} className={cn('shadow-lg hover:shadow-xl transition-shadow', !notif.read ? 'bg-primary/5 border-primary/20' : 'bg-card')}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="pt-1">
                  {getIconForType(notif.type)}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className={cn('font-semibold', !notif.read ? 'text-primary' : 'text-foreground')}>{notif.title}</h3>
                    {!notif.read && <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse"></span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground/70">
                      {format(new Date(notif.date), "PPP 'at' p")}
                    </p>
                    {notif.link && (
                        <Button variant="link" size="sm" asChild className="p-0 h-auto text-xs">
                            <Link href={notif.link}>View <ExternalLink className="ml-1 h-3 w-3"/></Link>
                        </Button>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary" onClick={() => toggleReadStatus(notif.id, notif.read)}>
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
    </div>
  );
}
